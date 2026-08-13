package reporting

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

func (r *Repository) GetParticipantResults(ctx context.Context, assessmentID string) ([]ParticipantResult, error) {
	query := `
		SELECT ap.user_id, u.email, u.full_name,
		       COALESCE(s.status, 'not_started') AS status,
		       s.score, s.passed, s.submitted_at
		FROM assessment_participants ap
		JOIN users u ON u.id = ap.user_id
		LEFT JOIN assessment_sessions s ON s.assessment_id = ap.assessment_id AND s.user_id = ap.user_id
		WHERE ap.assessment_id = $1
		ORDER BY s.score DESC NULLS LAST, u.full_name
	`
	rows, err := r.pool.Query(ctx, query, assessmentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []ParticipantResult
	for rows.Next() {
		var pr ParticipantResult
		if err := rows.Scan(&pr.UserID, &pr.Email, &pr.FullName, &pr.Status, &pr.Score, &pr.Passed, &pr.SubmittedAt); err != nil {
			return nil, err
		}
		results = append(results, pr)
	}
	return results, rows.Err()
}
