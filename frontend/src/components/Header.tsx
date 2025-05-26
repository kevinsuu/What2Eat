import { Box, Typography, Paper, Button, CircularProgress } from '@mui/material';
import { Restaurant, RestaurantMenu } from '@mui/icons-material';
import { LocationOn } from '@mui/icons-material';
import { Fade } from '@mui/material';

type HeaderProps = {
    loading: boolean;
    location: { lat: number; lng: number } | null;
    onRecommend: () => void;
    hasRestaurants: boolean;
};

const Header = ({ loading, location, onRecommend, hasRestaurants }: HeaderProps) => {
    return (
        <Fade in={true} timeout={800}>
            <Paper
                elevation={2}
                sx={{
                    borderRadius: 3,
                    py: { xs: 4, md: hasRestaurants ? 2 : 3 },
                    px: { xs: 3, md: hasRestaurants ? 3 : 4 },
                    mb: { xs: 4, md: hasRestaurants ? 3 : 2 },
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    width: '100%',
                    maxWidth: hasRestaurants ? '100%' : '800px',
                    mx: 'auto',
                    '&:hover': {
                        boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                    },
                }}
            >
                <Box
                    sx={{
                        mb: { xs: 3, md: hasRestaurants ? 1 : 2 },
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
                                fontSize: hasRestaurants ? '1.5rem' : '2rem',
                                color: 'primary.main',
                                mr: 1
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
                                    xs: '2.5rem',
                                    md: hasRestaurants ? '2rem' : '2.5rem'
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

                {!hasRestaurants && (
                    <Typography
                        variant="h6"
                        color="text.secondary"
                        mb={2}
                        sx={{
                            fontSize: {
                                xs: '1.05rem',
                                md: '1rem'
                            },
                            px: { xs: 1, md: 2 },
                            maxWidth: '600px',
                            mx: 'auto',
                            lineHeight: 1.4,
                        }}
                    >
                        不知道要吃什麼？讓我們為你推薦附近的優質餐廳！
                    </Typography>
                )}

                <Button
                    variant="contained"
                    size={hasRestaurants ? "medium" : "large"}
                    onClick={onRecommend}
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
                            transform: 'translateY(-2px)',
                        }
                    }}
                >
                    {loading ? '搜尋中...' : '推薦餐廳'}
                </Button>

                {location && (
                    <Box mt={1} display="flex" alignItems="center" justifyContent="center">
                        <LocationOn color="primary" fontSize="small" />
                        <Typography variant="body2" color="text.secondary" ml={0.5}>
                            已定位到您的位置
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Fade>
    );
};

export default Header; 