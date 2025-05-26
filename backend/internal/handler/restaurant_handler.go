package handler

import (
	"log"
	"net/http"
	"time"
	"what2eat-backend/internal/model"

	"github.com/gin-gonic/gin"
)

type RestaurantHandler struct {
	service RestaurantServiceInterface
}

type RestaurantServiceInterface interface {
	GetRecommendations(lat, lng float64) (*model.RecommendResponse, error)
}

func NewRestaurantHandler(service RestaurantServiceInterface) *RestaurantHandler {
	return &RestaurantHandler{
		service: service,
	}
}

func (h *RestaurantHandler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"message": "What2Eat API 運行中",
		"time":    time.Now().Format(time.RFC3339),
	})
}

func (h *RestaurantHandler) RecommendRestaurants(c *gin.Context) {
	var location model.Location
	if err := c.ShouldBindJSON(&location); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "無效的位置資料",
		})
		return
	}

	// 獲取推薦餐廳
	response, err := h.service.GetRecommendations(location.Lat, location.Lng)
	if err != nil {
		log.Printf("搜尋餐廳錯誤: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "搜尋餐廳時發生錯誤",
		})
		return
	}

	c.JSON(http.StatusOK, response)
}
