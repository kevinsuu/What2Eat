package handler

import (
	"log"
	"net/http"
	"strconv"
	"what2eat-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type RestaurantHandler struct {
	restaurantService *service.RestaurantService
}

func NewRestaurantHandler(restaurantService *service.RestaurantService) *RestaurantHandler {
	return &RestaurantHandler{
		restaurantService: restaurantService,
	}
}

func (h *RestaurantHandler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok", "message": "服務運行正常"})
}

func (h *RestaurantHandler) RecommendRestaurants(c *gin.Context) {
	// 解析請求參數
	var request struct {
		Lat  float64 `json:"lat" binding:"required"`
		Lng  float64 `json:"lng" binding:"required"`
		Type string  `json:"type"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "請求參數無效", "details": err.Error()})
		return
	}

	// 紀錄請求
	log.Printf("接收到推薦餐廳請求: 位置 [%.4f, %.4f], 類型: %s", request.Lat, request.Lng, request.Type)

	// 使用餐廳服務搜尋附近餐廳
	restaurants, err := h.restaurantService.RecommendRestaurants(c, request.Lat, request.Lng, request.Type)
	if err != nil {
		log.Printf("餐廳推薦錯誤: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "無法獲取餐廳推薦", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"restaurants": restaurants,
		"message":     "成功獲取餐廳推薦",
	})
}

// 新增 API 路由處理 GET 請求
func (h *RestaurantHandler) GetRestaurants(c *gin.Context) {
	// 解析 URL 參數
	lat, err := strconv.ParseFloat(c.Query("lat"), 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "無效的緯度參數"})
		return
	}

	lng, err := strconv.ParseFloat(c.Query("lng"), 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "無效的經度參數"})
		return
	}

	// 獲取餐廳類型參數
	restaurantType := c.Query("type")

	// 紀錄請求
	log.Printf("接收到餐廳搜尋請求: 位置 [%.4f, %.4f], 類型: %s", lat, lng, restaurantType)

	// 使用餐廳服務搜尋附近餐廳
	restaurants, err := h.restaurantService.RecommendRestaurants(c, lat, lng, restaurantType)
	if err != nil {
		log.Printf("餐廳搜尋錯誤: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "無法獲取餐廳資訊", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"restaurants": restaurants,
		"message":     "成功獲取餐廳資訊",
	})
}
