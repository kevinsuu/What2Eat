import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// 讀取 GitHub 儲存庫名稱（用於設置 base 路徑）
const repositoryName = 'What2Eat'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 載入環境變數
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    // 設置 base 路徑，適用於 GitHub Pages
    base: process.env.NODE_ENV === 'production' ? `/${repositoryName}/` : '/',
    // 定義環境變數
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'https://what2eat-orfc.onrender.com'),
      'import.meta.env.VITE_KOFI_USERNAME': JSON.stringify(env.VITE_KOFI_USERNAME || 'kevinsuu'),
    },
    // 處理跨域請求
    server: {
      proxy: {
        '/api': {
          target: 'https://what2eat-orfc.onrender.com',
          changeOrigin: true,
          secure: false,
        },
        '/health': {
          target: 'https://what2eat-orfc.onrender.com',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
