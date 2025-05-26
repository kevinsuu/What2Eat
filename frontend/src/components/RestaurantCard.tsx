import React, { useState } from 'react';
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Box,
    Rating,
    Button,
    Chip,
    Skeleton,
    Paper,
} from '@mui/material';
import { LocationOn, OpenInNew, NoPhotography, Restaurant, Star } from '@mui/icons-material';
import type { Restaurant as RestaurantType } from '../types';

interface RestaurantCardProps {
    restaurant: RestaurantType;
}

// 縮小圖片高度，讓卡片更緊湊
const CARD_IMAGE_HEIGHT = 140;

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const handleOpenInMaps = () => {
        const url = `https://www.google.com/maps/place/?q=place_id:${restaurant.place_id}`;
        window.open(url, '_blank');
    };

    // 修改圖片URL，添加較小的尺寸參數來減少流量
    const getOptimizedImageUrl = (url: string) => {
        if (!url) return '';
        // 如果已經有參數，添加更多參數
        if (url.includes('?')) {
            return `${url}&maxwidth=400&maxheight=${CARD_IMAGE_HEIGHT}`;
        }
        // 否則添加第一個參數
        return `${url}?maxwidth=400&maxheight=${CARD_IMAGE_HEIGHT}`;
    };

    const handleImageError = () => {
        setImageError(true);
    };

    const handleImageLoaded = () => {
        setImageLoaded(true);
    };

    return (
        <Paper
            elevation={0}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                },
                background: 'white',
                border: '1px solid rgba(0,0,0,0.05)',
                maxHeight: '400px', // 限制最大高度，適應單屏顯示
            }}
        >
            <Box sx={{
                height: CARD_IMAGE_HEIGHT,
                position: 'relative',
                width: '100%',
                overflow: 'hidden',
                backgroundColor: 'grey.100'
            }}>
                {restaurant.photo_url && !imageError ? (
                    <>
                        {!imageLoaded && (
                            <Skeleton
                                variant="rectangular"
                                height={CARD_IMAGE_HEIGHT}
                                width="100%"
                                animation="wave"
                                sx={{
                                    bgcolor: 'grey.200',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0
                                }}
                            />
                        )}
                        <CardMedia
                            component="img"
                            height={CARD_IMAGE_HEIGHT}
                            image={getOptimizedImageUrl(restaurant.photo_url)}
                            alt={restaurant.name}
                            sx={{
                                objectFit: 'cover',
                                display: imageLoaded ? 'block' : 'none',
                                width: '100%',
                                height: '100%',
                                transition: 'transform 0.5s ease',
                                filter: 'brightness(0.95)',
                                '&:hover': {
                                    transform: 'scale(1.05)',
                                    filter: 'brightness(1)',
                                },
                            }}
                            onError={handleImageError}
                            onLoad={handleImageLoaded}
                        />
                    </>
                ) : (
                    <Box
                        sx={{
                            height: '100%',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            background: 'linear-gradient(45deg, #f5f5f5 0%, #eeeeee 100%)',
                        }}
                    >
                        <NoPhotography sx={{ fontSize: 32, opacity: 0.7, mb: 0.5, color: '#bdbdbd' }} />
                        <Typography variant="body2" color="text.secondary" align="center">
                            暫無圖片
                        </Typography>
                    </Box>
                )}

                {/* 評分徽章 */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        bgcolor: 'rgba(255, 107, 53, 0.95)',
                        borderRadius: '12px',
                        py: 0.3,
                        px: 1,
                        display: 'flex',
                        alignItems: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                >
                    <Star sx={{ color: 'white', fontSize: '0.8rem', mr: 0.3 }} />
                    <Typography variant="body2" fontWeight="bold" color="white" sx={{ fontSize: '0.8rem' }}>
                        {restaurant.rating.toFixed(1)}
                    </Typography>
                </Box>
            </Box>

            <CardContent sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                py: { xs: 1.5, md: 1.5 },
                px: { xs: 2, md: 2 },
            }}>
                <Typography
                    variant="h6"
                    component="h3"
                    gutterBottom
                    noWrap
                    sx={{
                        fontWeight: 600,
                        mb: 1,
                        fontSize: '1rem',
                        color: '#333',
                    }}
                >
                    {restaurant.name}
                </Typography>

                <Box
                    display="flex"
                    alignItems="flex-start"
                    mb={1}
                    sx={{
                        background: 'rgba(0, 0, 0, 0.02)',
                        borderRadius: 2,
                        py: 0.8,
                        px: 1.2,
                    }}
                >
                    <LocationOn
                        fontSize="small"
                        color="primary"
                        sx={{ mr: 0.8, fontSize: '1rem', mt: 0.1 }}
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography
                            variant="body2"
                            color="text.primary"
                            sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#444' }}
                        >
                            距離 {restaurant.distance}
                        </Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                fontSize: '0.75rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                color: '#666',
                            }}
                        >
                            {restaurant.address}
                        </Typography>
                    </Box>
                </Box>

                <Box mt="auto" pt={0.5}>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleOpenInMaps}
                        startIcon={<OpenInNew sx={{ fontSize: '0.8rem' }} />}
                        sx={{
                            borderRadius: 6,
                            py: 0.8,
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            background: 'linear-gradient(45deg, #ff6b35 30%, #ff8c61 90%)',
                            boxShadow: '0 4px 10px rgba(255, 107, 53, 0.2)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #e85a2a 30%, #ff6b35 90%)',
                                boxShadow: '0 6px 15px rgba(255, 107, 53, 0.3)',
                            }
                        }}
                    >
                        在 Google Maps 中查看
                    </Button>
                </Box>
            </CardContent>
        </Paper>
    );
};

export default RestaurantCard; 