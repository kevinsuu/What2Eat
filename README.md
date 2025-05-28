# 🥡 What2Eat：附近推薦吃什麼？

每天都在煩惱要吃什麼嗎？  
這是一個利用 Google Maps 定位，自動推薦附近餐廳的小工具，一鍵推薦你 **3 間附近高評價店家**，幫你解決選擇障礙！

> React 前端 + Golang 後端全開源，輕量又實用！

---

## 🌟 功能特色

- 📍 根據 GPS 自動抓取目前位置  
- 🎲 一鍵推薦三家附近餐廳  
- 🧾 餐廳分類：中式、義式、日式、早午餐等  
- 💰 顯示餐廳價格等級（$、$$、$$$、$$$$）
- ❤️ 收藏喜愛的餐廳並依類型整理 
- 📝 為收藏餐廳添加個人備註與標記
- 🔍 快速從收藏中尋找並推薦  
- 💸 支援贊助開發者  

---

## 🧑‍💻 技術架構

| 前端 | 後端 |
|------|------|
| React | Golang  |
| MUI | RESTful API |
| Google Maps JavaScript API | Google Places API |
| Local Storage (暫存收藏) | Firebase (用戶收藏) |
| GitHub Pages |  Render |


---

## 🚀 快速開始

### 安裝前端

```bash
cd frontend
npm install
npm run dev
```

### 啟動後端

```bash
cd backend
go run main.go
```

> 預設後端為 `http://localhost:8080`，可在 `.env` 設定前端的 `REACT_API_URL`

---

## 🌍 Demo 網站

👉 [前往體驗](https://kevinsuu.github.io/What2Eat/)  
（或自行部署）

---

## 🙌 贊助支持

如果你覺得這個專案實用，歡迎請我喝杯咖啡：

- 💳 [贊助我](https://ko-fi.com/kevinsuu)
- ⭐ 歡迎 Star 本 repo！

---

## 🧠 TODO / 開發中功能

- [ ] 個人收藏與偏好餐廳推薦
  - [ ] 收藏喜愛的餐廳到個人清單
  - [ ] 依餐廳類型篩選個人收藏
  - [ ] 從收藏中隨機推薦餐廳
  - [ ] 為收藏的餐廳添加個人備註
  - [ ] 按距離排序收藏餐廳
- [x] 價格區間 / 類型篩選  
- [ ] 智能推薦算法（評價 / 距離權重）  
- [ ] LINE Bot 整合
  - [ ] 聊天機器人查詢附近餐廳
  - [ ] 快速分享推薦餐廳

### 📱 個人收藏功能概念

```
🔍 尋找餐廳 ➡️ ❤️ 加入收藏 ➡️ 📋 管理收藏清單 ➡️ 🏷️ 分類篩選 ➡️ 🎲 從收藏隨機推薦
```

用戶可以將喜愛的餐廳加入個人收藏，並按類型分類。當再次使用應用時，可以選擇從所有附近餐廳中推薦，或只從個人收藏中進行推薦，大幅提高推薦的準確性和用戶滿意度。

## 📄 License

MIT License © 2025 Kevinsu

---

## ✨ 作者 Kevinsu

Backend & Fullstack Engineer  
📫 kevinsu.dev ｜ ✉️ sjs47311@gmail.com ｜ GitHub [@Kevinsuu](https://github.com/kevinsuu)