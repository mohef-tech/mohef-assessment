package session

import "time"

type Status string

const (
	StatusInProgress Status = "in_progress"
	StatusSubmitted  Status = "submitted"
)

type Session struct {
	ID           string     `json:"id"`
	AssessmentID string     `json:"assessment_id"`
	UserID       string     `json:"user_id"`
	Status       Status     `json:"status"`
	StartedAt    time.Time  `json:"started_at"`
	ExpiresAt    time.Time  `json:"expires_at"`
	SubmittedAt  *time.Time `json:"submitted_at,omitempty"`
	Score        *float64   `json:"score,omitempty"`
	Passed       *bool      `json:"passed,omitempty"`
}

// SessionQuestion: soal dalam urutan tampilan untuk sesi ini (soal & opsi sudah teracak)
type SessionQuestion struct {
	QuestionID   string   `json:"question_id"`
	QuestionText string   `json:"question_text"`
	Options      []string `json:"options"` // sudah dalam urutan tampilan teracak
	DisplayOrder int      `json:"display_order"`
}

type Answer struct {
	QuestionID           string `json:"question_id"`
	SelectedDisplayIndex *int   `json:"selected_display_index"`
}
