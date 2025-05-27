package service

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"time"
	"what2eat-backend/internal/model"
	"what2eat-backend/internal/repository"
)

type RestaurantService struct {
	repo           *repository.RestaurantRepository
	counterService *CounterService
}

func NewRestaurantService(repo *repository.RestaurantRepository, counterService *CounterService) *RestaurantService {
	return &RestaurantService{
		repo:           repo,
		counterService: counterService,
	}
}

// RecommendRestaurants 根據位置和類型推薦餐廳
func (s *RestaurantService) RecommendRestaurants(ctx context.Context, lat, lng float64, restaurantType string) ([]model.Restaurant, error) {
	// 檢查 API 使用限制
	current, limit, err := s.counterService.IncrementAndGetUsage()
	if err != nil {
		return nil, fmt.Errorf("API 使用超出限制: %w", err)
	}

	if current > limit {
		return nil, fmt.Errorf("API 每日請求數已達上限 %d", limit)
	}

	// 獲取符合條件的餐廳
	restaurants, err := s.repo.SearchNearby(lat, lng, restaurantType)
	if err != nil {
		return nil, fmt.Errorf("搜尋餐廳失敗: %w", err)
	}

	// 如果沒有找到符合條件的餐廳
	if len(restaurants) == 0 {
		log.Printf("未找到符合條件的餐廳: 位置 [%.4f, %.4f], 類型: %s", lat, lng, restaurantType)
		return []model.Restaurant{}, nil
	}

	// 打亂順序
	rand.Shuffle(len(restaurants), func(i, j int) {
		restaurants[i], restaurants[j] = restaurants[j], restaurants[i]
	})

	// 取前三家餐廳
	maxResults := 3
	if len(restaurants) < maxResults {
		maxResults = len(restaurants)
	}

	log.Printf("成功推薦 %d 家餐廳", maxResults)
	return restaurants[:maxResults], nil
}

// 為了向後兼容舊的 API 格式
func (s *RestaurantService) GetRecommendations(lat, lng float64) (*model.RecommendResponse, error) {
	// 使用新方法，不指定餐廳類型
	restaurants, err := s.RecommendRestaurants(context.Background(), lat, lng, "")
	if err != nil {
		return &model.RecommendResponse{
			Restaurants: []model.Restaurant{},
			Message:     fmt.Sprintf("獲取餐廳推薦失敗: %v", err),
		}, err
	}

	// 返回舊格式的響應
	return &model.RecommendResponse{
		Restaurants: restaurants,
		Message:     fmt.Sprintf("成功推薦 %d 家餐廳", len(restaurants)),
	}, nil
}

func (s *RestaurantService) selectRandomRestaurants(restaurants []model.Restaurant, count int) []model.Restaurant {
	if len(restaurants) <= count {
		return restaurants
	}

	rand.Seed(time.Now().UnixNano())
	rand.Shuffle(len(restaurants), func(i, j int) {
		restaurants[i], restaurants[j] = restaurants[j], restaurants[i]
	})

	return restaurants[:count]
}
