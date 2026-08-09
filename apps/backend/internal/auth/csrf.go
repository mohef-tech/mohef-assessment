package auth

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"

	"github.com/gin-gonic/gin"
)

func generateCSRFToken() (string, error) {
	b := make([]byte, 24)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func CSRFMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		cookieToken, err := c.Cookie("csrf_token")
		if err != nil || cookieToken == "" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "csrf token missing"})
			return
		}

		headerToken := c.GetHeader("X-CSRF-Token")
		if headerToken == "" || headerToken != cookieToken {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "csrf token invalid"})
			return
		}

		c.Next()
	}
}
