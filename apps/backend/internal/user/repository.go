package user

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	Create(ctx context.Context, u *User) error
	GetByEmail(ctx context.Context, email string) (*User, error)
	GetByID(ctx context.Context, id string) (*User, error)
}

type postgresRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresRepository(pool *pgxpool.Pool) Repository {
	return &postgresRepository{pool: pool}
}

func (r *postgresRepository) Create(ctx context.Context, u *User) error {
	query := `
		INSERT INTO users (email, password_hash, full_name, role)
		VALUES ($1, $2, $3, $4)
		RETURNING id, is_active, created_at, updated_at
	`
	return r.pool.QueryRow(ctx, query, u.Email, u.PasswordHash, u.FullName, u.Role).
		Scan(&u.ID, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
}

func (r *postgresRepository) GetByEmail(ctx context.Context, email string) (*User, error) {
	query := `
		SELECT id, email, password_hash, full_name, role, is_active, created_at, updated_at
		FROM users WHERE email = $1
	`
	var u User
	err := r.pool.QueryRow(ctx, query, email).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *postgresRepository) GetByID(ctx context.Context, id string) (*User, error) {
	query := `
		SELECT id, email, password_hash, full_name, role, is_active, created_at, updated_at
		FROM users WHERE id = $1
	`
	var u User
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &u, nil
}
