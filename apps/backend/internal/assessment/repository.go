package assessment

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) Create(ctx context.Context, a *Assessment) error {
	query := `
		INSERT INTO assessments (title, question_bank_id, question_count, duration_minutes, passing_grade, start_time, end_time)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, status, created_at, updated_at
	`
	return r.pool.QueryRow(ctx, query, a.Title, a.QuestionBankID, a.QuestionCount, a.DurationMinutes, a.PassingGrade, a.StartTime, a.EndTime).
		Scan(&a.ID, &a.Status, &a.CreatedAt, &a.UpdatedAt)
}

func (r *Repository) List(ctx context.Context) ([]*Assessment, error) {
	query := `
		SELECT id, title, question_bank_id, question_count, duration_minutes, passing_grade, start_time, end_time, status, created_at, updated_at
		FROM assessments ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*Assessment
	for rows.Next() {
		var a Assessment
		if err := rows.Scan(&a.ID, &a.Title, &a.QuestionBankID, &a.QuestionCount, &a.DurationMinutes, &a.PassingGrade, &a.StartTime, &a.EndTime, &a.Status, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, &a)
	}
	return list, rows.Err()
}

func (r *Repository) GetByID(ctx context.Context, id string) (*Assessment, error) {
	query := `
		SELECT id, title, question_bank_id, question_count, duration_minutes, passing_grade, start_time, end_time, status, created_at, updated_at
		FROM assessments WHERE id = $1
	`
	var a Assessment
	err := r.pool.QueryRow(ctx, query, id).
		Scan(&a.ID, &a.Title, &a.QuestionBankID, &a.QuestionCount, &a.DurationMinutes, &a.PassingGrade, &a.StartTime, &a.EndTime, &a.Status, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *Repository) Update(ctx context.Context, a *Assessment) error {
	query := `
		UPDATE assessments
		SET title = $1, question_bank_id = $2, question_count = $3, duration_minutes = $4,
		    passing_grade = $5, start_time = $6, end_time = $7, updated_at = now()
		WHERE id = $8 AND status = 'draft'
	`
	tag, err := r.pool.Exec(ctx, query, a.Title, a.QuestionBankID, a.QuestionCount, a.DurationMinutes, a.PassingGrade, a.StartTime, a.EndTime, a.ID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotDraftOrNotFound
	}
	return nil
}

func (r *Repository) Publish(ctx context.Context, id string) error {
	query := `UPDATE assessments SET status = 'published', updated_at = now() WHERE id = $1 AND status = 'draft'`
	tag, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotDraftOrNotFound
	}
	return nil
}

func (r *Repository) CountQuestionsInBank(ctx context.Context, bankID string) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM questions WHERE question_bank_id = $1`, bankID).Scan(&count)
	return count, err
}

func (r *Repository) AddParticipants(ctx context.Context, assessmentID string, userIDs []string) error {
	query := `
		INSERT INTO assessment_participants (assessment_id, user_id)
		VALUES ($1, $2)
		ON CONFLICT (assessment_id, user_id) DO NOTHING
	`
	batch := &pgxBatchWrapper{}
	for _, uid := range userIDs {
		if _, err := r.pool.Exec(ctx, query, assessmentID, uid); err != nil {
			return err
		}
	}
	_ = batch
	return nil
}

func (r *Repository) ListParticipants(ctx context.Context, assessmentID string) ([]*Participant, error) {
	query := `
		SELECT ap.id, ap.assessment_id, ap.user_id, u.email, u.full_name, ap.created_at
		FROM assessment_participants ap
		JOIN users u ON u.id = ap.user_id
		WHERE ap.assessment_id = $1
		ORDER BY ap.created_at
	`
	rows, err := r.pool.Query(ctx, query, assessmentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*Participant
	for rows.Next() {
		var p Participant
		if err := rows.Scan(&p.ID, &p.AssessmentID, &p.UserID, &p.Email, &p.FullName, &p.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, &p)
	}
	return list, rows.Err()
}

func (r *Repository) CountParticipants(ctx context.Context, assessmentID string) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM assessment_participants WHERE assessment_id = $1`, assessmentID).Scan(&count)
	return count, err
}

type pgxBatchWrapper struct{}
