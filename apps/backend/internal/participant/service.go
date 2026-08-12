package participant

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/csv"
	"errors"
	"io"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func generateRandomPassword() (string, error) {
	b := make([]byte, 9)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func (s *Service) Create(ctx context.Context, email, fullName string) (*Participant, string, error) {
	password, err := generateRandomPassword()
	if err != nil {
		return nil, "", err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", err
	}

	p, err := s.repo.Create(ctx, email, string(hash), fullName)
	if err != nil {
		return nil, "", err
	}
	return p, password, nil
}

func (s *Service) List(ctx context.Context) ([]*Participant, error) {
	return s.repo.List(ctx)
}

func (s *Service) Get(ctx context.Context, id string) (*Participant, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) UpdateProfile(ctx context.Context, id, fullName string) error {
	return s.repo.Update(ctx, id, fullName)
}

func (s *Service) Deactivate(ctx context.Context, id string) error {
	return s.repo.SetActive(ctx, id, false)
}

func (s *Service) Activate(ctx context.Context, id string) error {
	return s.repo.SetActive(ctx, id, true)
}

type ImportResult struct {
	Row      int    `json:"row"`
	Email    string `json:"email"`
	Success  bool   `json:"success"`
	Password string `json:"password,omitempty"`
	Error    string `json:"error,omitempty"`
}

// ImportCSV expects header: email,full_name
func (s *Service) ImportCSV(ctx context.Context, r io.Reader) ([]ImportResult, error) {
	reader := csv.NewReader(r)
	header, err := reader.Read()
	if err != nil {
		return nil, errors.New("file csv kosong atau tidak valid")
	}

	emailIdx, nameIdx := -1, -1
	for i, col := range header {
		switch strings.ToLower(strings.TrimSpace(col)) {
		case "email":
			emailIdx = i
		case "full_name":
			nameIdx = i
		}
	}
	if emailIdx == -1 || nameIdx == -1 {
		return nil, errors.New("header csv harus memiliki kolom: email, full_name")
	}

	var results []ImportResult
	rowNum := 1
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}
		rowNum++

		email := strings.TrimSpace(record[emailIdx])
		fullName := strings.TrimSpace(record[nameIdx])

		p, password, err := s.Create(ctx, email, fullName)
		if err != nil {
			results = append(results, ImportResult{Row: rowNum, Email: email, Success: false, Error: err.Error()})
			continue
		}
		results = append(results, ImportResult{Row: rowNum, Email: p.Email, Success: true, Password: password})
	}

	return results, nil
}
