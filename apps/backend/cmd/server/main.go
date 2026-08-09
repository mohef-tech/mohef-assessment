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
	refreshRepo := auth.NewRefreshTokenRepository(pool)
	authService := auth.NewService(userRepo, refreshRepo, cfg.JWTSecret)
	authHandler := auth.NewHandler(authService)

	userService := user.NewService(userRepo)
	userHandler := user.NewHandler(userService)

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

	log.Printf("server running on port %s", cfg.AppPort)
	if err := r.Run(":" + cfg.AppPort); err != nil {
		log.Fatal(err)
	}
}
