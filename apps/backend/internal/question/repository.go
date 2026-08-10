package question

import (
	"context"
	"encoding/json"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) CreateBank(ctx context.Context, b *QuestionBank) error {
	query := `INSERT INTO question_banks (name, description) VALUES ($1, $2) RETURNING id, created_at, updated_at`
	return r.pool.QueryRow(ctx, query, b.Name, b.Description).Scan(&b.ID, &b.CreatedAt, &b.UpdatedAt)
}

func (r *Repository) ListBanks(ctx context.Context) ([]*QuestionBank, error) {
	query := `SELECT id, name, description, created_at, updated_at FROM question_banks ORDER BY created_at DESC`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var banks []*QuestionBank
	for rows.Next() {
		var b QuestionBank
		if err := rows.Scan(&b.ID, &b.Name, &b.Description, &b.CreatedAt, &b.UpdatedAt); err != nil {
			return nil, err
		}
		banks = append(banks, &b)
	}
	return banks, rows.Err()
}

func (r *Repository) CreateQuestion(ctx context.Context, bankID, text string, options []string, correctIdx int, weight float64) (*QuestionWithVersion, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var questionID string
	if err := tx.QueryRow(ctx, `INSERT INTO questions (question_bank_id) VALUES ($1) RETURNING id`, bankID).Scan(&questionID); err != nil {
		return nil, err
	}

	optionsJSON, err := json.Marshal(options)
	if err != nil {
		return nil, err
	}

	var versionID string
	var createdAt time.Time
	err = tx.QueryRow(ctx, `
		INSERT INTO question_versions (question_id, version_number, question_text, options, correct_option_index, weight)
		VALUES ($1, 1, $2, $3, $4, $5) RETURNING id, created_at
	`, questionID, text, optionsJSON, correctIdx, weight).Scan(&versionID, &createdAt)
	if err != nil {
		return nil, err
	}

	var updatedAt time.Time
	err = tx.QueryRow(ctx, `UPDATE questions SET current_version_id = $1, updated_at = now() WHERE id = $2 RETURNING updated_at`, versionID, questionID).Scan(&updatedAt)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &QuestionWithVersion{
		ID: questionID, QuestionBankID: bankID, VersionNumber: 1,
		QuestionText: text, Options: options, CorrectOptionIndex: correctIdx, Weight: weight,
		CreatedAt: createdAt, UpdatedAt: updatedAt,
	}, nil
}

func (r *Repository) UpdateQuestion(ctx context.Context, questionID, text string, options []string, correctIdx int, weight float64) (*QuestionWithVersion, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var bankID string
	var lastVersion int
	err = tx.QueryRow(ctx, `
		SELECT q.question_bank_id, COALESCE(MAX(v.version_number), 0)
		FROM questions q LEFT JOIN question_versions v ON v.question_id = q.id
		WHERE q.id = $1 GROUP BY q.question_bank_id
	`, questionID).Scan(&bankID, &lastVersion)
	if err != nil {
		return nil, err
	}

	optionsJSON, err := json.Marshal(options)
	if err != nil {
		return nil, err
	}

	newVersion := lastVersion + 1
	var versionID string
	var createdAt time.Time
	err = tx.QueryRow(ctx, `
		INSERT INTO question_versions (question_id, version_number, question_text, options, correct_option_index, weight)
		VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at
	`, questionID, newVersion, text, optionsJSON, correctIdx, weight).Scan(&versionID, &createdAt)
	if err != nil {
		return nil, err
	}

	var updatedAt time.Time
	err = tx.QueryRow(ctx, `UPDATE questions SET current_version_id = $1, updated_at = now() WHERE id = $2 RETURNING updated_at`, versionID, questionID).Scan(&updatedAt)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &QuestionWithVersion{
		ID: questionID, QuestionBankID: bankID, VersionNumber: newVersion,
		QuestionText: text, Options: options, CorrectOptionIndex: correctIdx, Weight: weight,
		CreatedAt: createdAt, UpdatedAt: updatedAt,
	}, nil
}

func (r *Repository) ListQuestionsByBank(ctx context.Context, bankID string) ([]*QuestionWithVersion, error) {
	query := `
		SELECT q.id, q.question_bank_id, v.version_number, v.question_text, v.options, v.correct_option_index, v.weight, v.created_at, q.updated_at
		FROM questions q JOIN question_versions v ON v.id = q.current_version_id
		WHERE q.question_bank_id = $1 ORDER BY q.created_at DESC
	`
	rows, err := r.pool.Query(ctx, query, bankID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*QuestionWithVersion
	for rows.Next() {
		var q QuestionWithVersion
		var optionsRaw []byte
		if err := rows.Scan(&q.ID, &q.QuestionBankID, &q.VersionNumber, &q.QuestionText, &optionsRaw, &q.CorrectOptionIndex, &q.Weight, &q.CreatedAt, &q.UpdatedAt); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(optionsRaw, &q.Options); err != nil {
			return nil, err
		}
		result = append(result, &q)
	}
	return result, rows.Err()
}

func (r *Repository) GetQuestion(ctx context.Context, questionID string) (*QuestionWithVersion, error) {
	query := `
		SELECT q.id, q.question_bank_id, v.version_number, v.question_text, v.options, v.correct_option_index, v.weight, v.created_at, q.updated_at
		FROM questions q JOIN question_versions v ON v.id = q.current_version_id
		WHERE q.id = $1
	`
	var q QuestionWithVersion
	var optionsRaw []byte
	err := r.pool.QueryRow(ctx, query, questionID).Scan(&q.ID, &q.QuestionBankID, &q.VersionNumber, &q.QuestionText, &optionsRaw, &q.CorrectOptionIndex, &q.Weight, &q.CreatedAt, &q.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal(optionsRaw, &q.Options); err != nil {
		return nil, err
	}
	return &q, nil
}

func (r *Repository) ListVersions(ctx context.Context, questionID string) ([]*QuestionVersion, error) {
	query := `
		SELECT id, question_id, version_number, question_text, options, correct_option_index, weight, created_at
		FROM question_versions WHERE question_id = $1 ORDER BY version_number DESC
	`
	rows, err := r.pool.Query(ctx, query, questionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var versions []*QuestionVersion
	for rows.Next() {
		var v QuestionVersion
		var optionsRaw []byte
		if err := rows.Scan(&v.ID, &v.QuestionID, &v.VersionNumber, &v.QuestionText, &optionsRaw, &v.CorrectOptionIndex, &v.Weight, &v.CreatedAt); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(optionsRaw, &v.Options); err != nil {
			return nil, err
		}
		versions = append(versions, &v)
	}
	return versions, rows.Err()
}

func (r *Repository) DeleteQuestion(ctx context.Context, questionID string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM questions WHERE id = $1`, questionID)
	return err
}
