import axios from 'axios';
import type { RecommendResponse } from '../types';

// 預設使用 Render.com 部署的後端 API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://what2eat-orfc.onrender.com';

// 確定當前環境
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// 根據環境選擇 API URL
const apiUrl = isDevelopment ? 'http://localhost:8080' : API_BASE_URL;

console.log('使用 API URL:', apiUrl);

const api = axios.create({
    baseURL: apiUrl,
    timeout: 15000, // 增加超時時間，Render 啟動可能較慢
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getRecommendations = async (lat: number, lng: number): Promise<RecommendResponse> => {
    try {
        console.log(`發送請求到 ${apiUrl}/api/recommend，位置: lat=${lat}, lng=${lng}`);
        const response = await api.post<RecommendResponse>('/api/recommend', {
            lat,
            lng,
        });
        console.log('獲取推薦成功:', response.data);
        return response.data;
    } catch (error) {
        console.error('獲取推薦錯誤:', error);

        if (axios.isAxiosError(error)) {
            if (error.response?.status === 400) {
                throw new Error('位置資料無效');
            } else if (error.response?.status === 429) {
                throw new Error('請求過於頻繁，請稍後再試');
            } else if (error.response?.status === 500) {
                throw new Error('服務器錯誤，請稍後再試');
            } else if (error.response?.status === 403) {
                throw new Error('伺服器拒絕存取 (CORS 錯誤)，請聯繫開發者');
            } else if (error.code === 'ECONNABORTED') {
                throw new Error('請求逾時，伺服器可能剛啟動，請稍後再試');
            } else if (error.code === 'ERR_NETWORK') {
                throw new Error('無法連接到服務器，請檢查網路連線');
            }
        }
        throw new Error('發生未知錯誤，請稍後再試');
    }
};

export const healthCheck = async (): Promise<{ status: string; message: string }> => {
    try {
        console.log(`發送健康檢查請求到 ${apiUrl}/health`);
        const response = await api.get('/health');
        console.log('健康檢查成功:', response.data);
        return response.data;
    } catch (error) {
        console.error('健康檢查失敗:', error);
        if (axios.isAxiosError(error) && error.response?.status === 403) {
            throw new Error('伺服器拒絕存取 (CORS 錯誤)，請聯繫開發者');
        }
        throw new Error('服務器連線失敗，可能剛啟動，請稍後再試');
    }
}; 