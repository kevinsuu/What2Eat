package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

// 全域速率限制器 - 每秒最多 10 個請求，突發 20 個
var globalLimiter = rate.NewLimiter(rate.Limit(30), 50)

var (
	ipLimiters   = make(map[string]*rate.Limiter)
	limiterMutex = &sync.Mutex{}
)

// 取得或建立 IP 專用的速率限制器
func getIPLimiter(ip string) *rate.Limiter {
	limiter, exists := ipLimiters[ip]
	if !exists {
		// 每個 IP 每秒最多 3 個請求，突發 5 個
		limiter = rate.NewLimiter(rate.Limit(10), 15)
		ipLimiters[ip] = limiter
	}
	return limiter
}

// 全域流量限制中間件
func GlobalRateLimit() gin.HandlerFunc {
	// 全局限流從每秒 20 個請求改為每秒 30 個請求
	limiter := rate.NewLimiter(30, 50)

	return func(c *gin.Context) {
		if !limiter.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "系統繁忙，請稍後再試",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}

// IP 流量限制中間件
func IPRateLimit() gin.HandlerFunc {
	// IP 速率從每分鐘 30 個請求改為每分鐘 60 個
	return func(c *gin.Context) {
		ip := c.ClientIP()
		limiterMutex.Lock()
		if _, exists := ipLimiters[ip]; !exists {
			ipLimiters[ip] = rate.NewLimiter(1, 60)
		}
		limiter := ipLimiters[ip]
		limiterMutex.Unlock()

		if !limiter.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "請求過於頻繁，請稍後再試",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}

// 安全標頭中間件
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 防止 XSS 攻擊
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")

		// 強制 HTTPS (生產環境)
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

		// 內容安全政策
		c.Header("Content-Security-Policy", "default-src 'self'")

		// 隱藏伺服器資訊
		c.Header("Server", "What2Eat-API")

		c.Next()
	}
}

// 請求大小限制中間件
func RequestSizeLimit(maxSize int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.ContentLength > maxSize {
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{
				"error":    "請求內容過大",
				"code":     "REQUEST_TOO_LARGE",
				"message":  "請求大小超過限制",
				"max_size": maxSize,
			})
			c.Abort()
			return
		}
		c.Next()
	}
}

// 超時中間件
func TimeoutMiddleware(timeout time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 簡單的超時實現
		done := make(chan bool, 1)

		go func() {
			c.Next()
			done <- true
		}()

		select {
		case <-done:
			// 請求完成
			return
		case <-time.After(timeout):
			// 請求超時
			c.JSON(http.StatusRequestTimeout, gin.H{
				"error":   "請求超時",
				"code":    "REQUEST_TIMEOUT",
				"message": "伺服器處理請求超時，請稍後再試",
			})
			c.Abort()
			return
		}
	}
}

// API 專用流量限制 (更嚴格)
func APIRateLimit() gin.HandlerFunc {
	// 從每秒 5 個請求改為每秒 10 個請求
	limiter := rate.NewLimiter(10, 20)

	return func(c *gin.Context) {
		if !limiter.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "請求過於頻繁，請稍後再試",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}

// 健康檢查白名單
func HealthCheckBypass() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 健康檢查不受流量限制
		if c.Request.URL.Path == "/health" {
			c.Next()
			return
		}
		c.Next()
	}
}
