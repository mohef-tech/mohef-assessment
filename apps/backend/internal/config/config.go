package config

import "os"

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	RedisHost  string
	RedisPort  string
	AppPort    string
	JWTSecret  string
}

func Load() *Config {
	return &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "mohef"),
		DBPassword: getEnv("DB_PASSWORD", "mohef"),
		DBName:     getEnv("DB_NAME", "mohef_assessment"),
		RedisHost:  getEnv("REDIS_HOST", "localhost"),
		RedisPort:  getEnv("REDIS_PORT", "6379"),
		AppPort:    getEnv("APP_PORT", "8080"),
		JWTSecret:  getEnv("JWT_SECRET", "dev-secret-change-me"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
