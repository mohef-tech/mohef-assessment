package question

import "time"

type QuestionBank struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type QuestionVersion struct {
	ID                 string    `json:"id"`
	QuestionID         string    `json:"question_id"`
	VersionNumber      int       `json:"version_number"`
	QuestionText       string    `json:"question_text"`
	Options            []string  `json:"options"`
	CorrectOptionIndex int       `json:"correct_option_index"`
	Weight             float64   `json:"weight"`
	CreatedAt          time.Time `json:"created_at"`
}

// QuestionWithVersion: gabungan question + versi aktifnya, dipakai sebagai response API
type QuestionWithVersion struct {
	ID                 string    `json:"id"`
	QuestionBankID     string    `json:"question_bank_id"`
	VersionNumber      int       `json:"version_number"`
	QuestionText       string    `json:"question_text"`
	Options            []string  `json:"options"`
	CorrectOptionIndex int       `json:"correct_option_index"`
	Weight             float64   `json:"weight"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}
