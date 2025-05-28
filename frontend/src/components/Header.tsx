import { useState } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Chip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Restaurant, RestaurantMenu, FilterAlt } from '@mui/icons-material';
import { LocationOn } from '@mui/icons-material';
import { Fade } from '@mui/material';
import { getAllRestaurantTypes, RESTAURANT_TYPES } from '../types';

type HeaderProps = {
    loading: boolean;
    location: { lat: number; lng: number } | null;
    onRecommend: (restaurantType?: string) => void;
    hasRestaurants: boolean;
};

const Header = ({ loading, location, onRecommend, hasRestaurants }: HeaderProps) => {
    const [selectedType, setSelectedType] = useState<string>(RESTAURANT_TYPES.RANDOM);
    const [openTypeDialog, setOpenTypeDialog] = useState(false);

    const handleOpenTypeDialog = () => {
        setOpenTypeDialog(true);
    };

    const handleCloseTypeDialog = () => {
        setOpenTypeDialog(false);
    };

    const handleTypeSelect = (type: string) => {
        setSelectedType(type);
        setOpenTypeDialog(false);
    };

    const handleRecommend = () => {
        onRecommend(selectedType === RESTAURANT_TYPES.RANDOM ? undefined : selectedType);
    };

    return (
        <Fade in={true} timeout={800}>
            <Paper
                elevation={2}
                sx={{
                    borderRadius: 3,
                    py: { xs: 2, md: hasRestaurants ? 1.5 : 2 },
                    px: { xs: 2, md: hasRestaurants ? 2 : 3 },
                    mb: { xs: 2, md: hasRestaurants ? 2 : 1.5 },
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    width: '100%',
                    maxWidth: hasRestaurants ? '100%' : '800px',
                    mx: 'auto',
                    '&:hover': {
                        boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
                    },
                }}
            >
                <Box
                    sx={{
                        mb: { xs: 1.5, md: hasRestaurants ? 0.5 : 1 },
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: hasRestaurants ? 0 : 0.5,
                            '& svg': {
                                fontSize: hasRestaurants ? '1.3rem' : '1.8rem',
                                color: 'primary.main',
                                mr: 0.5
                            }
                        }}
                    >
                        <RestaurantMenu />
                        <Typography
                            variant="h3"
                            component="h1"
                            color="primary"
                            sx={{
                                fontSize: {
                                    xs: '2rem',
                                    md: hasRestaurants ? '1.8rem' : '2.2rem'
                                },
                                background: 'linear-gradient(45deg, #ff6b35 30%, #ff8c61 90%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontWeight: 700,
                                letterSpacing: '-0.5px'
                            }}
                        >
                            What2Eat
                        </Typography>
                    </Box>
                </Box>

                <Typography
                    variant="h6"
                    color="text.secondary"
                    mb={1}
                    sx={{
                        fontSize: '0.9rem',
                        px: 1,
                        maxWidth: '600px',
                        mx: 'auto',
                        lineHeight: 1.3,
                        opacity: hasRestaurants ? 0.8 : 1,
                        height: '22px'
                    }}
                >
                    {hasRestaurants ? '推薦完成！選擇其他類型再試試看？' : '不知道要吃什麼？讓我們為你推薦附近的優質餐廳！'}
                </Typography>

                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 1.5,
                    justifyContent: 'center',
                    alignItems: 'center',
                    mb: 1
                }}>
                    <Button
                        variant="outlined"
                        onClick={handleOpenTypeDialog}
                        startIcon={<FilterAlt />}
                        disabled={loading}
                        sx={{
                            borderRadius: 3,
                            py: 1,
                            px: 2,
                            borderColor: selectedType ? 'primary.main' : 'grey.300',
                            color: selectedType ? 'primary.main' : 'text.secondary',
                            backgroundColor: selectedType ? 'rgba(255, 107, 53, 0.05)' : 'transparent',
                            '&:hover': {
                                backgroundColor: selectedType ? 'rgba(255, 107, 53, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                                borderColor: selectedType ? 'primary.main' : 'grey.400',
                            }
                        }}
                    >
                        {selectedType || '選擇餐廳類型'}
                    </Button>

                    <Button
                        variant="contained"
                        size={hasRestaurants ? "medium" : "large"}
                        onClick={handleRecommend}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Restaurant />}
                        sx={{
                            py: {
                                xs: 1.5,
                                md: hasRestaurants ? 1 : 1.5
                            },
                            px: {
                                xs: 4,
                                md: hasRestaurants ? 3 : 4
                            },
                            fontSize: {
                                xs: '1.05rem',
                                md: hasRestaurants ? '0.9rem' : '1rem'
                            },
                            borderRadius: 3,
                            width: { xs: '100%', sm: 'auto' },
                            minWidth: {
                                xs: '100%',
                                sm: hasRestaurants ? '150px' : '200px'
                            },
                            transition: 'all 0.3s ease',
                            background: 'linear-gradient(45deg, #ff6b35 30%, #ff8c61 90%)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #e85a2a 30%, #ff6b35 90%)',
                            }
                        }}
                    >
                        {loading ? '搜尋中...' : '推薦餐廳'}
                    </Button>
                </Box>
                {location && (
                    <Box mt={2.5} display="flex" alignItems="center" justifyContent="center">
                        <LocationOn color="primary" fontSize="small" />
                        <Typography variant="body2" color="text.secondary" ml={0.5}>
                            已定位到您的位置
                        </Typography>
                    </Box>
                )}

                {/* 餐廳類型選擇對話框 */}
                <Dialog
                    open={openTypeDialog}
                    onClose={handleCloseTypeDialog}
                    PaperProps={{
                        sx: {
                            borderRadius: 3,
                            width: '100%',
                            maxWidth: '500px',
                            mx: 2
                        }
                    }}
                >
                    <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
                        選擇餐廳類型
                    </DialogTitle>
                    <DialogContent sx={{ pt: 1 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 1.5,
                                mt: 0.5,
                                justifyContent: 'center'
                            }}
                        >
                            {getAllRestaurantTypes().map((type) => (
                                <Chip
                                    key={type}
                                    label={type}
                                    onClick={() => handleTypeSelect(type)}
                                    color={selectedType === type ? "primary" : "default"}
                                    variant={selectedType === type ? "filled" : "outlined"}
                                    sx={{
                                        fontWeight: selectedType === type ? 600 : 400,
                                        transition: 'all 0.2s ease',
                                        margin: 0.5,
                                        '&:hover': {
                                            backgroundColor: selectedType === type
                                                ? 'primary.main'
                                                : 'rgba(0, 0, 0, 0.08)'
                                        }
                                    }}
                                />
                            ))}
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
                        <Button
                            onClick={handleCloseTypeDialog}
                            variant="outlined"
                            sx={{ borderRadius: 2, px: 3 }}
                        >
                            取消
                        </Button>
                        <Button
                            onClick={() => {
                                setSelectedType(RESTAURANT_TYPES.RANDOM);
                                setOpenTypeDialog(false);
                            }}
                            variant="contained"
                            color="primary"
                            sx={{
                                borderRadius: 2,
                                px: 3,
                                ml: 2,
                                bgcolor: 'primary.main'
                            }}
                        >
                            清除選擇
                        </Button>
                    </DialogActions>
                </Dialog>
            </Paper>
        </Fade>
    );
};

export default Header; 