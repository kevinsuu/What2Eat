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
- 🧠 收藏/標記你喜歡的店  
- 💸 支援贊助開發者  

---

## 🧑‍💻 技術架構

| 前端 | 後端 |
|------|------|
| React | Golang  |
| MUI | RESTful API |
| Google Maps JavaScript API | Google Places API |
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

- [ ] 收藏與個人偏好推薦  
- [ ] 收藏與個人偏好推薦  
- [x] 價格區間 / 類型篩選  
- [ ] 推薦算法（評價 / 距離）  
- [ ] LINE Bot 整合  


## 📄 License

MIT License © 2025 Kevinsu

---

## ✨ 作者 Kevinsu

Backend & Fullstack Engineer  
📫 kevinsu.dev ｜ ✉️ contact@xxx.com ｜ GitHub [@Kevinsu](https://github.com/Kevinsu)