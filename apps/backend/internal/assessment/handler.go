package assessment

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

type assessmentRequest struct {
	Title           string    `json:"title" binding:"required"`
	QuestionBankID  string    `json:"question_bank_id" binding:"required"`
	QuestionCount   int       `json:"question_count" binding:"required,min=1"`
	DurationMinutes int       `json:"duration_minutes" binding:"required,min=1"`
	PassingGrade    float64   `json:"passing_grade" binding:"required"`
	StartTime       time.Time `json:"start_time" binding:"required"`
	EndTime         time.Time `json:"end_time" binding:"required"`
}

func toAssessment(req assessmentRequest) *Assessment {
	return &Assessment{
		Title:           req.Title,
		QuestionBankID:  req.QuestionBankID,
		QuestionCount:   req.QuestionCount,
		DurationMinutes: req.DurationMinutes,
		PassingGrade:    req.PassingGrade,
		StartTime:       req.StartTime,
		EndTime:         req.EndTime,
	}
}

func (h *Handler) Create(c *gin.Context) {
	var req assessmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	a := toAssessment(req)
	if err := h.service.Create(c.Request.Context(), a); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, a)
}

func (h *Handler) List(c *gin.Context) {
	list, err := h.service.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch assessments"})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *Handler) Get(c *gin.Context) {
	a, err := h.service.Get(c.Request.Context(), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "assessment not found"})
		return
	}
	c.JSON(http.StatusOK, a)
}

func (h *Handler) Update(c *gin.Context) {
	var req assessmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	a := toAssessment(req)
	a.ID = c.Param("id")
	if err := h.service.Update(c.Request.Context(), a); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

type addParticipantsRequest struct {
	UserIDs []string `json:"user_ids" binding:"required,min=1"`
}

func (h *Handler) AddParticipants(c *gin.Context) {
	var req addParticipantsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.AddParticipants(c.Request.Context(), c.Param("id"), req.UserIDs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to add participants"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "participants added"})
}

func (h *Handler) ListParticipants(c *gin.Context) {
	list, err := h.service.ListParticipants(c.Request.Context(), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch participants"})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *Handler) Publish(c *gin.Context) {
	if err := h.service.Publish(c.Request.Context(), c.Param("id")); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "published"})
}
