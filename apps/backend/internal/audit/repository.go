package audit

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

func (r *Repository) Create(ctx context.Context, userID *string, action, resource string, resourceID *string, metadata []byte) error {
	query := `
		INSERT INTO audit_logs (user_id, action, resource, resource_id, metadata)
		VALUES ($1, $2, $3, $4, $5)
	`
	_, err := r.pool.Exec(ctx, query, userID, action, resource, resourceID, metadata)
	return err
}

func (r *Repository) List(ctx context.Context, limit int) ([]*Log, error) {
	query := `
		SELECT id, user_id, action, resource, resource_id, metadata, created_at
		FROM audit_logs ORDER BY created_at DESC LIMIT $1
	`
	rows, err := r.pool.Query(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []*Log
	for rows.Next() {
		var l Log
		if err := rows.Scan(&l.ID, &l.UserID, &l.Action, &l.Resource, &l.ResourceID, &l.Metadata, &l.CreatedAt); err != nil {
			return nil, err
		}
		logs = append(logs, &l)
	}
	return logs, rows.Err()
}
