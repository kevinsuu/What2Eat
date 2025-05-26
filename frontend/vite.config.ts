import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 讀取 GitHub 儲存庫名稱（用於設置 base 路徑）
const repositoryName = 'What2Eat'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 設置 base 路徑，適用於 GitHub Pages
  base: process.env.NODE_ENV === 'production' ? `/${repositoryName}/` : '/',
})
