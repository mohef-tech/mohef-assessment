package session

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func errStatus(err error) int {
	switch {
	case errors.Is(err, ErrAssessmentNotPublished), errors.Is(err, ErrNotWithinSchedule), errors.Is(err, ErrAlreadySubmitted), errors.Is(err, ErrSessionExpired):
		return http.StatusBadRequest
	case errors.Is(err, ErrNotParticipant), errors.Is(err, ErrForbidden):
		return http.StatusForbidden
	case errors.Is(err, ErrSessionNotFound):
		return http.StatusNotFound
	default:
		return http.StatusInternalServerError
	}
}

func (h *Handler) Start(c *gin.Context) {
	userID := c.GetString("user_id")
	assessmentID := c.Param("id")

	sess, questions, err := h.service.Start(c.Request.Context(), assessmentID, userID)
	if err != nil {
		c.JSON(errStatus(err), gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"session": sess, "questions": questions})
}

func (h *Handler) GetQuestions(c *gin.Context) {
	userID := c.GetString("user_id")
	sessionID := c.Param("sessionId")

	questions, err := h.service.GetQuestions(c.Request.Context(), sessionID, userID)
	if err != nil {
		c.JSON(errStatus(err), gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, questions)
}

type answerRequest struct {
	SelectedDisplayIndex *int `json:"selected_display_index"`
}

func (h *Handler) SaveAnswer(c *gin.Context) {
	userID := c.GetString("user_id")
	sessionID := c.Param("sessionId")
	questionID := c.Param("questionId")

	var req answerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.SaveAnswer(c.Request.Context(), sessionID, userID, questionID, req.SelectedDisplayIndex); err != nil {
		c.JSON(errStatus(err), gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "saved"})
}

func (h *Handler) Submit(c *gin.Context) {
	userID := c.GetString("user_id")
	sessionID := c.Param("sessionId")

	result, err := h.service.Submit(c.Request.Context(), sessionID, userID)
	if err != nil {
		c.JSON(errStatus(err), gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}
