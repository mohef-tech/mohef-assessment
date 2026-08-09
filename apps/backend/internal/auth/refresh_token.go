package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type RefreshTokenRepository struct {
	pool *pgxpool.Pool
}

func NewRefreshTokenRepository(pool *pgxpool.Pool) *RefreshTokenRepository {
	return &RefreshTokenRepository{pool: pool}
}

// generateRawToken returns a random opaque token (not JWT) sent to the client.
func generateRawToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func hashToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

func (r *RefreshTokenRepository) Create(ctx context.Context, userID string, ttl time.Duration) (rawToken string, err error) {
	raw, err := generateRawToken()
	if err != nil {
		return "", err
	}

	query := `
		INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)
	`
	_, err = r.pool.Exec(ctx, query, userID, hashToken(raw), time.Now().Add(ttl))
	if err != nil {
		return "", err
	}
	return raw, nil
}

func (r *RefreshTokenRepository) Validate(ctx context.Context, rawToken string) (userID string, err error) {
	query := `
		SELECT user_id FROM refresh_tokens
		WHERE token_hash = $1 AND revoked = false AND expires_at > now()
	`
	err = r.pool.QueryRow(ctx, query, hashToken(rawToken)).Scan(&userID)
	if err != nil {
		return "", err
	}
	return userID, nil
}

func (r *RefreshTokenRepository) Revoke(ctx context.Context, rawToken string) error {
	query := `UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1`
	_, err := r.pool.Exec(ctx, query, hashToken(rawToken))
	return err
}
