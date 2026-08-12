package assessment

import "time"

type Status string

const (
	StatusDraft     Status = "draft"
	StatusPublished Status = "published"
)

type Assessment struct {
	ID              string    `json:"id"`
	Title           string    `json:"title"`
	QuestionBankID  string    `json:"question_bank_id"`
	QuestionCount   int       `json:"question_count"`
	DurationMinutes int       `json:"duration_minutes"`
	PassingGrade    float64   `json:"passing_grade"`
	StartTime       time.Time `json:"start_time"`
	EndTime         time.Time `json:"end_time"`
	Status          Status    `json:"status"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type Participant struct {
	ID           string    `json:"id"`
	AssessmentID string    `json:"assessment_id"`
	UserID       string    `json:"user_id"`
	Email        string    `json:"email"`
	FullName     string    `json:"full_name"`
	CreatedAt    time.Time `json:"created_at"`
}
