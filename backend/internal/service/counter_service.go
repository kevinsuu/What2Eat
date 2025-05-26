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

type CounterService struct {
	mu         sync.RWMutex
	count      int
	lastReset  time.Time
	dailyLimit int
	dataFile   string
}

func NewCounterService(dailyLimit int) *CounterService {
	dataFile := filepath.Join("data", "counter.json")

	// 確保 data 目錄存在
	if err := os.MkdirAll("data", 0755); err != nil {
		fmt.Printf("警告: 無法建立 data 目錄: %v\n", err)
	}

	cs := &CounterService{
		count:      0,
		lastReset:  time.Now(),
		dailyLimit: dailyLimit,
		dataFile:   dataFile,
	}

	// 載入之前的數據
	cs.loadFromFile()

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

// 檢查是否需要重置計數器 (每日 0:00)
func (c *CounterService) checkAndReset() {
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	lastResetDay := time.Date(c.lastReset.Year(), c.lastReset.Month(), c.lastReset.Day(), 0, 0, 0, 0, c.lastReset.Location())

	// 如果今天和上次重置不是同一天，就重置計數器
	if !today.Equal(lastResetDay) {
		c.count = 0
		c.lastReset = now
		c.saveToFile() // 保存重置後的狀態
	}
}

// 檢查是否超過每日限制
func (c *CounterService) CheckDailyLimit() error {
	c.mu.RLock()
	defer c.mu.RUnlock()

	c.checkAndReset()

	if c.count >= c.dailyLimit {
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
	if c.count >= c.dailyLimit {
		return c.count, c.dailyLimit, fmt.Errorf("免費額度已到，暫停相關推薦功能。感謝使用我的服務，您的支持是我最大的動力")
	}

	// 增加計數
	c.count++
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
	c.saveToFile()
}

// 取得距離下次重置的時間
func (c *CounterService) GetTimeUntilReset() time.Duration {
	c.mu.RLock()
	defer c.mu.RUnlock()

	now := time.Now()
	tomorrow := now.AddDate(0, 0, 1)
	nextMidnight := time.Date(tomorrow.Year(), tomorrow.Month(), tomorrow.Day(), 0, 0, 0, 0, tomorrow.Location())
	return time.Until(nextMidnight)
}
