package question

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

type createBankRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

func (h *Handler) CreateBank(c *gin.Context) {
	var req createBankRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	b, err := h.service.CreateBank(c.Request.Context(), req.Name, req.Description)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create question bank"})
		return
	}
	c.JSON(http.StatusCreated, b)
}

func (h *Handler) ListBanks(c *gin.Context) {
	banks, err := h.service.ListBanks(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch question banks"})
		return
	}
	c.JSON(http.StatusOK, banks)
}

type questionRequest struct {
	QuestionText       string   `json:"question_text" binding:"required"`
	Options            []string `json:"options" binding:"required"`
	CorrectOptionIndex int      `json:"correct_option_index"`
	Weight             float64  `json:"weight" binding:"required"`
}

func (h *Handler) CreateQuestion(c *gin.Context) {
	var req questionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	q, err := h.service.CreateQuestion(c.Request.Context(), c.Param("bankId"), req.QuestionText, req.Options, req.CorrectOptionIndex, req.Weight)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, q)
}

func (h *Handler) ListQuestions(c *gin.Context) {
	questions, err := h.service.ListQuestions(c.Request.Context(), c.Param("bankId"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch questions"})
		return
	}
	c.JSON(http.StatusOK, questions)
}

func (h *Handler) GetQuestion(c *gin.Context) {
	q, err := h.service.GetQuestion(c.Request.Context(), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "question not found"})
		return
	}
	c.JSON(http.StatusOK, q)
}

func (h *Handler) UpdateQuestion(c *gin.Context) {
	var req questionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	q, err := h.service.UpdateQuestion(c.Request.Context(), c.Param("id"), req.QuestionText, req.Options, req.CorrectOptionIndex, req.Weight)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, q)
}

func (h *Handler) ListVersionHistory(c *gin.Context) {
	versions, err := h.service.ListVersionHistory(c.Request.Context(), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch version history"})
		return
	}
	c.JSON(http.StatusOK, versions)
}

func (h *Handler) DeleteQuestion(c *gin.Context) {
	if err := h.service.DeleteQuestion(c.Request.Context(), c.Param("id")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete question"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
