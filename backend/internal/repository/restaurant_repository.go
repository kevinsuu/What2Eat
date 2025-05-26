package repository

import (
	"context"
	"fmt"
	"math"
	"os"
	"what2eat-backend/internal/model"

	"googlemaps.github.io/maps"
)

type RestaurantRepository struct {
	mapsClient *maps.Client
}

func NewRestaurantRepository(mapsClient *maps.Client) *RestaurantRepository {
	return &RestaurantRepository{
		mapsClient: mapsClient,
	}
}

func (r *RestaurantRepository) SearchNearby(lat, lng float64) ([]model.Restaurant, error) {
	ctx := context.Background()

	// 設定搜尋參數
	request := &maps.NearbySearchRequest{
		Location: &maps.LatLng{
			Lat: lat,
			Lng: lng,
		},
		Radius:   1000, // 1公里範圍
		Type:     maps.PlaceTypeRestaurant,
		Language: "zh-TW",
	}

	// 執行搜尋
	response, err := r.mapsClient.NearbySearch(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("Google Places API 錯誤: %v", err)
	}

	var restaurants []model.Restaurant
	for _, place := range response.Results {
		// 只選擇評分 4.0 以上的餐廳
		if place.Rating >= 4.0 {
			restaurant := model.Restaurant{
				Name:    place.Name,
				Rating:  place.Rating,
				PlaceID: place.PlaceID,
				Address: place.Vicinity,
			}

			// 計算距離
			restaurant.Distance = r.calculateDistance(lat, lng, place.Geometry.Location.Lat, place.Geometry.Location.Lng)

			// 如果有照片，取第一張
			if len(place.Photos) > 0 {
				restaurant.PhotoURL = r.getPhotoURL(place.Photos[0].PhotoReference)
			}

			restaurants = append(restaurants, restaurant)
		}
	}

	return restaurants, nil
}

func (r *RestaurantRepository) calculateDistance(lat1, lng1, lat2, lng2 float64) string {
	// Haversine 公式計算距離
	const earthRadius = 6371 // 地球半徑（公里）

	dLat := (lat2 - lat1) * math.Pi / 180
	dLng := (lng2 - lng1) * math.Pi / 180

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
			math.Sin(dLng/2)*math.Sin(dLng/2)

	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	distance := earthRadius * c * 1000 // 轉換為公尺

	if distance < 1000 {
		return fmt.Sprintf("%.0fm", distance)
	}
	return fmt.Sprintf("%.1fkm", distance/1000)
}

func (r *RestaurantRepository) getPhotoURL(photoReference string) string {
	apiKey := os.Getenv("GOOGLE_MAPS_API_KEY")
	return fmt.Sprintf("https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=%s&key=%s",
		photoReference, apiKey)
}
