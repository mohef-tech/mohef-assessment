package user

import "time"

type Role string

const (
	RoleAdministrator Role = "administrator"
	RoleOperator      Role = "operator"
	RolePeserta       Role = "peserta"
)

type User struct {
	ID           string
	Email        string
	PasswordHash string
	FullName     string
	Role         Role
	IsActive     bool
	CreatedAt    time.Time
	UpdatedAt    time.Time
}
