package service

import (
	"fmt"
	"math/rand"
	"time"
	"what2eat-backend/internal/model"
)

type RestaurantService struct {
	repo    RestaurantRepositoryInterface
	counter *CounterService
}

type RestaurantRepositoryInterface interface {
	SearchNearby(lat, lng float64) ([]model.Restaurant, error)
}

func NewRestaurantService(repo RestaurantRepositoryInterface, counter *CounterService) *RestaurantService {
	return &RestaurantService{
		repo:    repo,
		counter: counter,
	}
}

func (s *RestaurantService) GetRecommendations(lat, lng float64) (*model.RecommendResponse, error) {
	// 檢查並增加計數
	current, limit, err := s.counter.IncrementAndGetUsage()
	if err != nil {
		return &model.RecommendResponse{
			Restaurants: []model.Restaurant{},
			Message:     err.Error(),
		}, nil
	}

	// 搜尋餐廳
	restaurants, err := s.repo.SearchNearby(lat, lng)
	if err != nil {
		return nil, err
	}

	if len(restaurants) == 0 {
		return &model.RecommendResponse{
			Restaurants: []model.Restaurant{},
			Message:     fmt.Sprintf("附近沒有找到合適的餐廳 (今日使用量: %d/%d)", current, limit),
		}, nil
	}

	selectedRestaurants := s.selectRandomRestaurants(restaurants, 3)

	return &model.RecommendResponse{
		Restaurants: selectedRestaurants,
		Message:     fmt.Sprintf("為您推薦 %d 家附近的優質餐廳 (今日使用量: %d/%d)", len(selectedRestaurants), current, limit),
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
