package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/mohef-tech/mohef-assessment/backend/internal/config"
	"github.com/mohef-tech/mohef-assessment/backend/internal/database"
)

func main() {
	cfg := config.Load()

	pool, err := database.NewPostgresPool(cfg)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		if err := pool.Ping(c.Request.Context()); err != nil {
			c.JSON(500, gin.H{"status": "db unreachable"})
			return
		}
		c.JSON(200, gin.H{"status": "ok"})
	})

	log.Printf("server running on port %s", cfg.AppPort)
	if err := r.Run(":" + cfg.AppPort); err != nil {
		log.Fatal(err)
	}
}
