package auth

import (
	"context"
	"errors"

	"github.com/mohef-tech/mohef-assessment/backend/internal/user"
	"golang.org/x/crypto/bcrypt"
)

var ErrInvalidCredentials = errors.New("invalid email or password")

type Service struct {
	userRepo  user.Repository
	jwtSecret string
}

func NewService(userRepo user.Repository, jwtSecret string) *Service {
	return &Service{userRepo: userRepo, jwtSecret: jwtSecret}
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

func (s *Service) Login(ctx context.Context, email, password string) (string, error) {
	u, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return "", ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)); err != nil {
		return "", ErrInvalidCredentials
	}

	return GenerateAccessToken(u.ID, string(u.Role), s.jwtSecret)
}
