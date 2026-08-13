package reporting

import "context"

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetReport(ctx context.Context, assessmentID string) (*AssessmentReport, error) {
	results, err := s.repo.GetParticipantResults(ctx, assessmentID)
	if err != nil {
		return nil, err
	}

	summary := Summary{TotalParticipants: len(results)}
	var totalScore float64
	for _, r := range results {
		if r.Status == "submitted" {
			summary.SubmittedCount++
			if r.Score != nil {
				totalScore += *r.Score
			}
			if r.Passed != nil && *r.Passed {
				summary.PassCount++
			}
		}
	}
	if summary.SubmittedCount > 0 {
		summary.AverageScore = totalScore / float64(summary.SubmittedCount)
		summary.PassRate = (float64(summary.PassCount) / float64(summary.SubmittedCount)) * 100
	}

	return &AssessmentReport{
		AssessmentID: assessmentID,
		Summary:      summary,
		Ranking:      results,
	}, nil
}
