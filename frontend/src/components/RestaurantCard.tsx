import React from 'react';
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Box,
    Rating,
    Button,
    Chip,
} from '@mui/material';
import { LocationOn, OpenInNew } from '@mui/icons-material';
import type { Restaurant } from '../types';

interface RestaurantCardProps {
    restaurant: Restaurant;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant }) => {
    const handleOpenInMaps = () => {
        const url = `https://www.google.com/maps/place/?q=place_id:${restaurant.place_id}`;
        window.open(url, '_blank');
    };

    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                },
            }}
        >
            {restaurant.photo_url && (
                <CardMedia
                    component="img"
                    height="200"
                    image={restaurant.photo_url}
                    alt={restaurant.name}
                    sx={{
                        objectFit: 'cover',
                    }}
                />
            )}

            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" component="h3" gutterBottom noWrap>
                    {restaurant.name}
                </Typography>

                <Box display="flex" alignItems="center" mb={1}>
                    <Rating
                        value={restaurant.rating}
                        precision={0.1}
                        readOnly
                        size="small"
                    />
                    <Typography variant="body2" color="text.secondary" ml={1}>
                        {restaurant.rating.toFixed(1)}
                    </Typography>
                </Box>

                <Box display="flex" alignItems="center" mb={1}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary" ml={0.5}>
                        {restaurant.distance}
                    </Typography>
                </Box>

                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        flexGrow: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                    }}
                >
                    {restaurant.address}
                </Typography>

                <Box mt={2}>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleOpenInMaps}
                        startIcon={<OpenInNew />}
                        sx={{
                            borderRadius: 2,
                        }}
                    >
                        在 Google Maps 中查看
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

export default RestaurantCard; 