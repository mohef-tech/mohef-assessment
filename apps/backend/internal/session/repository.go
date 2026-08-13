package session

import (
	"context"
	"encoding/json"
	"math/rand"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

type AssessmentInfo struct {
	ID              string
	QuestionBankID  string
	QuestionCount   int
	DurationMinutes int
	PassingGrade    float64
	StartTime       time.Time
	EndTime         time.Time
	Status          string
}

func (r *Repository) GetAssessment(ctx context.Context, assessmentID string) (*AssessmentInfo, error) {
	var a AssessmentInfo
	err := r.pool.QueryRow(ctx, `
		SELECT id, question_bank_id, question_count, duration_minutes, passing_grade, start_time, end_time, status
		FROM assessments WHERE id = $1
	`, assessmentID).Scan(&a.ID, &a.QuestionBankID, &a.QuestionCount, &a.DurationMinutes, &a.PassingGrade, &a.StartTime, &a.EndTime, &a.Status)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *Repository) IsParticipant(ctx context.Context, assessmentID, userID string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM assessment_participants WHERE assessment_id = $1 AND user_id = $2)
	`, assessmentID, userID).Scan(&exists)
	return exists, err
}

func (r *Repository) GetSessionByAssessmentAndUser(ctx context.Context, assessmentID, userID string) (*Session, error) {
	var s Session
	err := r.pool.QueryRow(ctx, `
		SELECT id, assessment_id, user_id, status, started_at, expires_at, submitted_at, score, passed
		FROM assessment_sessions WHERE assessment_id = $1 AND user_id = $2
	`, assessmentID, userID).Scan(&s.ID, &s.AssessmentID, &s.UserID, &s.Status, &s.StartedAt, &s.ExpiresAt, &s.SubmittedAt, &s.Score, &s.Passed)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &s, nil
}

func (r *Repository) GetSessionByID(ctx context.Context, sessionID string) (*Session, error) {
	var s Session
	err := r.pool.QueryRow(ctx, `
		SELECT id, assessment_id, user_id, status, started_at, expires_at, submitted_at, score, passed
		FROM assessment_sessions WHERE id = $1
	`, sessionID).Scan(&s.ID, &s.AssessmentID, &s.UserID, &s.Status, &s.StartedAt, &s.ExpiresAt, &s.SubmittedAt, &s.Score, &s.Passed)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

type questionSource struct {
	QuestionID         string
	VersionID          string
	QuestionText       string
	Options            []string
	CorrectOptionIndex int
	Weight             float64
}

func (r *Repository) pickRandomQuestions(ctx context.Context, bankID string, count int) ([]questionSource, error) {
	query := `
		SELECT q.id, v.id, v.question_text, v.options, v.correct_option_index, v.weight
		FROM questions q JOIN question_versions v ON v.id = q.current_version_id
		WHERE q.question_bank_id = $1
		ORDER BY random()
		LIMIT $2
	`
	rows, err := r.pool.Query(ctx, query, bankID, count)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []questionSource
	for rows.Next() {
		var qs questionSource
		var optionsRaw []byte
		if err := rows.Scan(&qs.QuestionID, &qs.VersionID, &qs.QuestionText, &optionsRaw, &qs.CorrectOptionIndex, &qs.Weight); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(optionsRaw, &qs.Options); err != nil {
			return nil, err
		}
		list = append(list, qs)
	}
	return list, rows.Err()
}

func (r *Repository) CreateSession(ctx context.Context, assessmentID, userID string, questionCount, durationMinutes int, bankID string, hardDeadline time.Time) (*Session, []SessionQuestion, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, nil, err
	}
	defer tx.Rollback(ctx)

	sources, err := r.pickRandomQuestions(ctx, bankID, questionCount)
	if err != nil {
		return nil, nil, err
	}

	expiresAt := time.Now().Add(time.Duration(durationMinutes) * time.Minute)
	if expiresAt.After(hardDeadline) {
		expiresAt = hardDeadline
	}

	var s Session
	err = tx.QueryRow(ctx, `
		INSERT INTO assessment_sessions (assessment_id, user_id, expires_at)
		VALUES ($1, $2, $3)
		RETURNING id, assessment_id, user_id, status, started_at, expires_at, submitted_at, score, passed
	`, assessmentID, userID, expiresAt).Scan(&s.ID, &s.AssessmentID, &s.UserID, &s.Status, &s.StartedAt, &s.ExpiresAt, &s.SubmittedAt, &s.Score, &s.Passed)
	if err != nil {
		return nil, nil, err
	}

	var result []SessionQuestion
	for i, src := range sources {
		perm := rand.Perm(len(src.Options))
		shuffledOptions := make([]string, len(src.Options))
		for displayIdx, originalIdx := range perm {
			shuffledOptions[displayIdx] = src.Options[originalIdx]
		}
		orderJSON, err := json.Marshal(perm)
		if err != nil {
			return nil, nil, err
		}

		_, err = tx.Exec(ctx, `
			INSERT INTO session_questions (session_id, question_id, question_version_id, display_order, option_order)
			VALUES ($1, $2, $3, $4, $5)
		`, s.ID, src.QuestionID, src.VersionID, i, orderJSON)
		if err != nil {
			return nil, nil, err
		}

		result = append(result, SessionQuestion{
			QuestionID:   src.QuestionID,
			QuestionText: src.QuestionText,
			Options:      shuffledOptions,
			DisplayOrder: i,
		})
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, nil, err
	}

	return &s, result, nil
}

func (r *Repository) GetSessionQuestions(ctx context.Context, sessionID string) ([]SessionQuestion, error) {
	query := `
		SELECT sq.question_id, v.question_text, v.options, sq.option_order, sq.display_order
		FROM session_questions sq
		JOIN question_versions v ON v.id = sq.question_version_id
		WHERE sq.session_id = $1
		ORDER BY sq.display_order
	`
	rows, err := r.pool.Query(ctx, query, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []SessionQuestion
	for rows.Next() {
		var q SessionQuestion
		var optionsRaw, orderRaw []byte
		if err := rows.Scan(&q.QuestionID, &q.QuestionText, &optionsRaw, &orderRaw, &q.DisplayOrder); err != nil {
			return nil, err
		}
		var options []string
		var order []int
		if err := json.Unmarshal(optionsRaw, &options); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(orderRaw, &order); err != nil {
			return nil, err
		}
		shuffled := make([]string, len(order))
		for displayIdx, originalIdx := range order {
			shuffled[displayIdx] = options[originalIdx]
		}
		q.Options = shuffled
		result = append(result, q)
	}
	return result, rows.Err()
}

func (r *Repository) SaveAnswer(ctx context.Context, sessionID, questionID string, selectedDisplayIndex *int) error {
	query := `
		INSERT INTO session_answers (session_id, question_id, selected_display_index)
		VALUES ($1, $2, $3)
		ON CONFLICT (session_id, question_id)
		DO UPDATE SET selected_display_index = $3, answered_at = now()
	`
	_, err := r.pool.Exec(ctx, query, sessionID, questionID, selectedDisplayIndex)
	return err
}

func (r *Repository) GetAnswers(ctx context.Context, sessionID string) (map[string]*int, error) {
	rows, err := r.pool.Query(ctx, `SELECT question_id, selected_display_index FROM session_answers WHERE session_id = $1`, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string]*int)
	for rows.Next() {
		var qid string
		var idx *int
		if err := rows.Scan(&qid, &idx); err != nil {
			return nil, err
		}
		result[qid] = idx
	}
	return result, rows.Err()
}

type ScoringRow struct {
	QuestionID         string
	OptionOrder        []int
	CorrectOptionIndex int
	Weight             float64
}

func (r *Repository) GetScoringData(ctx context.Context, sessionID string) ([]ScoringRow, error) {
	query := `
		SELECT sq.question_id, sq.option_order, v.correct_option_index, v.weight
		FROM session_questions sq
		JOIN question_versions v ON v.id = sq.question_version_id
		WHERE sq.session_id = $1
	`
	rows, err := r.pool.Query(ctx, query, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []ScoringRow
	for rows.Next() {
		var sr ScoringRow
		var orderRaw []byte
		if err := rows.Scan(&sr.QuestionID, &orderRaw, &sr.CorrectOptionIndex, &sr.Weight); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(orderRaw, &sr.OptionOrder); err != nil {
			return nil, err
		}
		result = append(result, sr)
	}
	return result, rows.Err()
}

func (r *Repository) SubmitSession(ctx context.Context, sessionID string, score float64, passed bool) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE assessment_sessions SET status = 'submitted', submitted_at = now(), score = $2, passed = $3 WHERE id = $1
	`, sessionID, score, passed)
	return err
}
