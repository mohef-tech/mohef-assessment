package assessment

import "context"

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) validate(ctx context.Context, a *Assessment) error {
	if !a.StartTime.Before(a.EndTime) {
		return ErrInvalidTimeRange
	}
	available, err := s.repo.CountQuestionsInBank(ctx, a.QuestionBankID)
	if err != nil {
		return err
	}
	if a.QuestionCount > available {
		return ErrQuestionCountExceeds
	}
	return nil
}

func (s *Service) Create(ctx context.Context, a *Assessment) error {
	if err := s.validate(ctx, a); err != nil {
		return err
	}
	return s.repo.Create(ctx, a)
}

func (s *Service) List(ctx context.Context) ([]*Assessment, error) {
	return s.repo.List(ctx)
}

func (s *Service) Get(ctx context.Context, id string) (*Assessment, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) Update(ctx context.Context, a *Assessment) error {
	if err := s.validate(ctx, a); err != nil {
		return err
	}
	return s.repo.Update(ctx, a)
}

func (s *Service) AddParticipants(ctx context.Context, assessmentID string, userIDs []string) error {
	return s.repo.AddParticipants(ctx, assessmentID, userIDs)
}

func (s *Service) ListParticipants(ctx context.Context, assessmentID string) ([]*Participant, error) {
	return s.repo.ListParticipants(ctx, assessmentID)
}

func (s *Service) Publish(ctx context.Context, assessmentID string) error {
	a, err := s.repo.GetByID(ctx, assessmentID)
	if err != nil {
		return err
	}

	available, err := s.repo.CountQuestionsInBank(ctx, a.QuestionBankID)
	if err != nil {
		return err
	}
	if a.QuestionCount > available {
		return ErrQuestionCountExceeds
	}

	count, err := s.repo.CountParticipants(ctx, assessmentID)
	if err != nil {
		return err
	}
	if count == 0 {
		return ErrNoParticipants
	}

	return s.repo.Publish(ctx, assessmentID)
}
