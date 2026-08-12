package main

import (
	"log"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/mohef-tech/mohef-assessment/backend/internal/assessment"
	"github.com/mohef-tech/mohef-assessment/backend/internal/auth"
	"github.com/mohef-tech/mohef-assessment/backend/internal/config"
	"github.com/mohef-tech/mohef-assessment/backend/internal/database"
	"github.com/mohef-tech/mohef-assessment/backend/internal/participant"
	"github.com/mohef-tech/mohef-assessment/backend/internal/question"
	"github.com/mohef-tech/mohef-assessment/backend/internal/user"
)

func main() {
	cfg := config.Load()

	pool, err := database.NewPostgresPool(cfg)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()

	userRepo := user.NewPostgresRepository(pool)
	refreshRepo := auth.NewRefreshTokenRepository(pool)
	authService := auth.NewService(userRepo, refreshRepo, cfg.JWTSecret)
	authHandler := auth.NewHandler(authService)

	userService := user.NewService(userRepo)
	userHandler := user.NewHandler(userService)

	questionRepo := question.NewRepository(pool)
	questionService := question.NewService(questionRepo)
	questionHandler := question.NewHandler(questionService)

	participantRepo := participant.NewRepository(pool)
	participantService := participant.NewService(participantRepo)
	participantHandler := participant.NewHandler(participantService)

	assessmentRepo := assessment.NewRepository(pool)
	assessmentService := assessment.NewService(assessmentRepo)
	assessmentHandler := assessment.NewHandler(assessmentService)

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-CSRF-Token"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.GET("/health", func(c *gin.Context) {
		if err := pool.Ping(c.Request.Context()); err != nil {
			c.JSON(500, gin.H{"status": "db unreachable"})
			return
		}
		c.JSON(200, gin.H{"status": "ok"})
	})

	authGroup := r.Group("/auth")
	authGroup.POST("/register", authHandler.Register)
	authGroup.POST("/login", authHandler.Login)
	authGroup.POST("/refresh", auth.CSRFMiddleware(), authHandler.Refresh)
	authGroup.POST("/logout", auth.CSRFMiddleware(), authHandler.Logout)

	userGroup := r.Group("/users")
	userGroup.Use(auth.RequireAuth(cfg.JWTSecret), auth.RequireRole("administrator"))
	userGroup.GET("", userHandler.List)
	userGroup.GET("/:id", userHandler.Get)
	userGroup.PUT("/:id", userHandler.Update)
	userGroup.PATCH("/:id/deactivate", userHandler.Deactivate)
	userGroup.PATCH("/:id/activate", userHandler.Activate)
	userGroup.POST("/:id/reset-password", userHandler.ResetPassword)

	qGroup := r.Group("/")
	qGroup.Use(auth.RequireAuth(cfg.JWTSecret), auth.RequireRole("administrator", "operator"))
	qGroup.POST("/question-banks", questionHandler.CreateBank)
	qGroup.GET("/question-banks", questionHandler.ListBanks)
	qGroup.POST("/question-banks/:bankId/questions", questionHandler.CreateQuestion)
	qGroup.GET("/question-banks/:bankId/questions", questionHandler.ListQuestions)
	qGroup.GET("/questions/:id", questionHandler.GetQuestion)
	qGroup.PUT("/questions/:id", questionHandler.UpdateQuestion)
	qGroup.GET("/questions/:id/versions", questionHandler.ListVersionHistory)
	qGroup.DELETE("/questions/:id", questionHandler.DeleteQuestion)

	pGroup := r.Group("/participants")
	pGroup.Use(auth.RequireAuth(cfg.JWTSecret), auth.RequireRole("administrator", "operator"))
	pGroup.POST("", participantHandler.Create)
	pGroup.GET("", participantHandler.List)
	pGroup.GET("/:id", participantHandler.Get)
	pGroup.PUT("/:id", participantHandler.Update)
	pGroup.PATCH("/:id/deactivate", participantHandler.Deactivate)
	pGroup.PATCH("/:id/activate", participantHandler.Activate)
	pGroup.POST("/import", participantHandler.Import)

	aGroup := r.Group("/assessments")
	aGroup.Use(auth.RequireAuth(cfg.JWTSecret), auth.RequireRole("administrator", "operator"))
	aGroup.POST("", assessmentHandler.Create)
	aGroup.GET("", assessmentHandler.List)
	aGroup.GET("/:id", assessmentHandler.Get)
	aGroup.PUT("/:id", assessmentHandler.Update)
	aGroup.POST("/:id/participants", assessmentHandler.AddParticipants)
	aGroup.GET("/:id/participants", assessmentHandler.ListParticipants)
	aGroup.POST("/:id/publish", auth.RequireRole("administrator"), assessmentHandler.Publish)

	log.Printf("server running on port %s", cfg.AppPort)
	if err := r.Run(":" + cfg.AppPort); err != nil {
		log.Fatal(err)
	}
}
