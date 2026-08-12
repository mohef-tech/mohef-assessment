package participant

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

type createRequest struct {
	Email    string `json:"email" binding:"required,email"`
	FullName string `json:"full_name" binding:"required"`
}

func (h *Handler) Create(c *gin.Context) {
	var req createRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	p, password, err := h.service.Create(c.Request.Context(), req.Email, req.FullName)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "gagal membuat peserta (email mungkin sudah terdaftar)"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"participant":      p,
		"initial_password": password,
	})
}

func (h *Handler) List(c *gin.Context) {
	participants, err := h.service.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch participants"})
		return
	}
	c.JSON(http.StatusOK, participants)
}

func (h *Handler) Get(c *gin.Context) {
	p, err := h.service.Get(c.Request.Context(), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "participant not found"})
		return
	}
	c.JSON(http.StatusOK, p)
}

type updateRequest struct {
	FullName string `json:"full_name" binding:"required"`
}

func (h *Handler) Update(c *gin.Context) {
	var req updateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.service.UpdateProfile(c.Request.Context(), c.Param("id"), req.FullName); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update participant"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func (h *Handler) Deactivate(c *gin.Context) {
	if err := h.service.Deactivate(c.Request.Context(), c.Param("id")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to deactivate participant"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deactivated"})
}

func (h *Handler) Activate(c *gin.Context) {
	if err := h.service.Activate(c.Request.Context(), c.Param("id")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to activate participant"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "activated"})
}

func (h *Handler) Import(c *gin.Context) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file csv wajib diupload dengan field name 'file'"})
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to open file"})
		return
	}
	defer file.Close()

	results, err := h.service.ImportCSV(c.Request.Context(), file)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, results)
}
