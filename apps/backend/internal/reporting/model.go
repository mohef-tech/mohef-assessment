package reporting

import "time"

type ParticipantResult struct {
	UserID      string     `json:"user_id"`
	Email       string     `json:"email"`
	FullName    string     `json:"full_name"`
	Status      string     `json:"status"`
	Score       *float64   `json:"score,omitempty"`
	Passed      *bool      `json:"passed,omitempty"`
	SubmittedAt *time.Time `json:"submitted_at,omitempty"`
}

type Summary struct {
	TotalParticipants int     `json:"total_participants"`
	SubmittedCount    int     `json:"submitted_count"`
	AverageScore      float64 `json:"average_score"`
	PassCount         int     `json:"pass_count"`
	PassRate          float64 `json:"pass_rate"`
}

type AssessmentReport struct {
	AssessmentID string              `json:"assessment_id"`
	Summary      Summary             `json:"summary"`
	Ranking      []ParticipantResult `json:"ranking"`
}
