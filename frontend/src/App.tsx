import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Link,
} from '@mui/material';
import { LocationOn, Restaurant, LocalCafe, Favorite } from '@mui/icons-material';
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
  const [clickCount, setClickCount] = useState(0);
  const [showDonateDialog, setShowDonateDialog] = useState(false);

  // 監聽點擊事件，達到5次顯示捐贈對話框
  useEffect(() => {
    const totalClickCount = parseInt(localStorage.getItem('totalClickCount') || '0');
    const refuseCount = parseInt(localStorage.getItem('donateRefuseCount') || '0');

    // 如果總點擊次數達到5次，或者拒絕後又點擊了10次
    if ((totalClickCount >= 5 && refuseCount === 0) || (refuseCount > 0 && clickCount >= 10)) {
      // 檢查localStorage，避免重複顯示
      const lastShown = localStorage.getItem('lastDonateDialogShown');
      const now = new Date().getTime();

      // 如果從未顯示過或者已經過了1天
      if (!lastShown || (now - parseInt(lastShown)) > 24 * 60 * 60 * 1000) {
        setShowDonateDialog(true);
        // 記錄顯示時間
        localStorage.setItem('lastDonateDialogShown', now.toString());
        // 重置點擊計數
        setClickCount(0);
        localStorage.setItem('totalClickCount', totalClickCount.toString());
      }
    }
  }, [clickCount]);

  // 全局點擊監聽
  useEffect(() => {
    const handleGlobalClick = () => {
      const newCount = clickCount + 1;
      setClickCount(newCount);

      // 更新總點擊次數
      const totalClickCount = parseInt(localStorage.getItem('totalClickCount') || '0');
      localStorage.setItem('totalClickCount', (totalClickCount + 1).toString());
    };

    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [clickCount]);

  const handleCloseDonateDialog = () => {
    setShowDonateDialog(false);
    // 增加拒絕計數
    const refuseCount = parseInt(localStorage.getItem('donateRefuseCount') || '0');
    localStorage.setItem('donateRefuseCount', (refuseCount + 1).toString());
  };

  const handleDonate = () => {
    // 這裡可以導向到你的捐款頁面
    window.open('https://www.buymeacoffee.com/yourname', '_blank');
    setShowDonateDialog(false);
  };

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
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)'
                  },
                  gap: { xs: 2, md: 3 },
                  justifyItems: 'center',
                  mx: 'auto'
                }}
              >
                {restaurants.map((restaurant, index) => (
                  <Box
                    key={restaurant.place_id || index}
                    sx={{
                      width: '100%',
                      maxWidth: { xs: '100%', sm: '320px', md: '320px' }
                    }}
                  >
                    <RestaurantCard restaurant={restaurant} />
                  </Box>
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

      {/* 捐贈對話框 */}
      <Dialog
        open={showDonateDialog}
        onClose={handleCloseDonateDialog}
        aria-labelledby="donate-dialog-title"
        aria-describedby="donate-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxWidth: 400
          }
        }}
      >
        <DialogTitle id="donate-dialog-title" sx={{ textAlign: 'center', pt: 3 }}>
          <Favorite color="error" sx={{ mr: 1, verticalAlign: 'middle' }} />
          {parseInt(localStorage.getItem('donateRefuseCount') || '0') > 0
            ? '我們很努力在做這個服務'
            : '喜歡 What2Eat 嗎？'}
        </DialogTitle>
        <DialogContent>
          <Box
            component="img"
            src="/image.png"
            alt="SMK Logo"
            sx={{
              width: 80,
              height: 80,
              display: 'block',
              margin: '0 auto 16px',
              borderRadius: '50%'
            }}
          />
          <DialogContentText id="donate-dialog-description" sx={{ textAlign: 'center', mb: 2 }}>
            {parseInt(localStorage.getItem('donateRefuseCount') || '0') > 0
              ? '開發與維護這個應用真的很辛苦，確定不支持我一下嗎？您的小小支持是我們最大的動力！'
              : '如果這個應用幫到了你，考慮請我喝杯咖啡支持開發嗎？'}
            <Box component="span" display="block" mt={1}>
              <LocalCafe color="primary" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              您的支持讓我們能夠持續改進與開發更好的功能！
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 3 }}>
          <Button
            onClick={handleCloseDonateDialog}
            color="inherit"
            variant="outlined"
            sx={{ width: '45%' }}
          >
            {parseInt(localStorage.getItem('donateRefuseCount') || '0') > 0 ? '下次再說' : '先不要'}
          </Button>
          <Button
            onClick={handleDonate}
            color="primary"
            variant="contained"
            startIcon={<LocalCafe />}
            sx={{ width: '45%' }}
          >
            支持
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;
