package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"
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
			"error":        err.Error(),
			"usage":        h.counterService.GetUsageString(),
			"reset_in":     formatDuration(h.counterService.GetTimeUntilReset()),
			"pacific_time": getPacificTimeString(),
		})
		return
	}

	// 使用餐廳服務搜尋附近餐廳
	restaurants, err := h.restaurantService.RecommendRestaurants(c, lat, lng, restaurantType)
	if err != nil {
		errMsg := fmt.Sprintf("餐廳搜尋錯誤: %v", err)
		fmt.Printf("%s\n", errMsg)
		h.counterService.LogAPIRequest("/api/restaurants", lat, lng, restaurantType, false, errMsg)

		// 檢查是否為 OVER_QUERY_LIMIT 錯誤
		if strings.Contains(err.Error(), "OVER_QUERY_LIMIT") {
			// 設置 limitExceeded 標記
			h.counterService.SetLimitExceeded(true)

			// 傳回特定的錯誤狀態碼與信息
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":        "Google Maps API 每日額度已用完，請明天再試",
				"details":      err.Error(),
				"usage":        h.counterService.GetUsageString(),
				"reset_in":     formatDuration(h.counterService.GetTimeUntilReset()),
				"pacific_time": getPacificTimeString(),
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "無法獲取餐廳資訊", "details": err.Error()})
		return
	}

	// 記錄成功的API請求
	h.counterService.LogAPIRequest("/api/restaurants", lat, lng, restaurantType, true, "")

	c.JSON(http.StatusOK, gin.H{
		"restaurants":  restaurants,
		"message":      "成功獲取餐廳推薦",
		"usage":        h.counterService.GetUsageString(),
		"reset_in":     formatDuration(h.counterService.GetTimeUntilReset()),
		"pacific_time": getPacificTimeString(),
	})
}

// 格式化持續時間，移除秒數中的小數點
func formatDuration(d time.Duration) string {
	// 將時間轉換為小時、分鐘和秒
	hours := int(d.Hours())
	minutes := int(d.Minutes()) % 60
	seconds := int(d.Seconds()) % 60

	var result string

	if hours > 0 {
		result = fmt.Sprintf("%dh", hours)
	}

	if minutes > 0 {
		result += fmt.Sprintf("%dm", minutes)
	}

	if seconds > 0 {
		result += fmt.Sprintf("%ds", seconds)
	}

	return result
}

// 取得太平洋時間字符串
func getPacificTimeString() string {
	// 獲取太平洋時間
	var ptLocation *time.Location
	var err error
	ptLocation, err = time.LoadLocation("America/Los_Angeles")
	if err != nil {
		// 如果無法加載時區，使用固定的-8小時偏移（近似值）
		ptLocation = time.FixedZone("PT", -8*60*60)
	}

	// 轉換為太平洋時間
	nowPT := time.Now().In(ptLocation)

	// 返回格式化的時間字符串
	return fmt.Sprintf("PT: %s", nowPT.Format("2006-01-02 15:04:05"))
}
