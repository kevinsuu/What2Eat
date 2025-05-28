export interface Restaurant {
    name: string;
    rating: number;
    distance: string;
    place_id: string;
    address: string;
    photo_url?: string;
    price_level: number;
    average_price: string;
    restaurant_type?: string;
}

export interface RecommendResponse {
    restaurants: Restaurant[];
    message: string;
    usage?: string;           // API使用情況，格式如"5/600"
    reset_in?: string;        // 距離下次重置的時間
}

export interface Location {
    lat: number;
    lng: number;
}

// 餐廳類型常數
export const RESTAURANT_TYPES = {
    RANDOM: '隨便吃',
    CHINESE: '中式料理',
    JAPANESE: '日式料理',
    ITALIAN: '義式料理',
    KOREAN: '韓式料理',
    AMERICAN: '美式料理',
    THAI: '泰式料理',
    BREAKFAST: '早午餐',
    SEAFOOD: '海鮮料理',
    STEAK: '牛排',
    HOTPOT: '火鍋',
    DESSERT: '甜點',
    CAFE: '咖啡廳',
    BUFFET: '自助餐廳'
} as const;

// 餐廳類型與 Google Maps 類型對應表
export const RESTAURANT_TYPE_MAPPING = {
    [RESTAURANT_TYPES.CHINESE]: 'chinese',
    [RESTAURANT_TYPES.JAPANESE]: 'japanese',
    [RESTAURANT_TYPES.ITALIAN]: 'italian',
    [RESTAURANT_TYPES.KOREAN]: 'korean',
    [RESTAURANT_TYPES.AMERICAN]: 'american',
    [RESTAURANT_TYPES.THAI]: 'thai',
    [RESTAURANT_TYPES.BREAKFAST]: 'breakfast',
    [RESTAURANT_TYPES.SEAFOOD]: 'seafood',
    [RESTAURANT_TYPES.STEAK]: 'steak',
    [RESTAURANT_TYPES.HOTPOT]: 'hotpot',
    [RESTAURANT_TYPES.DESSERT]: 'dessert',
    [RESTAURANT_TYPES.CAFE]: 'cafe',
    [RESTAURANT_TYPES.BUFFET]: 'buffet'
} as const;

// 返回所有餐廳類型
export const getAllRestaurantTypes = (): string[] => {
    return Object.values(RESTAURANT_TYPES);
}; 