package auth

import (
	"context"
	"errors"
	"time"

	"github.com/mohef-tech/mohef-assessment/backend/internal/user"
	"golang.org/x/crypto/bcrypt"
)

var ErrInvalidCredentials = errors.New("invalid email or password")

const RefreshTokenTTL = 7 * 24 * time.Hour

type Service struct {
	userRepo    user.Repository
	refreshRepo *RefreshTokenRepository
	jwtSecret   string
}

func NewService(userRepo user.Repository, refreshRepo *RefreshTokenRepository, jwtSecret string) *Service {
	return &Service{userRepo: userRepo, refreshRepo: refreshRepo, jwtSecret: jwtSecret}
}

func (s *Service) Register(ctx context.Context, email, password, fullName string, role user.Role) (*user.User, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	u := &user.User{
		Email:        email,
		PasswordHash: string(hash),
		FullName:     fullName,
		Role:         role,
	}

	if err := s.userRepo.Create(ctx, u); err != nil {
		return nil, err
	}
	return u, nil
}

func (s *Service) Login(ctx context.Context, email, password string) (accessToken, refreshToken string, err error) {
	u, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return "", "", ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)); err != nil {
		return "", "", ErrInvalidCredentials
	}

	accessToken, err = GenerateAccessToken(u.ID, string(u.Role), s.jwtSecret)
	if err != nil {
		return "", "", err
	}

	refreshToken, err = s.refreshRepo.Create(ctx, u.ID, RefreshTokenTTL)
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

func (s *Service) Refresh(ctx context.Context, rawRefreshToken string) (string, error) {
	userID, err := s.refreshRepo.Validate(ctx, rawRefreshToken)
	if err != nil {
		return "", errors.New("invalid or expired refresh token")
	}

	u, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return "", err
	}

	return GenerateAccessToken(u.ID, string(u.Role), s.jwtSecret)
}

func (s *Service) Logout(ctx context.Context, rawRefreshToken string) error {
	return s.refreshRepo.Revoke(ctx, rawRefreshToken)
}
