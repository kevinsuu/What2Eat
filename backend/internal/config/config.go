package config

import (
	"os"
)

type Config struct {
	GoogleMapsAPIKey string
	Port             string
}

func Load() *Config {
	return &Config{
		GoogleMapsAPIKey: getEnv("GOOGLE_MAPS_API_KEY", ""),
		Port:             getEnv("PORT", "8080"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
