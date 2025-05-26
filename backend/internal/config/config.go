package config

import (
	"log"
	"os"
	"strconv"
)

type Config struct {
	GoogleMapsAPIKey string
	Port             string
	RedisAddr        string
	RedisPassword    string
	RedisDB          int
	DailyAPILimit    int
}

func Load() *Config {
	apiKey := getEnv("GOOGLE_MAPS_API_KEY", "")
	if apiKey == "" {
		log.Fatal("請設定 GOOGLE_MAPS_API_KEY 環境變數")
	}

	return &Config{
		GoogleMapsAPIKey: apiKey,
		Port:             getEnv("PORT", "8080"),
		RedisAddr:        getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPassword:    getEnv("REDIS_PASSWORD", ""),
		RedisDB:          getEnvInt("REDIS_DB", 0),
		DailyAPILimit:    getEnvInt("DAILY_API_LIMIT", 500),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}
