package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"what2eat-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type RestaurantHandler struct {
	restaurantService *service.RestaurantService
	counterService    *service.CounterService
}

func NewRestaurantHandler(restaurantService *service.RestaurantService, counterService *service.CounterService) *RestaurantHandler {
	return &RestaurantHandler{
		restaurantService: restaurantService,
		counterService:    counterService,
	}
}

func (h *RestaurantHandler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok", "message": "服務運行正常"})
}

// GetRestaurants 處理GET請求，返回附近餐廳
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
	fmt.Printf("接收到餐廳搜尋請求: 位置 [%.4f, %.4f], 類型: %s\n", lat, lng, restaurantType)

	// 檢查API限制
	if err := h.counterService.CheckDailyLimit(); err != nil {
		h.counterService.LogAPIRequest("/api/restaurants", lat, lng, restaurantType, false, err.Error())
		c.JSON(http.StatusTooManyRequests, gin.H{
			"error":    err.Error(),
			"usage":    h.counterService.GetUsageString(),
			"reset_in": h.counterService.GetTimeUntilReset().String(),
		})
		return
	}

	// 使用餐廳服務搜尋附近餐廳
	restaurants, err := h.restaurantService.RecommendRestaurants(c, lat, lng, restaurantType)
	if err != nil {
		errMsg := fmt.Sprintf("餐廳搜尋錯誤: %v", err)
		fmt.Printf("%s\n", errMsg)
		h.counterService.LogAPIRequest("/api/restaurants", lat, lng, restaurantType, false, errMsg)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "無法獲取餐廳資訊", "details": err.Error()})
		return
	}

	// 記錄成功的API請求
	h.counterService.LogAPIRequest("/api/restaurants", lat, lng, restaurantType, true, "")

	c.JSON(http.StatusOK, gin.H{
		"restaurants": restaurants,
		"message":     "成功獲取餐廳推薦",
		"usage":       h.counterService.GetUsageString(),
		"reset_in":    h.counterService.GetTimeUntilReset().String(),
	})
}
