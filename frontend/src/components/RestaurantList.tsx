import { Box, Paper, Typography, Fade } from '@mui/material';
import { Restaurant } from '@mui/icons-material';
import RestaurantCard from './RestaurantCard';
import type { Restaurant as RestaurantType } from '../types';

type RestaurantListProps = {
    restaurants: RestaurantType[];
};

const RestaurantList = ({ restaurants }: RestaurantListProps) => {
    if (restaurants.length === 0) return null;

    return (
        <Fade in={restaurants.length > 0} timeout={800}>
            <Box sx={{ mb: { xs: 6, md: 4 } }}>
                <Paper
                    sx={{
                        p: { xs: 3, md: 1.5 },
                        mb: { xs: 3, md: 2 },
                        textAlign: 'center',
                        borderRadius: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, rgba(255,107,53,0.05) 0%, rgba(255,140,97,0.05) 100%)',
                        border: '1px solid rgba(255,107,53,0.1)',
                    }}
                >
                    <Typography
                        variant="h5"
                        gutterBottom={false}
                        color="primary"
                        sx={{
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: { xs: '1.25rem', md: '1rem' },
                            my: 0,
                            '& svg': {
                                mr: 1
                            }
                        }}
                    >
                        <Restaurant fontSize="small" />
                        為您推薦 {restaurants.length} 家餐廳
                    </Typography>
                </Paper>

                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        justifyContent: 'space-between',
                        gap: { xs: 3, md: 3 },
                        mt: 3
                    }}
                >
                    {restaurants.map((restaurant, index) => (
                        <Box
                            key={restaurant.place_id || index}
                            sx={{
                                flex: '1 1 0',
                                minWidth: 0,
                                width: { xs: '100%', md: `${100 / restaurants.length}%` }
                            }}
                        >
                            <RestaurantCard restaurant={restaurant} />
                        </Box>
                    ))}
                </Box>
            </Box>
        </Fade>
    );
};

export default RestaurantList; 