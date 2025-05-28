import React, { useState } from 'react';
import {
    CardContent,
    CardMedia,
    Typography,
    Box,
    Button,
    Skeleton,
    Paper,
    Chip,
} from '@mui/material';
import { LocationOn, OpenInNew, NoPhotography, Star, AttachMoney, LocalDining, Home } from '@mui/icons-material';
import type { Restaurant as RestaurantType } from '../types';

interface RestaurantCardProps {
    restaurant: RestaurantType;
}

// 調整圖片容器高度使照片能完全填滿
const CARD_IMAGE_HEIGHT = 140;

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const handleOpenInMaps = () => {
        // 修正 Google Maps URL 格式，使用官方建議的 URL 格式
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name)}&query_place_id=${restaurant.place_id}`;
        window.open(url, '_blank');
    };

    // 產生價格等級的顯示
    const renderPriceLevel = (priceLevel: number) => {
        if (priceLevel === 0) return null;

        const dollars = [];
        for (let i = 0; i < priceLevel; i++) {
            dollars.push(<span key={i} style={{ color: '#ff6b35' }}>$</span>);
        }

        return (
            <Box component="span" sx={{ ml: 0.5, fontSize: '0.85rem', fontWeight: 500 }}>
                {dollars}
            </Box>
        );
    };

    // 請求合適尺寸的圖片
    const getOptimizedImageUrl = (url: string) => {
        if (!url) return '';

        // 如果是Google的Place Photos URL或lh3.googleusercontent.com，就直接使用不添加額外參數
        if (url.includes('maps.googleapis.com/maps/api/place/photo') ||
            url.includes('lh3.googleusercontent.com/place-photos')) {
            return url;
        }

        // 請求更大尺寸的圖片，確保品質並設置更高優先級的填滿參數
        if (url.includes('?')) {
            return `${url}&maxwidth=800&maxheight=400`;
        }

        return `${url}?maxwidth=800&maxheight=400`;
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
                width: '100%',
                height: '100%', // 恢復100%高度
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
            }}
        >
            <Box sx={{
                height: CARD_IMAGE_HEIGHT,
                position: 'relative',
                width: '100%',
                overflow: 'hidden',
                backgroundColor: 'grey.100',
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
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
                            image={getOptimizedImageUrl(restaurant.photo_url)}
                            alt={restaurant.name}
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'center center',
                                display: imageLoaded ? 'block' : 'none',
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

                {/* 評分徽章 - 確保最上層顯示 */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        zIndex: 20,
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
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                py: { xs: 1.5, md: 1.5 },
                px: { xs: 2, md: 2 },
            }}>
                {/* 餐廳名稱 */}
                <Typography
                    variant="h6"
                    component="h3"
                    noWrap
                    sx={{
                        fontWeight: 600,
                        fontSize: '1rem',
                        color: '#333',
                        mb: 0.5
                    }}
                >
                    {restaurant.name}
                </Typography>

                {/* 價格等級和餐廳類型並排顯示 */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 1.5
                    }}
                >
                    {/* 左側餐廳類型 */}
                    {restaurant.restaurant_type && (
                        <Chip
                            icon={<LocalDining sx={{ fontSize: '0.8rem' }} />}
                            label={restaurant.restaurant_type}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{
                                borderRadius: '12px',
                                height: '24px',
                                fontSize: '0.75rem',
                                '& .MuiChip-icon': {
                                    color: 'primary.main',
                                    ml: 0.5
                                }
                            }}
                        />
                    )}

                    {/* 右側價格等級 */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {renderPriceLevel(restaurant.price_level)}
                    </Box>
                </Box>

                {/* 距離與地址信息 */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        mb: 2,
                        mt: 1.5,
                        gap: 1.5
                    }}
                >
                    {/* 距離信息 */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            pb: 1.5,
                            borderBottom: '1px solid rgba(0,0,0,0.06)'
                        }}
                    >
                        <LocationOn
                            color="primary"
                            sx={{
                                fontSize: '1rem',
                                mr: 1,
                                flexShrink: 0
                            }}
                        />
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                color: '#444'
                            }}
                        >
                            距離 {restaurant.distance}
                        </Typography>
                    </Box>

                    {/* 地址信息 */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            pb: 1.5,
                            borderBottom: '1px solid rgba(0,0,0,0.06)'
                        }}
                    >
                        <Home
                            color="primary"
                            sx={{
                                fontSize: '1rem',
                                mr: 1,
                                flexShrink: 0,
                                mt: 0.2
                            }}
                        />
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                color: '#444',
                                lineHeight: 1.4
                            }}
                        >
                            {restaurant.address}
                        </Typography>
                    </Box>

                    {/* 平均消費信息 */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <AttachMoney
                            color="primary"
                            sx={{
                                fontSize: '1rem',
                                mr: 1,
                                flexShrink: 0
                            }}
                        />
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                color: '#444'
                            }}
                        >
                            {restaurant.average_price}
                        </Typography>
                    </Box>
                </Box>

                {/* 按鈕區，強制在底部 */}
                <Box sx={{
                    mt: 'auto',
                    marginTop: 'auto'
                }}>
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