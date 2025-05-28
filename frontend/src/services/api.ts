import axios from 'axios';
import type { RecommendResponse } from '../types';

// 設定 API 的 base URL，從環境變量獲取或使用默認值
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// 創建 axios 實例，設定較長的超時時間以處理 render.com 冷啟動
const api = axios.create({
    baseURL: apiUrl,
    timeout: 20000, // 20秒，處理 render.com 冷啟動較慢的情況
});

// 健康檢查 API
export const healthCheck = async (): Promise<void> => {
    try {
        await api.get(`/health`);
        console.log('健康檢查成功');
    } catch (error) {
        console.error('健康檢查失敗:', error);
        throw error;
    }
};

// 獲取餐廳推薦
export const getRecommendations = async (
    lat: number,
    lng: number,
    restaurantType?: string
): Promise<RecommendResponse> => {
    try {
        console.log(`發送餐廳推薦請求: 位置 [${lat}, ${lng}], 類型: ${restaurantType || '隨便'}`);

        // 構建請求參數
        const params: Record<string, string | number> = {
            lat,
            lng
        };

        // 如果指定了餐廳類型且不是"隨便"，添加到參數中
        if (restaurantType && restaurantType !== '隨便') {
            params.type = restaurantType;
        }

        // 使用 GET 請求新的 API 端點
        const response = await api.get(`/api/restaurants`, { params });
        return response.data;
    } catch (error) {
        console.error('獲取餐廳推薦失敗:', error);

        // 提供更友好的錯誤信息
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 429) {
                // 處理API限制錯誤，格式化錯誤訊息
                const apiLimitData = error.response.data;
                if (apiLimitData) {
                    // Google Maps API額度用完的情況
                    if (apiLimitData.error && apiLimitData.error.includes('Google Maps API')) {
                        throw new Error(`${apiLimitData.error} 明天伺服器重啟後將恢復正常服務。`);
                    }
                    // 一般的API限制情況
                    else if (apiLimitData.error && apiLimitData.reset_in) {
                        throw new Error(`${apiLimitData.error} 將在 ${formatResetTime(apiLimitData.reset_in)} 後重置。`);
                    } else if (apiLimitData.error) {
                        throw new Error(apiLimitData.error);
                    }
                }
                throw new Error('每日API請求次數已達上限，請明天再試。');
            } else if (error.code === 'ECONNABORTED') {
                throw new Error('請求超時，伺服器可能剛啟動，請稍後再試');
            } else if (error.response?.status === 500) {
                // 嘗試從錯誤詳細信息中提取有用的信息
                const errorData = error.response.data;
                if (errorData && errorData.details && errorData.details.includes('OVER_QUERY_LIMIT')) {
                    throw new Error('伺服器額度已滿，請等明天再使用。');
                }
                throw new Error('伺服器內部錯誤，請稍後再試');
            }
        }

        throw new Error('無法獲取附近餐廳，請稍後再試');
    }
};

// 格式化重置時間
const formatResetTime = (resetTimeStr: string): string => {
    try {
        // 嘗試解析 "xxhxxmxxs" 格式
        const hours = resetTimeStr.match(/(\d+)h/);
        const minutes = resetTimeStr.match(/(\d+)m/);
        const seconds = resetTimeStr.match(/(\d+)\.?\d*s/);

        let result = '';

        if (hours) {
            result += `${hours[1]}小時`;
        }

        if (minutes) {
            result += `${minutes[1]}分鐘`;
        }

        if (seconds) {
            // 只取整數部分
            const s = parseInt(seconds[1]);
            if (s > 0) {
                result += `${s}秒`;
            }
        }

        return result || resetTimeStr;
    } catch (e) {
        // 如果有錯誤，嘗試簡單清理字符串
        return resetTimeStr.replace(/\.\d+s/, 's');
    }
}; 