package service

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

type RateLimiterService struct {
	redisClient *redis.Client
	dailyLimit  int
}

func NewRateLimiterService(redisClient *redis.Client, dailyLimit int) *RateLimiterService {
	return &RateLimiterService{
		redisClient: redisClient,
		dailyLimit:  dailyLimit,
	}
}

// 檢查是否超過每日限制
func (r *RateLimiterService) CheckDailyLimit(ctx context.Context) error {
	today := time.Now().Format("2006-01-02")
	key := fmt.Sprintf("api_calls:%s", today)

	// 取得今日呼叫次數
	countStr, err := r.redisClient.Get(ctx, key).Result()
	if err != nil && err != redis.Nil {
		return fmt.Errorf("Redis 錯誤: %v", err)
	}

	count := 0
	if countStr != "" {
		count, _ = strconv.Atoi(countStr)
	}

	// 檢查是否超過限制
	if count >= r.dailyLimit {
		return fmt.Errorf("免費額度已到，暫停相關推薦功能。感謝使用我的服務，您的支持是我最大的動力")
	}

	return nil
}

// 增加 API 呼叫計數
func (r *RateLimiterService) IncrementCount(ctx context.Context) error {
	today := time.Now().Format("2006-01-02")
	key := fmt.Sprintf("api_calls:%s", today)

	// 增加計數
	pipe := r.redisClient.Pipeline()
	pipe.Incr(ctx, key)

	// 設定過期時間為明天凌晨
	tomorrow := time.Now().AddDate(0, 0, 1)
	midnight := time.Date(tomorrow.Year(), tomorrow.Month(), tomorrow.Day(), 0, 0, 0, 0, tomorrow.Location())
	ttl := time.Until(midnight)
	pipe.Expire(ctx, key, ttl)

	_, err := pipe.Exec(ctx)
	return err
}

// 取得今日使用量
func (r *RateLimiterService) GetTodayUsage(ctx context.Context) (int, error) {
	today := time.Now().Format("2006-01-02")
	key := fmt.Sprintf("api_calls:%s", today)

	countStr, err := r.redisClient.Get(ctx, key).Result()
	if err != nil && err != redis.Nil {
		return 0, err
	}

	if countStr == "" {
		return 0, nil
	}

	return strconv.Atoi(countStr)
}

// 重置計數器 (測試用)
func (r *RateLimiterService) ResetCount(ctx context.Context) error {
	today := time.Now().Format("2006-01-02")
	key := fmt.Sprintf("api_calls:%s", today)
	return r.redisClient.Del(ctx, key).Err()
}
