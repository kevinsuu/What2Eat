import axios from 'axios';
import type { RecommendResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getRecommendations = async (lat: number, lng: number): Promise<RecommendResponse> => {
    try {
        const response = await api.post<RecommendResponse>('/api/recommend', {
            lat,
            lng,
        });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 400) {
                throw new Error('位置資料無效');
            } else if (error.response?.status === 429) {
                throw new Error('請求過於頻繁，請稍後再試');
            } else if (error.response?.status === 500) {
                throw new Error('服務器錯誤，請稍後再試');
            } else if (error.code === 'ECONNABORTED') {
                throw new Error('請求逾時，請檢查網路連線');
            } else if (error.code === 'ERR_NETWORK') {
                throw new Error('無法連接到服務器，請檢查網路連線');
            }
        }
        throw new Error('發生未知錯誤');
    }
};

export const healthCheck = async (): Promise<{ status: string; message: string }> => {
    try {
        const response = await api.get('/health');
        return response.data;
    } catch (error) {
        throw new Error('服務器連線失敗');
    }
}; 