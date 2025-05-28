package service

import (
	"context"
	"fmt"
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
	// 檢查是否已超過API限制
	if s.counterService.IsLimitExceeded() {
		current, limit := s.counterService.GetUsage()
		errMsg := fmt.Sprintf("API 每日請求數已達上限 %d/%d", current, limit)
		return nil, fmt.Errorf(errMsg)
	}

	// 增加計數
	current, limit, err := s.counterService.IncrementAndGetUsage()
	if err != nil {
		return nil, fmt.Errorf("API 使用超出限制: %w", err)
	}

	// 再次檢查增加後是否超過限制
	if current > limit {
		return nil, fmt.Errorf("API 每日請求數已達上限 %d/%d", current, limit)
	}

	// 直接從repository獲取隨機的3家餐廳（已處理好照片URL）
	restaurants, err := s.repo.GetRandomRestaurants(lat, lng, restaurantType, 3)
	if err != nil {
		// 紀錄API請求失敗
		errMsg := fmt.Sprintf("搜尋餐廳失敗: %v", err)
		fmt.Printf("%s\n", errMsg)
		return nil, fmt.Errorf(errMsg)
	}

	// 如果沒有找到符合條件的餐廳
	if len(restaurants) == 0 {
		fmt.Printf("未找到符合條件的餐廳: 位置 [%.4f, %.4f], 類型: %s\n", lat, lng, restaurantType)
		return []model.Restaurant{}, nil
	}

	fmt.Printf("成功推薦 %d 家餐廳\n", len(restaurants))
	return restaurants, nil
}

// 不需要的GetRecommendations方法（為了向後兼容舊的API格式）移除
// 因為recommend路由已經移除，所以此方法也不再需要

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
