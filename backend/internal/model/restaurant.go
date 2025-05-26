package model

type Location struct {
	Lat float64 `json:"lat" binding:"required"`
	Lng float64 `json:"lng" binding:"required"`
}

type Restaurant struct {
	Name     string  `json:"name"`
	Rating   float32 `json:"rating"`
	Distance string  `json:"distance"`
	PlaceID  string  `json:"place_id"`
	Address  string  `json:"address"`
	PhotoURL string  `json:"photo_url,omitempty"`
}

type RecommendResponse struct {
	Restaurants []Restaurant `json:"restaurants"`
	Message     string       `json:"message"`
}
