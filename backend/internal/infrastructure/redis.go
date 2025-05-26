package infrastructure

import (
	"context"

	"github.com/redis/go-redis/v9"
)

func NewRedisClient(addr, password string, db int) *redis.Client {
	return redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})
}

// 測試 Redis 連線
func TestRedisConnection(client *redis.Client) error {
	ctx := context.Background()
	return client.Ping(ctx).Err()
}
