package audit

import (
	"context"
	"strings"

	"github.com/gin-gonic/gin"
)

// Middleware mencatat request non-GET yang berhasil (status 2xx) sebagai audit log,
// dipasang sekali secara global — tidak perlu mengubah handler module lain yang sudah ada.
func Middleware(repo *Repository) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		if c.Request.Method == "GET" {
			return
		}
		if c.Writer.Status() < 200 || c.Writer.Status() >= 300 {
			return
		}

		var userIDPtr *string
		if uid, exists := c.Get("user_id"); exists {
			if s, ok := uid.(string); ok && s != "" {
				userIDPtr = &s
			}
		}

		resource, resourceID := parseResource(c.FullPath())
		if resourceID == "" {
			// coba ambil dari path param umum (:id, :bankId, dst)
			for _, p := range c.Params {
				if p.Key == "id" || strings.HasSuffix(p.Key, "Id") {
					resourceID = p.Value
					break
				}
			}
		}
		var resourceIDPtr *string
		if resourceID != "" {
			resourceIDPtr = &resourceID
		}

		action := strings.ToLower(c.Request.Method) + " " + c.FullPath()

		// pakai context.Background(): biar tetap tercatat walau request context sudah selesai
		_ = repo.Create(context.Background(), userIDPtr, action, resource, resourceIDPtr, nil)
	}
}

func parseResource(fullPath string) (resource, resourceID string) {
	parts := strings.Split(strings.Trim(fullPath, "/"), "/")
	if len(parts) > 0 {
		resource = parts[0]
	}
	return resource, ""
}
