package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/mohef-tech/mohef-assessment/backend/internal/user"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

type registerRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	FullName string `json:"full_name" binding:"required"`
	Role     string `json:"role" binding:"required"`
}

func (h *Handler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	u, err := h.service.Register(c.Request.Context(), req.Email, req.Password, req.FullName, user.Role(req.Role))
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "email already registered or invalid role"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": u.ID, "email": u.Email})
}

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (h *Handler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	accessToken, refreshToken, err := h.service.Login(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	csrfToken, err := generateCSRFToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to issue session"})
		return
	}

	// HttpOnly: refresh token tidak bisa diakses lewat JS (mitigasi XSS)
	c.SetCookie("refresh_token", refreshToken, int(RefreshTokenTTL.Seconds()), "/auth", "", false, true)
	// csrf_token sengaja TIDAK HttpOnly — frontend baca ini, kirim balik di header X-CSRF-Token
	c.SetCookie("csrf_token", csrfToken, int(RefreshTokenTTL.Seconds()), "/", "", false, false)

	c.JSON(http.StatusOK, gin.H{"access_token": accessToken})
}

func (h *Handler) Refresh(c *gin.Context) {
	rawToken, err := c.Cookie("refresh_token")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "refresh token missing"})
		return
	}

	accessToken, err := h.service.Refresh(c.Request.Context(), rawToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"access_token": accessToken})
}

func (h *Handler) Logout(c *gin.Context) {
	rawToken, err := c.Cookie("refresh_token")
	if err == nil {
		_ = h.service.Logout(c.Request.Context(), rawToken)
	}

	c.SetCookie("refresh_token", "", -1, "/auth", "", false, true)
	c.SetCookie("csrf_token", "", -1, "/", "", false, false)

	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}
