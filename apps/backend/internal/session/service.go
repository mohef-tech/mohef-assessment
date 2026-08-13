package session

import (
	"context"
	"errors"
	"time"
)

var (
	ErrAssessmentNotPublished = errors.New("assessment belum dipublish")
	ErrNotWithinSchedule      = errors.New("saat ini di luar jadwal assessment")
	ErrNotParticipant         = errors.New("anda bukan peserta assessment ini")
	ErrAlreadySubmitted       = errors.New("sesi ujian ini sudah disubmit")
	ErrSessionNotFound        = errors.New("sesi ujian tidak ditemukan")
	ErrForbidden              = errors.New("anda tidak memiliki akses ke sesi ini")
	ErrSessionExpired         = errors.New("waktu ujian sudah habis")
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Start(ctx context.Context, assessmentID, userID string) (*Session, []SessionQuestion, error) {
	a, err := s.repo.GetAssessment(ctx, assessmentID)
	if err != nil {
		return nil, nil, err
	}
	if a.Status != "published" {
		return nil, nil, ErrAssessmentNotPublished
	}
	now := time.Now()
	if now.Before(a.StartTime) || now.After(a.EndTime) {
		return nil, nil, ErrNotWithinSchedule
	}

	isParticipant, err := s.repo.IsParticipant(ctx, assessmentID, userID)
	if err != nil {
		return nil, nil, err
	}
	if !isParticipant {
		return nil, nil, ErrNotParticipant
	}

	existing, err := s.repo.GetSessionByAssessmentAndUser(ctx, assessmentID, userID)
	if err != nil {
		return nil, nil, err
	}
	if existing != nil {
		if existing.Status == StatusSubmitted {
			return nil, nil, ErrAlreadySubmitted
		}
		questions, err := s.repo.GetSessionQuestions(ctx, existing.ID)
		if err != nil {
			return nil, nil, err
		}
		return existing, questions, nil
	}

	return s.repo.CreateSession(ctx, assessmentID, userID, a.QuestionCount, a.DurationMinutes, a.QuestionBankID, a.EndTime)
}

func (s *Service) getOwnedSession(ctx context.Context, sessionID, userID string) (*Session, error) {
	sess, err := s.repo.GetSessionByID(ctx, sessionID)
	if err != nil {
		return nil, ErrSessionNotFound
	}
	if sess.UserID != userID {
		return nil, ErrForbidden
	}
	return sess, nil
}

func (s *Service) autoSubmitIfExpired(ctx context.Context, sess *Session) (*Session, error) {
	if sess.Status == StatusInProgress && time.Now().After(sess.ExpiresAt) {
		if _, err := s.doSubmit(ctx, sess.ID); err != nil {
			return nil, err
		}
		return s.repo.GetSessionByID(ctx, sess.ID)
	}
	return sess, nil
}

func (s *Service) GetQuestions(ctx context.Context, sessionID, userID string) ([]SessionQuestion, error) {
	sess, err := s.getOwnedSession(ctx, sessionID, userID)
	if err != nil {
		return nil, err
	}
	if _, err := s.autoSubmitIfExpired(ctx, sess); err != nil {
		return nil, err
	}
	return s.repo.GetSessionQuestions(ctx, sessionID)
}

func (s *Service) SaveAnswer(ctx context.Context, sessionID, userID, questionID string, selectedDisplayIndex *int) error {
	sess, err := s.getOwnedSession(ctx, sessionID, userID)
	if err != nil {
		return err
	}
	sess, err = s.autoSubmitIfExpired(ctx, sess)
	if err != nil {
		return err
	}
	if sess.Status != StatusInProgress {
		return ErrSessionExpired
	}
	return s.repo.SaveAnswer(ctx, sessionID, questionID, selectedDisplayIndex)
}

type SubmitResult struct {
	Score  float64 `json:"score"`
	Passed bool    `json:"passed"`
}

func (s *Service) doSubmit(ctx context.Context, sessionID string) (*SubmitResult, error) {
	scoringRows, err := s.repo.GetScoringData(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	answers, err := s.repo.GetAnswers(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	var totalWeight, earnedWeight float64
	for _, row := range scoringRows {
		totalWeight += row.Weight
		selected, ok := answers[row.QuestionID]
		if !ok || selected == nil {
			continue
		}
		if *selected < 0 || *selected >= len(row.OptionOrder) {
			continue
		}
		if row.OptionOrder[*selected] == row.CorrectOptionIndex {
			earnedWeight += row.Weight
		}
	}

	score := 0.0
	if totalWeight > 0 {
		score = (earnedWeight / totalWeight) * 100
	}

	sess, err := s.repo.GetSessionByID(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	a, err := s.repo.GetAssessment(ctx, sess.AssessmentID)
	if err != nil {
		return nil, err
	}
	passed := score >= a.PassingGrade

	if err := s.repo.SubmitSession(ctx, sessionID, score, passed); err != nil {
		return nil, err
	}

	return &SubmitResult{Score: score, Passed: passed}, nil
}

func (s *Service) Submit(ctx context.Context, sessionID, userID string) (*SubmitResult, error) {
	sess, err := s.getOwnedSession(ctx, sessionID, userID)
	if err != nil {
		return nil, err
	}
	if sess.Status == StatusSubmitted {
		return nil, ErrAlreadySubmitted
	}
	return s.doSubmit(ctx, sessionID)
}
