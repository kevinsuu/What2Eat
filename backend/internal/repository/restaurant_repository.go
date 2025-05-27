package repository

import (
	"context"
	"fmt"
	"math"
	"math/rand"
	"os"
	"sync"
	"time"
	"what2eat-backend/internal/model"

	"log"

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
		cache:      make(map[string]cacheEntry, 50), // 增加初始容量以減少擴容頻率
		photoCache: make(map[string]string, 100),    // 照片緩存可能更多
		mu:         sync.RWMutex{},
	}
}

// SearchNearby 搜尋附近餐廳
// fetchPhotos 參數控制是否獲取照片URL，如果為false則只儲存照片引用
func (r *RestaurantRepository) SearchNearby(lat, lng float64, restaurantType string, fetchPhotos ...bool) ([]model.Restaurant, error) {
	// 生成緩存的鍵值
	// 將經緯度值取至小數點後3位，代表約100公尺的範圍
	cacheKey := fmt.Sprintf("%.3f:%.3f:%s", lat, lng, restaurantType)

	// 讀取緩存需要加讀鎖
	r.mu.RLock()
	// 檢查緩存中是否有有效的資料
	if entry, found := r.cache[cacheKey]; found {
		// 檢查緩存是否在有效期內（1小時）
		if time.Since(entry.timestamp) < time.Hour {
			r.mu.RUnlock()

			// 如果需要照片URL，檢查並處理
			shouldFetchPhotos := len(fetchPhotos) > 0 && fetchPhotos[0]
			if shouldFetchPhotos {
				results := make([]model.Restaurant, len(entry.restaurants))
				copy(results, entry.restaurants)

				// 處理照片URL
				for i := range results {
					if len(results[i].PhotoURL) > 9 && results[i].PhotoURL[:9] == "photoref:" {
						results[i].PhotoURL = r.getPhotoURL(results[i].PhotoURL[9:])
					}
				}

				return results, nil
			}

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
		// 改用距離排序而非固定半徑，這需要至少一個關鍵字或類型
		RankBy:   maps.RankByDistance,
		Language: "zh-TW",
	}

	// 如果指定了餐廳類型且不是空字串，添加關鍵字
	if restaurantType != "" {
		// 簡化關鍵字處理，使用「主類型 OR 主類型簡稱」格式
		mainKeyword := getMainKeyword(restaurantType)
		request.Keyword = mainKeyword
		log.Printf("搜尋餐廳類型: %s，使用簡化關鍵字: %s", restaurantType, request.Keyword)
	} else {
		// 當沒有指定類型時，仍需要一個關鍵字或類型
		request.Type = maps.PlaceTypeRestaurant
	}

	// 執行搜尋
	response, err := r.mapsClient.NearbySearch(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("Google Places API 錯誤: %v", err)
	}

	// 記錄搜尋結果
	log.Printf("Google API 返回了 %d 個結果", len(response.Results))
	for i, place := range response.Results {
		if i < 10 { // 只記錄前10個，避免日誌過長
			log.Printf("結果 #%d: %s (評分: %.1f) - %s", i+1, place.Name, place.Rating, place.Vicinity)
		}
	}

	// 檢查是否需要獲取照片URL
	shouldFetchPhotos := len(fetchPhotos) > 0 && fetchPhotos[0]

	var restaurants []model.Restaurant
	for _, place := range response.Results {
		// 降低評分要求到 3.5
		if place.Rating >= 3.5 {
			restaurant := model.Restaurant{
				Name:           place.Name,
				Rating:         place.Rating,
				PlaceID:        place.PlaceID,
				Address:        place.Vicinity,
				PriceLevel:     int(place.PriceLevel),
				RestaurantType: restaurantType, // 添加餐廳類型
			}

			// 設置平均消費金額 (根據價格等級估算)
			restaurant.AveragePrice = r.estimateAveragePrice(int(place.PriceLevel))

			// 計算距離
			restaurant.Distance = r.calculateDistance(lat, lng, place.Geometry.Location.Lat, place.Geometry.Location.Lng)

			// 處理照片
			if len(place.Photos) > 0 {
				if shouldFetchPhotos {
					// 直接獲取URL
					restaurant.PhotoURL = r.getPhotoURL(place.Photos[0].PhotoReference)
				} else {
					// 儲存引用
					restaurant.PhotoURL = "photoref:" + place.Photos[0].PhotoReference
				}
			}

			restaurants = append(restaurants, restaurant)
		}
	}

	// 如果結果太少，嘗試用相關名稱關鍵字搜尋補充
	if len(restaurants) < 5 && restaurantType != "" {
		log.Printf("%s 搜尋結果不足，嘗試用名稱關鍵字搜尋補充", restaurantType)
		nameKeywords := getNameKeywords(restaurantType)

		for _, nameKeyword := range nameKeywords {
			additionalResults, err := r.searchRestaurantsByName(ctx, lat, lng, nameKeyword, restaurants, restaurantType, shouldFetchPhotos)
			if err != nil {
				log.Printf("名稱搜尋 '%s' 出錯: %v", nameKeyword, err)
				// 繼續其他名稱搜尋，不中斷流程
				continue
			}
			restaurants = additionalResults
		}
	}

	// 寫入緩存需要加寫鎖
	r.mu.Lock()
	// 儲存到緩存 (總是儲存不帶URL的版本，只儲存引用)
	if shouldFetchPhotos {
		// 如果是帶URL的版本，轉換回只帶引用的版本再緩存
		cacheVersion := make([]model.Restaurant, len(restaurants))
		copy(cacheVersion, restaurants)

		for i := range cacheVersion {
			// 如果是帶完整URL的，轉換為引用格式
			if len(cacheVersion[i].PhotoURL) > 0 && cacheVersion[i].PhotoURL[:9] != "photoref:" {
				// 這裡我們沒有從URL反推引用的方法，暫時保留URL格式
				// 理想情況下應該維護一個URL到引用的反向映射
			}
		}

		r.cache[cacheKey] = cacheEntry{
			restaurants: cacheVersion,
			timestamp:   time.Now(),
		}
	} else {
		// 直接緩存當前版本
		r.cache[cacheKey] = cacheEntry{
			restaurants: restaurants,
			timestamp:   time.Now(),
		}
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
	// 如果照片引用為空，返回空字符串
	if photoReference == "" {
		return ""
	}

	// 先檢查緩存
	r.mu.RLock()
	if url, found := r.photoCache[photoReference]; found {
		r.mu.RUnlock()
		return url
	}
	r.mu.RUnlock()

	// 避免頻繁調用Google API，使用較小的圖片尺寸
	apiKey := os.Getenv("GOOGLE_MAPS_API_KEY")
	url := fmt.Sprintf("https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=%s&key=%s",
		photoReference, apiKey)

	// 儲存到緩存，照片URL可以長期緩存，因為引用ID是固定的
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

// 添加名稱搜尋以補充一般搜尋
func (r *RestaurantRepository) searchRestaurantsByName(ctx context.Context, lat, lng float64, nameKeyword string, existingResults []model.Restaurant, restaurantType string, shouldFetchPhotos bool) ([]model.Restaurant, error) {
	// 設定名稱搜尋參數
	request := &maps.NearbySearchRequest{
		Location: &maps.LatLng{
			Lat: lat,
			Lng: lng,
		},
		RankBy:   maps.RankByDistance,
		Language: "zh-TW",
		Name:     nameKeyword, // 使用名稱進行搜尋
	}

	// 執行搜尋
	response, err := r.mapsClient.NearbySearch(ctx, request)
	if err != nil {
		return existingResults, err // 返回已有的結果，不因這個錯誤而中斷
	}

	log.Printf("名稱搜尋 '%s' 返回了 %d 個結果", nameKeyword, len(response.Results))

	// 如果已有結果不是空的，則需要避免重複
	existingIds := make(map[string]bool)
	for _, r := range existingResults {
		existingIds[r.PlaceID] = true
	}

	// 處理搜尋結果
	for _, place := range response.Results {
		// 跳過已經存在的結果
		if existingIds[place.PlaceID] {
			continue
		}

		// 只選擇評分 3.5 以上的餐廳
		if place.Rating >= 3.5 {
			restaurant := model.Restaurant{
				Name:           place.Name,
				Rating:         place.Rating,
				PlaceID:        place.PlaceID,
				Address:        place.Vicinity,
				PriceLevel:     int(place.PriceLevel),
				RestaurantType: restaurantType, // 硬編碼為餐廳類型
			}

			// 設置平均消費金額
			restaurant.AveragePrice = r.estimateAveragePrice(int(place.PriceLevel))

			// 計算距離
			restaurant.Distance = r.calculateDistance(lat, lng, place.Geometry.Location.Lat, place.Geometry.Location.Lng)

			// 處理照片
			if len(place.Photos) > 0 {
				if shouldFetchPhotos {
					// 直接獲取URL
					restaurant.PhotoURL = r.getPhotoURL(place.Photos[0].PhotoReference)
				} else {
					// 儲存引用
					restaurant.PhotoURL = "photoref:" + place.Photos[0].PhotoReference
				}
			}

			existingResults = append(existingResults, restaurant)
			existingIds[place.PlaceID] = true // 避免下次添加重複
		}
	}

	return existingResults, nil
}

// 獲取餐廳類型的主關鍵字
func getMainKeyword(restaurantType string) string {
	// 針對不同類型返回最適合 Google Maps API 的關鍵字
	mainKeywords := map[string]string{
		"中式料理": "中式料理 OR 中餐",
		"日式料理": "日式料理 OR 日本料理",
		"義式料理": "義式料理 OR 義大利料理",
		"韓式料理": "韓式料理 OR 韓國料理",
		"美式料理": "美式料理 OR 美國料理",
		"泰式料理": "泰式料理 OR 泰國料理",
		"早午餐":  "早午餐 OR brunch",
		"海鮮料理": "海鮮料理 OR 海鮮",
		"牛排":   "牛排 OR steak",
		"火鍋":   "火鍋 OR 鍋",
		"甜點":   "甜點 OR 蛋糕",
		"咖啡廳":  "咖啡廳 OR 咖啡",
	}

	if keyword, exists := mainKeywords[restaurantType]; exists {
		return keyword
	}

	return restaurantType
}

// 獲取餐廳類型的名稱關鍵字清單
func getNameKeywords(restaurantType string) []string {
	nameKeywordMap := map[string][]string{
		"中式料理": {"中餐廳", "中華料理", "小籠包", "炒飯", "餃子", "燒臘", "粵菜", "川菜", "湘菜", "上海菜"},
		"日式料理": {"壽司", "拉麵", "居酒屋", "丼飯", "生魚片", "串燒", "天婦羅", "日本料理", "炸豬排", "燒肉"},
		"義式料理": {"義大利麵", "披薩", "pasta", "pizza", "義大利餐廳", "焗烤", "帕尼尼", "燉飯", "提拉米蘇", "義式"},
		"韓式料理": {"韓國", "韓式", "韓式炸雞", "韓式烤肉", "石鍋拌飯", "部隊鍋", "泡菜", "辣炒年糕", "人蔘雞", "冷麵"},
		"美式料理": {"漢堡", "牛排", "美式", "三明治", "炸雞", "美國餐廳", "牛肉", "BBQ", "披薩", "薯條"},
		"泰式料理": {"泰國", "泰式", "酸辣", "打拋", "綠咖哩", "冬陰功", "泰式炒河粉", "椰奶", "芒果糯米飯", "泰國菜"},
		"早午餐":  {"早餐", "brunch", "班尼迪克蛋", "鬆餅", "吐司", "歐姆蛋", "法式吐司", "松餅", "三明治", "咖啡"},
		"海鮮料理": {"海鮮", "生魚片", "烤魚", "蝦子", "龍蝦", "螃蟹", "鮭魚", "鮪魚", "貝類", "海鮮餐廳"},
		"牛排":   {"牛排館", "排餐", "steakhouse", "肋眼", "菲力", "沙朗", "丁骨", "肉眼", "牛小排", "鐵板燒"},
		"火鍋":   {"麻辣鍋", "涮涮鍋", "石頭鍋", "小火鍋", "鴛鴦鍋", "羊肉爐", "薑母鴨", "沙茶鍋", "海鮮鍋", "泡菜鍋"},
		"甜點":   {"蛋糕", "甜點店", "冰淇淋", "巧克力", "糕點", "烘焙", "馬卡龍", "塔", "派", "奶酪"},
		"咖啡廳":  {"咖啡", "coffee", "cafe", "下午茶", "拿鐵", "咖啡店", "espresso", "卡布奇諾", "蛋糕", "甜點"},
	}

	if keywords, exists := nameKeywordMap[restaurantType]; exists {
		return keywords
	}

	// 如果沒有找到對應的名稱關鍵字，返回空數組
	return []string{}
}

// GetRandomRestaurants 獲取指定數量的隨機餐廳，並為它們填充照片URL
func (r *RestaurantRepository) GetRandomRestaurants(lat, lng float64, restaurantType string, count int) ([]model.Restaurant, error) {
	// 首先獲取所有符合條件的餐廳，不立即獲取照片URL
	allRestaurants, err := r.SearchNearby(lat, lng, restaurantType, false)
	if err != nil {
		return nil, err
	}

	if len(allRestaurants) == 0 {
		return []model.Restaurant{}, nil
	}

	// 打亂順序
	rand.Seed(time.Now().UnixNano())
	rand.Shuffle(len(allRestaurants), func(i, j int) {
		allRestaurants[i], allRestaurants[j] = allRestaurants[j], allRestaurants[i]
	})

	// 取指定數量（最多不超過實際餐廳數量）
	resultCount := count
	if len(allRestaurants) < resultCount {
		resultCount = len(allRestaurants)
	}
	randomRestaurants := allRestaurants[:resultCount]

	// 只為這些最終結果獲取照片URL
	for i := range randomRestaurants {
		// 檢查是否有照片引用（以"photoref:"開頭）
		if len(randomRestaurants[i].PhotoURL) > 9 && randomRestaurants[i].PhotoURL[:9] == "photoref:" {
			// 提取照片引用
			photoReference := randomRestaurants[i].PhotoURL[9:]
			// 獲取實際的照片URL
			randomRestaurants[i].PhotoURL = r.getPhotoURL(photoReference)

			// 添加延遲以避免超過API限制
			if i < resultCount-1 {
				time.Sleep(300 * time.Millisecond)
			}
		}
	}

	return randomRestaurants, nil
}
