export interface Restaurant {
    name: string;
    rating: number;
    distance: string;
    place_id: string;
    address: string;
    photo_url?: string;
}

export interface RecommendResponse {
    restaurants: Restaurant[];
    message: string;
}

export interface Location {
    lat: number;
    lng: number;
} 