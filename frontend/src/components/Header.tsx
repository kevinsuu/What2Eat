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
                    py: { xs: 2, md: hasRestaurants ? 1.5 : 3 },
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
                        mb: { xs: 1.5, md: hasRestaurants ? 0.5 : 2 },
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: hasRestaurants ? 0 : 1,
                            '& svg': {
                                fontSize: hasRestaurants ? '1.3rem' : '2.2rem',
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
                                    md: hasRestaurants ? '1.8rem' : '2.6rem'
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
                    mb={hasRestaurants ? 1 : 2}
                    sx={{
                        fontSize: hasRestaurants ? '0.9rem' : '1.1rem',
                        px: 1,
                        maxWidth: '600px',
                        mx: 'auto',
                        lineHeight: 1.3,
                        opacity: hasRestaurants ? 0.8 : 1,
                        height: 'auto'
                    }}
                >
                    {hasRestaurants ? '推薦完成！選擇其他類型再試試看？' : '不知道要吃什麼？讓我們為你推薦附近的優質餐廳！'}
                </Typography>

                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: hasRestaurants ? 1.5 : 2.5,
                    justifyContent: 'center',
                    alignItems: 'center',
                    mb: hasRestaurants ? 1 : 2,
                    mt: hasRestaurants ? 0 : 1
                }}>
                    <Button
                        variant="outlined"
                        onClick={handleOpenTypeDialog}
                        startIcon={<FilterAlt sx={{ fontSize: hasRestaurants ? 'inherit' : '1.3rem' }} />}
                        disabled={loading}
                        sx={{
                            borderRadius: 3,
                            py: hasRestaurants ? 1 : 1.5,
                            px: hasRestaurants ? 2 : 3,
                            borderColor: selectedType ? 'primary.main' : 'grey.300',
                            color: selectedType ? 'primary.main' : 'text.secondary',
                            backgroundColor: selectedType ? 'rgba(255, 107, 53, 0.05)' : 'transparent',
                            fontSize: hasRestaurants ? 'inherit' : '1.1rem',
                            borderWidth: hasRestaurants ? 1 : 1.5,
                            '&:hover': {
                                backgroundColor: selectedType ? 'rgba(255, 107, 53, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                                borderColor: selectedType ? 'primary.main' : 'grey.400',
                                transform: hasRestaurants ? 'none' : 'translateY(-2px)',
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
                        startIcon={loading ?
                            <CircularProgress size={hasRestaurants ? 20 : 24} color="inherit" /> :
                            <Restaurant sx={{ fontSize: hasRestaurants ? 'inherit' : '1.3rem' }} />
                        }
                        sx={{
                            py: {
                                xs: hasRestaurants ? 1.5 : 2,
                                md: hasRestaurants ? 1 : 1.8
                            },
                            px: {
                                xs: hasRestaurants ? 4 : 5,
                                md: hasRestaurants ? 3 : 5
                            },
                            fontSize: {
                                xs: hasRestaurants ? '1.05rem' : '1.2rem',
                                md: hasRestaurants ? '0.9rem' : '1.2rem'
                            },
                            borderRadius: 3,
                            width: { xs: '100%', sm: 'auto' },
                            minWidth: {
                                xs: '100%',
                                sm: hasRestaurants ? '150px' : '220px'
                            },
                            transition: 'all 0.3s ease',
                            background: 'linear-gradient(45deg, #ff6b35 30%, #ff8c61 90%)',
                            boxShadow: hasRestaurants ? 'none' : '0 6px 15px rgba(255, 107, 53, 0.25)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #e85a2a 30%, #ff6b35 90%)',
                                boxShadow: hasRestaurants ? 'none' : '0 8px 20px rgba(255, 107, 53, 0.3)',
                                transform: hasRestaurants ? 'none' : 'translateY(-3px)'
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
                            maxWidth: '750px',
                            mx: 2,
                            overflow: 'hidden'
                        }
                    }}
                >
                    <DialogTitle sx={{
                        textAlign: 'center',
                        pb: { xs: 2, md: 2.5 },
                        pt: { xs: 2.5, md: 3.5 },
                        fontSize: { xs: '1.5rem', md: '1.7rem' },
                        fontWeight: 600,
                        color: 'primary.main',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
                    }}>
                        選擇餐廳類型
                    </DialogTitle>
                    <DialogContent sx={{
                        pt: { xs: 2, md: 4 },
                        pb: { xs: 2, md: 4 }
                    }}>
                        <Box
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: { xs: 1.5, sm: 2, md: 3 },
                                mt: 1,
                                mb: 1,
                                px: { xs: 1, sm: 2, md: 3 },
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
                                        fontWeight: selectedType === type ? 700 : 500,
                                        fontSize: {
                                            xs: '1rem',
                                            sm: '1.2rem',
                                            md: '1.4rem'
                                        },
                                        height: {
                                            xs: '44px',
                                            sm: '54px',
                                            md: '64px'
                                        },
                                        padding: {
                                            xs: '8px 4px',
                                            sm: '10px 6px',
                                            md: '12px 8px'
                                        },
                                        borderRadius: {
                                            xs: '22px',
                                            sm: '27px',
                                            md: '32px'
                                        },
                                        margin: {
                                            xs: 0.5,
                                            sm: 0.75,
                                            md: 1
                                        },
                                        transition: 'all 0.3s ease',
                                        borderWidth: {
                                            xs: '1px',
                                            md: '2px'
                                        },
                                        boxShadow: selectedType === type ?
                                            '0 6px 10px rgba(255, 107, 53, 0.25)' :
                                            'none',
                                        '&:hover': {
                                            backgroundColor: selectedType === type
                                                ? 'primary.main'
                                                : 'rgba(0, 0, 0, 0.08)',
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 8px 15px rgba(0, 0, 0, 0.15)'
                                        },
                                        '& .MuiChip-label': {
                                            padding: {
                                                xs: '0 12px',
                                                sm: '0 18px',
                                                md: '0 24px'
                                            }
                                        }
                                    }}
                                />
                            ))}
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{
                        px: { xs: 2, sm: 3, md: 4 },
                        pb: { xs: 2, sm: 3, md: 4 },
                        pt: { xs: 1, md: 2 },
                        justifyContent: 'center',
                        gap: { xs: 2, md: 3 }
                    }}>
                        <Button
                            onClick={handleCloseTypeDialog}
                            variant="outlined"
                            sx={{
                                borderRadius: 6,
                                px: { xs: 3, md: 4 },
                                py: { xs: 1, md: 1.5 },
                                fontSize: { xs: '0.9rem', md: '1rem' },
                                fontWeight: 500,
                                borderColor: 'rgba(0, 0, 0, 0.15)',
                                color: 'text.secondary',
                                '&:hover': {
                                    borderColor: 'rgba(0, 0, 0, 0.3)',
                                    backgroundColor: 'rgba(0, 0, 0, 0.03)'
                                }
                            }}
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
                                borderRadius: 6,
                                px: { xs: 3, md: 4 },
                                py: { xs: 1, md: 1.5 },
                                fontSize: { xs: '0.9rem', md: '1rem' },
                                fontWeight: 600,
                                bgcolor: 'primary.main',
                                background: 'linear-gradient(45deg, #ff6b35 30%, #ff8c61 90%)',
                                boxShadow: '0 4px 10px rgba(255, 107, 53, 0.2)',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #e85a2a 30%, #ff6b35 90%)',
                                    boxShadow: '0 6px 15px rgba(255, 107, 53, 0.3)',
                                }
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