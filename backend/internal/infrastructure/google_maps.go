package infrastructure

import (
	"googlemaps.github.io/maps"
)

func NewGoogleMapsClient(apiKey string) (*maps.Client, error) {
	return maps.NewClient(maps.WithAPIKey(apiKey))
}
