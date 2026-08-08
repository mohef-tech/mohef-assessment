package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/mohef-tech/mohef-assessment/backend/internal/auth"
	"github.com/mohef-tech/mohef-assessment/backend/internal/config"
	"github.com/mohef-tech/mohef-assessment/backend/internal/database"
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
	authService := auth.NewService(userRepo, cfg.JWTSecret)
	authHandler := auth.NewHandler(authService)

	r := gin.Default()

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

	log.Printf("server running on port %s", cfg.AppPort)
	if err := r.Run(":" + cfg.AppPort); err != nil {
		log.Fatal(err)
	}
}
