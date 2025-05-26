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
} from '@mui/material';
import { LocationOn, OpenInNew, NoPhotography } from '@mui/icons-material';
import type { Restaurant } from '../types';

interface RestaurantCardProps {
    restaurant: Restaurant;
}

const CARD_IMAGE_HEIGHT = 180; // 統一定義圖片高度

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
            return `${url}&maxwidth=300&maxheight=${CARD_IMAGE_HEIGHT}`;
        }
        // 否則添加第一個參數
        return `${url}?maxwidth=300&maxheight=${CARD_IMAGE_HEIGHT}`;
    };

    const handleImageError = () => {
        setImageError(true);
    };

    const handleImageLoaded = () => {
        setImageLoaded(true);
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
                overflow: 'hidden', // 確保內容不會溢出
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
                        }}
                    >
                        <NoPhotography sx={{ fontSize: 40, opacity: 0.7, mb: 1 }} />
                        <Typography variant="body2" color="text.secondary" align="center">
                            暫無圖片
                        </Typography>
                    </Box>
                )}
            </Box>

            <CardContent sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                py: { xs: 2, md: 1.5 }, // 減少卡片內容的上下邊距
                px: { xs: 2, md: 2 },
            }}>
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
                        WebkitLineClamp: { xs: 2, md: 1 }, // 電腦版只顯示一行地址
                        WebkitBoxOrient: 'vertical',
                        fontSize: { xs: '0.875rem', md: '0.75rem' }, // 電腦版更小的字體
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