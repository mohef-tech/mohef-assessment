package participant

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

func (r *Repository) Create(ctx context.Context, email, passwordHash, fullName string) (*Participant, error) {
	query := `
		INSERT INTO users (email, password_hash, full_name, role)
		VALUES ($1, $2, $3, 'peserta')
		RETURNING id, email, full_name, is_active, created_at, updated_at
	`
	var p Participant
	err := r.pool.QueryRow(ctx, query, email, passwordHash, fullName).
		Scan(&p.ID, &p.Email, &p.FullName, &p.IsActive, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *Repository) List(ctx context.Context) ([]*Participant, error) {
	query := `
		SELECT id, email, full_name, is_active, created_at, updated_at
		FROM users WHERE role = 'peserta' ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var participants []*Participant
	for rows.Next() {
		var p Participant
		if err := rows.Scan(&p.ID, &p.Email, &p.FullName, &p.IsActive, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		participants = append(participants, &p)
	}
	return participants, rows.Err()
}

func (r *Repository) GetByID(ctx context.Context, id string) (*Participant, error) {
	query := `
		SELECT id, email, full_name, is_active, created_at, updated_at
		FROM users WHERE id = $1 AND role = 'peserta'
	`
	var p Participant
	err := r.pool.QueryRow(ctx, query, id).
		Scan(&p.ID, &p.Email, &p.FullName, &p.IsActive, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *Repository) Update(ctx context.Context, id, fullName string) error {
	query := `UPDATE users SET full_name = $1, updated_at = now() WHERE id = $2 AND role = 'peserta'`
	_, err := r.pool.Exec(ctx, query, fullName, id)
	return err
}

func (r *Repository) SetActive(ctx context.Context, id string, active bool) error {
	query := `UPDATE users SET is_active = $1, updated_at = now() WHERE id = $2 AND role = 'peserta'`
	_, err := r.pool.Exec(ctx, query, active, id)
	return err
}
