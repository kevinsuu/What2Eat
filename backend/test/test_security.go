package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

func main() {
	fmt.Println("=== 測試伺服器安全功能 ===")

	baseURL := "http://localhost:8080"

	// 測試健康檢查
	fmt.Println("\n1. 測試健康檢查...")
	testHealthCheck(baseURL)

	// 測試流量限制
	fmt.Println("\n2. 測試 API 流量限制...")
	testAPIRateLimit(baseURL)

	// 測試請求大小限制
	fmt.Println("\n3. 測試請求大小限制...")
	testRequestSizeLimit(baseURL)

	// 測試安全標頭
	fmt.Println("\n4. 測試安全標頭...")
	testSecurityHeaders(baseURL)
}

func testHealthCheck(baseURL string) {
	resp, err := http.Get(baseURL + "/health")
	if err != nil {
		fmt.Printf("❌ 健康檢查失敗: %v\n", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == 200 {
		fmt.Printf("✅ 健康檢查成功 (狀態碼: %d)\n", resp.StatusCode)
	} else {
		fmt.Printf("❌ 健康檢查失敗 (狀態碼: %d)\n", resp.StatusCode)
	}
}

func testAPIRateLimit(baseURL string) {
	url := baseURL + "/api/recommend"
	payload := map[string]interface{}{
		"lat": 25.0330,
		"lng": 121.5654,
	}

	jsonData, _ := json.Marshal(payload)

	fmt.Println("發送多個快速請求測試流量限制...")

	for i := 1; i <= 5; i++ {
		resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
		if err != nil {
			fmt.Printf("❌ 請求 %d 失敗: %v\n", i, err)
			continue
		}

		fmt.Printf("請求 %d: 狀態碼 %d", i, resp.StatusCode)

		if resp.StatusCode == 429 {
			fmt.Printf(" ✅ (流量限制生效)")
		} else if resp.StatusCode == 200 {
			fmt.Printf(" ✅ (正常)")
		} else {
			fmt.Printf(" ❌ (異常)")
		}
		fmt.Println()

		resp.Body.Close()

		// 稍微延遲避免太快
		time.Sleep(500 * time.Millisecond)
	}
}

func testRequestSizeLimit(baseURL string) {
	url := baseURL + "/api/recommend"

	// 建立一個大的請求 (超過 1MB)
	largeData := make(map[string]interface{})
	largeData["lat"] = 25.0330
	largeData["lng"] = 121.5654
	largeData["large_field"] = string(make([]byte, 2*1024*1024)) // 2MB 的數據

	jsonData, _ := json.Marshal(largeData)

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Printf("❌ 大請求測試失敗: %v\n", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == 413 {
		fmt.Printf("✅ 請求大小限制生效 (狀態碼: %d)\n", resp.StatusCode)
	} else {
		fmt.Printf("❌ 請求大小限制未生效 (狀態碼: %d)\n", resp.StatusCode)
	}
}

func testSecurityHeaders(baseURL string) {
	resp, err := http.Get(baseURL + "/health")
	if err != nil {
		fmt.Printf("❌ 安全標頭測試失敗: %v\n", err)
		return
	}
	defer resp.Body.Close()

	securityHeaders := []string{
		"X-Content-Type-Options",
		"X-Frame-Options",
		"X-XSS-Protection",
		"Server",
	}

	fmt.Println("檢查安全標頭:")
	for _, header := range securityHeaders {
		value := resp.Header.Get(header)
		if value != "" {
			fmt.Printf("✅ %s: %s\n", header, value)
		} else {
			fmt.Printf("❌ %s: 未設定\n", header)
		}
	}
}
