package service

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type CounterData struct {
	Count     int       `json:"count"`
	LastReset time.Time `json:"last_reset"`
}

// APIRequestLog 記錄API請求的信息
type APIRequestLog struct {
	Timestamp time.Time `json:"timestamp"`
	Endpoint  string    `json:"endpoint"`
	Lat       float64   `json:"lat"`
	Lng       float64   `json:"lng"`
	Type      string    `json:"type,omitempty"`
	Success   bool      `json:"success"`
	Error     string    `json:"error,omitempty"`
}

type CounterService struct {
	mu            sync.RWMutex
	count         int
	lastReset     time.Time
	dailyLimit    int
	dataFile      string
	apiLogsFile   string
	limitExceeded bool // 新增標記，表示是否超過限制
}

func NewCounterService(dailyLimit int) *CounterService {
	dataDir := "data"
	dataFile := filepath.Join(dataDir, "counter.json")
	apiLogsFile := filepath.Join(dataDir, "api_logs.json")

	// 確保 data 目錄存在
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		fmt.Printf("警告: 無法建立 data 目錄: %v\n", err)
	}

	cs := &CounterService{
		count:         0,
		lastReset:     time.Now(),
		dailyLimit:    dailyLimit,
		dataFile:      dataFile,
		apiLogsFile:   apiLogsFile,
		limitExceeded: false,
	}

	// 載入之前的數據
	cs.loadFromFile()

	// 立即檢查是否已經超出限制
	if cs.count >= cs.dailyLimit {
		cs.limitExceeded = true
	}

	return cs
}

// 從檔案載入計數數據
func (c *CounterService) loadFromFile() {
	data, err := os.ReadFile(c.dataFile)
	if err != nil {
		// 檔案不存在是正常的，第一次運行
		return
	}

	var counterData CounterData
	if err := json.Unmarshal(data, &counterData); err != nil {
		fmt.Printf("警告: 無法解析計數檔案: %v\n", err)
		return
	}

	c.count = counterData.Count
	c.lastReset = counterData.LastReset

	// 檢查是否需要重置（跨日了）
	c.checkAndReset()
}

// 保存到檔案
func (c *CounterService) saveToFile() {
	counterData := CounterData{
		Count:     c.count,
		LastReset: c.lastReset,
	}

	data, err := json.MarshalIndent(counterData, "", "  ")
	if err != nil {
		fmt.Printf("警告: 無法序列化計數數據: %v\n", err)
		return
	}

	if err := os.WriteFile(c.dataFile, data, 0644); err != nil {
		fmt.Printf("警告: 無法保存計數檔案: %v\n", err)
	}
}

// LogAPIRequest 記錄API請求
func (c *CounterService) LogAPIRequest(endpoint string, lat, lng float64, restaurantType string, success bool, errMsg string) {
	// 創建新的日誌條目
	logEntry := APIRequestLog{
		Timestamp: time.Now(),
		Endpoint:  endpoint,
		Lat:       lat,
		Lng:       lng,
		Type:      restaurantType,
		Success:   success,
		Error:     errMsg,
	}

	// 讀取現有日誌
	var logs []APIRequestLog
	data, err := os.ReadFile(c.apiLogsFile)
	if err == nil {
		// 文件存在，解析已有日誌
		if err := json.Unmarshal(data, &logs); err != nil {
			fmt.Printf("警告: 無法解析API日誌檔案: %v\n", err)
			logs = []APIRequestLog{}
		}
	}

	// 添加新的日誌條目
	logs = append(logs, logEntry)

	// 如果日誌太多，只保留最新的1000條
	if len(logs) > 1000 {
		logs = logs[len(logs)-1000:]
	}

	// 保存更新後的日誌
	newData, err := json.MarshalIndent(logs, "", "  ")
	if err != nil {
		fmt.Printf("警告: 無法序列化API日誌: %v\n", err)
		return
	}

	if err := os.WriteFile(c.apiLogsFile, newData, 0644); err != nil {
		fmt.Printf("警告: 無法保存API日誌檔案: %v\n", err)
	}
}

