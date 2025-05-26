package service

import (
	"fmt"
	"math/rand"
	"time"
	"what2eat-backend/internal/model"
)

type RestaurantService struct {
	repo RestaurantRepositoryInterface
}

type RestaurantRepositoryInterface interface {
	SearchNearby(lat, lng float64) ([]model.Restaurant, error)
}

func NewRestaurantService(repo RestaurantRepositoryInterface) *RestaurantService {
	return &RestaurantService{
		repo: repo,
	}
}

func (s *RestaurantService) GetRecommendations(lat, lng float64) (*model.RecommendResponse, error) {
	restaurants, err := s.repo.SearchNearby(lat, lng)
	if err != nil {
		return nil, err
	}

	if len(restaurants) == 0 {
		return &model.RecommendResponse{
			Restaurants: []model.Restaurant{},
			Message:     "附近沒有找到合適的餐廳",
		}, nil
	}

	selectedRestaurants := s.selectRandomRestaurants(restaurants, 3)

	return &model.RecommendResponse{
		Restaurants: selectedRestaurants,
		Message:     fmt.Sprintf("為您推薦 %d 家附近的優質餐廳", len(selectedRestaurants)),
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
