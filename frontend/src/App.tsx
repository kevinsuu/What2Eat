import React, { useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from '@mui/material';
import { LocationOn, Restaurant } from '@mui/icons-material';
import RestaurantCard from './components/RestaurantCard';
import { getRecommendations } from './services/api';
import type { Restaurant as RestaurantType } from './types';

const theme = createTheme({
  palette: {
    primary: {
      main: '#ff6b35',
    },
    secondary: {
      main: '#f7931e',
    },
  },
  typography: {
    h3: {
      fontWeight: 700,
    },
  },
});

function App() {
  const [restaurants, setRestaurants] = useState<RestaurantType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('瀏覽器不支援定位功能'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(coords);
          resolve(coords);
        },
        (error) => {
          let errorMessage = '定位失敗';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = '請允許網站存取您的位置';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = '無法取得位置資訊';
              break;
            case error.TIMEOUT:
              errorMessage = '定位請求逾時';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5分鐘快取
        }
      );
    });
  };

  const handleRecommend = async () => {
    setLoading(true);
    setError(null);
    setRestaurants([]);

    try {
      // 獲取位置
      const coords = location || await getCurrentLocation();

      // 獲取推薦餐廳
      const data = await getRecommendations(coords.lat, coords.lng);
      setRestaurants(data.restaurants);

      if (data.restaurants.length === 0) {
        setError('附近沒有找到合適的餐廳，請稍後再試');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '發生未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box textAlign="center" mb={4}>
          <Typography variant="h3" component="h1" gutterBottom color="primary">
            🥡 What2Eat
          </Typography>
          <Typography variant="h6" color="text.secondary" mb={3}>
            不知道要吃什麼？讓我們為你推薦附近的優質餐廳！
          </Typography>

          <Button
            variant="contained"
            size="large"
            onClick={handleRecommend}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Restaurant />}
            sx={{
              py: 1.5,
              px: 4,
              fontSize: '1.1rem',
              borderRadius: 3,
            }}
          >
            {loading ? '搜尋中...' : '推薦餐廳'}
          </Button>

          {location && (
            <Box mt={2} display="flex" alignItems="center" justifyContent="center">
              <LocationOn color="action" fontSize="small" />
              <Typography variant="body2" color="text.secondary" ml={0.5}>
                已定位到您的位置
              </Typography>
            </Box>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {restaurants.length > 0 && (
          <Box>
            <Typography variant="h5" gutterBottom textAlign="center" mb={3}>
              為您推薦 {restaurants.length} 家餐廳
            </Typography>
            <Box
              display="grid"
              gridTemplateColumns={{
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              }}
              gap={3}
            >
              {restaurants.map((restaurant, index) => (
                <RestaurantCard key={restaurant.place_id || index} restaurant={restaurant} />
              ))}
            </Box>
          </Box>
        )}

        {restaurants.length === 0 && !loading && !error && (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary">
              點擊上方按鈕開始尋找美食！
            </Typography>
          </Box>
        )}
      </Container>
    </ThemeProvider>
  );
}

export default App;
