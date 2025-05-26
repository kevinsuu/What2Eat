package main

import (
	"log"
	"time"
	"what2eat-backend/internal/config"
	"what2eat-backend/internal/handler"
	"what2eat-backend/internal/infrastructure"
	"what2eat-backend/internal/middleware"
	"what2eat-backend/internal/repository"
	"what2eat-backend/internal/service"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// 載入 .env 檔案
	if err := godotenv.Load("../.env"); err != nil {
		log.Printf("警告: 無法載入 .env 檔案: %v", err)
	}

	// 載入配置
	cfg := config.Load()

	// 初始化基礎設施
	mapsClient, err := infrastructure.NewGoogleMapsClient(cfg.GoogleMapsAPIKey)
	if err != nil {
		log.Fatalf("無法初始化 Google Maps 客戶端: %v", err)
	}

	// 初始化 Repository
	restaurantRepo := repository.NewRestaurantRepository(mapsClient)

	// 初始化計數器服務
	counterService := service.NewCounterService(cfg.DailyAPILimit)

	// 初始化 Service
	restaurantService := service.NewRestaurantService(restaurantRepo, counterService)

	// 初始化 Handler
	restaurantHandler := handler.NewRestaurantHandler(restaurantService)

	// 設定 Gin 路由
	r := gin.Default()

	// 安全中間件 (按順序套用)
	r.Use(middleware.SecurityHeaders())                   // 安全標頭
	r.Use(middleware.RequestSizeLimit(1024 * 1024))       // 1MB 請求大小限制
	r.Use(middleware.TimeoutMiddleware(30 * time.Second)) // 30 秒超時
	r.Use(middleware.GlobalRateLimit())                   // 全域流量限制
	r.Use(middleware.IPRateLimit())                       // IP 流量限制

	// CORS 設定
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{
		"http://localhost:5173",
		"http://localhost:3000",
		"https://kevinsuu.github.io",
		"https://kevinsuu.github.io/what2eat",
		"http://127.0.0.1:5173",
		"http://127.0.0.1:5500",
	}
	config.AllowMethods = []string{"GET", "POST", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept"}
	r.Use(cors.New(config))

	// 註冊路由
	registerRoutes(r, restaurantHandler)

	// 啟動服務器
	log.Printf("服務器啟動在端口 %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("服務器啟動失敗: %v", err)
	}
}

func registerRoutes(r *gin.Engine, restaurantHandler *handler.RestaurantHandler) {
	r.GET("/health", restaurantHandler.HealthCheck)

	api := r.Group("/api")
	{
		// API 專用流量限制 (更嚴格)
		api.Use(middleware.APIRateLimit())
		api.POST("/recommend", restaurantHandler.RecommendRestaurants)
	}
}
