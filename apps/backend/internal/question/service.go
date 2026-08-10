package question

import (
	"context"
	"errors"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) CreateBank(ctx context.Context, name, description string) (*QuestionBank, error) {
	b := &QuestionBank{Name: name, Description: description}
	if err := s.repo.CreateBank(ctx, b); err != nil {
		return nil, err
	}
	return b, nil
}

func (s *Service) ListBanks(ctx context.Context) ([]*QuestionBank, error) {
	return s.repo.ListBanks(ctx)
}

func validateQuestionInput(options []string, correctIdx int) error {
	if len(options) < 2 {
		return errors.New("minimal 2 pilihan jawaban")
	}
	if correctIdx < 0 || correctIdx >= len(options) {
		return errors.New("correct_option_index di luar jangkauan opsi")
	}
	return nil
}

func (s *Service) CreateQuestion(ctx context.Context, bankID, text string, options []string, correctIdx int, weight float64) (*QuestionWithVersion, error) {
	if err := validateQuestionInput(options, correctIdx); err != nil {
		return nil, err
	}
	return s.repo.CreateQuestion(ctx, bankID, text, options, correctIdx, weight)
}

func (s *Service) UpdateQuestion(ctx context.Context, questionID, text string, options []string, correctIdx int, weight float64) (*QuestionWithVersion, error) {
	if err := validateQuestionInput(options, correctIdx); err != nil {
		return nil, err
	}
	return s.repo.UpdateQuestion(ctx, questionID, text, options, correctIdx, weight)
}

func (s *Service) ListQuestions(ctx context.Context, bankID string) ([]*QuestionWithVersion, error) {
	return s.repo.ListQuestionsByBank(ctx, bankID)
}

func (s *Service) GetQuestion(ctx context.Context, questionID string) (*QuestionWithVersion, error) {
	return s.repo.GetQuestion(ctx, questionID)
}

func (s *Service) ListVersionHistory(ctx context.Context, questionID string) ([]*QuestionVersion, error) {
	return s.repo.ListVersions(ctx, questionID)
}

func (s *Service) DeleteQuestion(ctx context.Context, questionID string) error {
	return s.repo.DeleteQuestion(ctx, questionID)
}