// 檢查是否需要重置計數器 (同步Google API，太平洋時間00:00，對應台灣時間15:00-16:00)
func (c *CounterService) checkAndReset() {
	now := time.Now()

	// 獲取太平洋時間
	var ptLocation *time.Location
	var err error
	ptLocation, err = time.LoadLocation("America/Los_Angeles")
	if err != nil {
		// 如果無法加載時區，使用固定的-8小時偏移（近似值）
		fmt.Printf("警告: 無法載入太平洋時區: %v，使用固定偏移\n", err)
		ptLocation = time.FixedZone("PT", -8*60*60)
	}

	// 轉換為太平洋時間
	nowPT := now.In(ptLocation)

	// 上次重置時間轉換為太平洋時間
	lastResetPT := c.lastReset.In(ptLocation)

	// 計算太平洋時間的日期（忽略時間）
	todayPT := time.Date(nowPT.Year(), nowPT.Month(), nowPT.Day(), 0, 0, 0, 0, ptLocation)
	lastResetDayPT := time.Date(lastResetPT.Year(), lastResetPT.Month(), lastResetPT.Day(), 0, 0, 0, 0, ptLocation)

	// 如果太平洋時間的今天和上次重置不是同一天，就重置計數器
	if !todayPT.Equal(lastResetDayPT) {
		fmt.Printf("重置API計數器: 太平洋時間已跨日 (PT: %s)\n", nowPT.Format("2006-01-02 15:04:05"))
		c.count = 0
		c.lastReset = now
		c.limitExceeded = false // 重置限制標記
		c.saveToFile()          // 保存重置後的狀態
	}
}

// 檢查是否超過每日限制
func (c *CounterService) CheckDailyLimit() error {
	c.mu.RLock()
	defer c.mu.RUnlock()

	c.checkAndReset()

	if c.limitExceeded || c.count >= c.dailyLimit {
		c.limitExceeded = true
		return fmt.Errorf("免費額度已到，暫停相關推薦功能。今日已使用 %d/%d 次", c.count, c.dailyLimit)
	}

	return nil
}

// 增加計數並返回當前使用量
func (c *CounterService) IncrementAndGetUsage() (int, int, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.checkAndReset()

	// 檢查是否超過限制
	if c.limitExceeded || c.count >= c.dailyLimit {
		c.limitExceeded = true
		return c.count, c.dailyLimit, fmt.Errorf("免費額度已到，暫停相關推薦功能。感謝使用我的服務，您的支持是我最大的動力")
	}

	// 增加計數
	c.count++

	// 檢查增加後是否達到限制
	if c.count >= c.dailyLimit {
		c.limitExceeded = true
	}

	c.saveToFile() // 每次增加後保存
	return c.count, c.dailyLimit, nil
}

// 取得當前使用量
func (c *CounterService) GetUsage() (int, int) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	c.checkAndReset()
	return c.count, c.dailyLimit
}

// IsLimitExceeded 檢查是否已超過限制
func (c *CounterService) IsLimitExceeded() bool {
	c.mu.RLock()
	defer c.mu.RUnlock()

	c.checkAndReset()
	return c.limitExceeded
}

// SetLimitExceeded 設置超過限制的狀態
func (c *CounterService) SetLimitExceeded(exceeded bool) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.limitExceeded = exceeded
	c.saveToFile() // 保存狀態變更
}

// 取得使用量字串 (如: "1/500")
func (c *CounterService) GetUsageString() string {
	current, limit := c.GetUsage()
	return fmt.Sprintf("%d/%d", current, limit)
}

// 重置計數器 (測試用)
func (c *CounterService) Reset() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.count = 0
	c.lastReset = time.Now()
	c.limitExceeded = false
	c.saveToFile()
}

// 取得距離下次重置的時間
func (c *CounterService) GetTimeUntilReset() time.Duration {
	c.mu.RLock()
	defer c.mu.RUnlock()

	now := time.Now()

	// 獲取太平洋時間
	var ptLocation *time.Location
	var err error
	ptLocation, err = time.LoadLocation("America/Los_Angeles")
	if err != nil {
		// 如果無法加載時區，使用固定的-8小時偏移（近似值）
		ptLocation = time.FixedZone("PT", -8*60*60)
	}

	// 轉換為太平洋時間
	nowPT := now.In(ptLocation)

	// 計算太平洋時間的下一個午夜
	tomorrowPT := time.Date(nowPT.Year(), nowPT.Month(), nowPT.Day(), 0, 0, 0, 0, ptLocation).AddDate(0, 0, 1)

	// 轉換回本地時間
	tomorrowLocal := tomorrowPT.In(now.Location())

	return time.Until(tomorrowLocal)
}
