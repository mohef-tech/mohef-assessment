package auth

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func GenerateAccessToken(userID, role, secret string) (string, error) {
	claims := jwt.MapClaims{
		"sub":  userID,
		"role": role,
		"exp":  time.Now().Add(15 * time.Minute).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}
