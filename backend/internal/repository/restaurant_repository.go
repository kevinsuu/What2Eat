package repository

import (
	"context"
	"fmt"
	"math"
	"os"
	"sync"
	"time"
	"what2eat-backend/internal/model"

	"googlemaps.github.io/maps"
)

type RestaurantRepository struct {
	mapsClient *maps.Client
	cache      map[string]cacheEntry
	photoCache map[string]string
	mu         sync.RWMutex
}

type cacheEntry struct {
	restaurants []model.Restaurant
	timestamp   time.Time
}

func NewRestaurantRepository(mapsClient *maps.Client) *RestaurantRepository {
	return &RestaurantRepository{
		mapsClient: mapsClient,
		cache:      make(map[string]cacheEntry),
		photoCache: make(map[string]string),
	}
}

func (r *RestaurantRepository) SearchNearby(lat, lng float64) ([]model.Restaurant, error) {
	// 生成緩存的鍵值
	// 將經緯度值取至小數點後3位，代表約100公尺的範圍
	cacheKey := fmt.Sprintf("%.3f:%.3f", lat, lng)

	// 讀取緩存需要加讀鎖
	r.mu.RLock()
	// 檢查緩存中是否有有效的資料
	if entry, found := r.cache[cacheKey]; found {
		// 檢查緩存是否在有效期內（1小時）
		if time.Since(entry.timestamp) < time.Hour {
			r.mu.RUnlock()
			return entry.restaurants, nil
		}
	}
	r.mu.RUnlock()

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
				Name:       place.Name,
				Rating:     place.Rating,
				PlaceID:    place.PlaceID,
				Address:    place.Vicinity,
				PriceLevel: int(place.PriceLevel),
			}

			// 設置平均消費金額 (根據價格等級估算)
			restaurant.AveragePrice = r.estimateAveragePrice(int(place.PriceLevel))

			// 計算距離
			restaurant.Distance = r.calculateDistance(lat, lng, place.Geometry.Location.Lat, place.Geometry.Location.Lng)

			// 如果有照片，取第一張
			if len(place.Photos) > 0 {
				restaurant.PhotoURL = r.getPhotoURL(place.Photos[0].PhotoReference)
			}

			restaurants = append(restaurants, restaurant)
		}
	}

	// 寫入緩存需要加寫鎖
	r.mu.Lock()
	// 儲存到緩存
	r.cache[cacheKey] = cacheEntry{
		restaurants: restaurants,
		timestamp:   time.Now(),
	}
	r.mu.Unlock()

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
	// 先檢查緩存
	r.mu.RLock()
	if url, found := r.photoCache[photoReference]; found {
		r.mu.RUnlock()
		return url
	}
	r.mu.RUnlock()

	apiKey := os.Getenv("GOOGLE_MAPS_API_KEY")
	url := fmt.Sprintf("https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=%s&key=%s",
		photoReference, apiKey)

	// 儲存到緩存
	r.mu.Lock()
	r.photoCache[photoReference] = url
	r.mu.Unlock()

	return url
}

// 根據價格等級估算平均消費金額
func (r *RestaurantRepository) estimateAveragePrice(priceLevel int) string {
	switch priceLevel {
	case 0:
		return "約 NT$100 以下"
	case 1:
		return "約 NT$100-300"
	case 2:
		return "約 NT$300-600"
	case 3:
		return "約 NT$600-1200"
	case 4:
		return "約 NT$1200 以上"
	default:
		return "價格未知"
	}
}
