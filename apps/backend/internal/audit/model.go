package audit

import (
	"encoding/json"
	"time"
)

type Log struct {
	ID         string          `json:"id"`
	UserID     *string         `json:"user_id"`
	Action     string          `json:"action"`
	Resource   string          `json:"resource"`
	ResourceID *string         `json:"resource_id"`
	Metadata   json.RawMessage `json:"metadata"`
	CreatedAt  time.Time       `json:"created_at"`
}
