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
      main: '#1a1a1a', // SMK 黑色
    },
    background: {
      default: '#f5f5f5',
    }
  },
  typography: {
    h3: {
      fontWeight: 700,
    },
    fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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
      <Box
        className={restaurants.length > 0 ? 'has-restaurants' : ''}
        sx={{
          width: '100%',
          minHeight: '100vh', // 使用最小高度
          py: { xs: 3, md: 2 }, // 調整上下邊距
          display: 'flex',
          flexDirection: 'column',
          justifyContent: restaurants.length > 0 ? 'flex-start' : 'center', // 有餐廳時從頂部開始
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            width: '100%',
            px: { xs: 2, sm: 3 },
          }}
        >
          <Box textAlign="center" mb={{ xs: 3, md: 2 }}>
            <Box
              sx={{
                mb: { xs: 2, md: 1 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >

              <Typography
                variant="h3"
                component="h1"
                color="primary"
                sx={{
                  fontSize: { xs: '2.2rem', md: '2rem' }, // 調整手機版標題大小
                  mb: { xs: 1, md: 0.5 } // 減少下方間距
                }}
              >
                What2Eat
              </Typography>
            </Box>
            <Typography
              variant="h6"
              color="text.secondary"
              mb={2}
              sx={{
                fontSize: { xs: '0.95rem', md: '0.95rem' },
                px: { xs: 2, md: 0 } // 手機版添加左右邊距
              }}
            >
              不知道要吃什麼？讓我們為你推薦附近的優質餐廳！
            </Typography>

            <Button
              variant="contained"
              size="large"
              onClick={handleRecommend}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Restaurant />}
              sx={{
                py: { xs: 1.2, md: 1.5 },
                px: { xs: 3, md: 4 },
                fontSize: { xs: '1rem', md: '1.1rem' },
                borderRadius: 3,
                width: { xs: '100%', sm: 'auto' }, // 手機版全寬按鈕
                maxWidth: { xs: '100%', sm: '300px' } // 限制最大寬度
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
            <Alert severity="error" sx={{ mb: 3, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
              {error}
            </Alert>
          )}

          {restaurants.length > 0 && (
            <Box>
              <Typography variant="h5" gutterBottom textAlign="center" mb={{ xs: 3, md: 2 }}>
                為您推薦 {restaurants.length} 家餐廳
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: { xs: 2, md: 3 }, // 調整間距
                  '& > *': {
                    width: {
                      xs: '100%', // 手機版全寬
                      sm: 'calc(50% - 16px)', // 平板每行兩個
                      md: 'calc(33.333% - 16px)', // 桌面每行三個
                    },
                    maxWidth: { xs: '100%', sm: '320px', md: '320px' }, // 限制最大寬度
                    minWidth: { xs: 'unset', sm: '280px', md: '280px' }, // 取消手機版最小寬度
                  }
                }}
              >
                {restaurants.map((restaurant, index) => (
                  <RestaurantCard key={restaurant.place_id || index} restaurant={restaurant} />
                ))}
              </Box>
            </Box>
          )}

          {restaurants.length === 0 && !loading && !error && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary" mb={2}>
                點擊上方按鈕開始尋找美食！
              </Typography>
              <Box
                component="img"
                src="/image.png"
                alt="SMK Logo"
                sx={{
                  height: 40,
                  opacity: 0.7,
                  filter: 'grayscale(100%)'
                }}
              />
            </Box>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
