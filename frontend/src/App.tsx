import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Alert,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Fade,
} from '@mui/material';
import { getRecommendations, healthCheck } from './services/api';
import type { Restaurant as RestaurantType } from './types';

// 導入自定義組件
import Header from './components/Header';
import RestaurantList from './components/RestaurantList';
import DonateDialog from './components/DonateDialog';
import Footer from './components/Footer';
import EmptyState from './components/EmptyState';

const theme = createTheme({
  palette: {
    primary: {
      main: '#ff6b35',
      light: '#ff8c61',
      dark: '#e85a2a',
    },
    secondary: {
      main: '#1a1a1a', // SMK 黑色
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    error: {
      main: '#f44336',
    },
  },
  typography: {
    h3: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 20px rgba(0,0,0,0.05)',
        },
      },
    },
  },
});

function App() {
  const [restaurants, setRestaurants] = useState<RestaurantType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [showDonateDialog, setShowDonateDialog] = useState(false);

  // 保持 Render 服務活躍的健康檢查
  useEffect(() => {
    console.log('初始化健康檢查系統');

    // 健康檢查函數
    const performHealthCheck = async () => {
      console.log('執行健康檢查...');
      try {
        await healthCheck();
        console.log('健康檢查成功 - 服務正常運行');
      } catch (err) {
        console.log('健康檢查失敗 - 服務可能正在啟動', err);
      }
    };

    // 立即執行一次
    performHealthCheck();

    // 每分鐘執行一次健康檢查
    console.log('設置健康檢查間隔: 1分鐘');
    const interval = setInterval(performHealthCheck, 1 * 60 * 1000);

    return () => {
      console.log('清理健康檢查間隔');
      clearInterval(interval);
    };
  }, []);

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
    // 使用 Ko-fi 連結進行 PayPal 支付
    const kofiUsername = import.meta.env.VITE_KOFI_USERNAME || 'kevinsuu';
    window.open(`https://ko-fi.com/${kofiUsername}`, '_blank');
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

  const handleRecommend = async (restaurantType?: string) => {
    setLoading(true);
    setError(null);
    setRestaurants([]);

    try {
      // 獲取位置
      const coords = location || await getCurrentLocation();

      // 獲取推薦餐廳
      const data = await getRecommendations(coords.lat, coords.lng, restaurantType);

      setRestaurants(data.restaurants);

      if (data.restaurants.length === 0) {
        setError(restaurantType
          ? `附近沒有找到合適的${restaurantType}餐廳，請嘗試其他類型`
          : '附近沒有找到合適的餐廳，請稍後再試');
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
        sx={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        }}
      >
        {/* 主要內容區域 */}
        <Box
          sx={{
            flex: '1 0 auto',
            pt: { xs: 4, md: 2 }, // 原始的頂部間距
            pb: { xs: 4, md: 1 }, // 原始的底部間距
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Container
            maxWidth={restaurants.length > 0 ? "xl" : "lg"}
            sx={{
              width: '100%',
              px: { xs: 2, sm: 3, md: 4 },
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Header
              loading={loading}
              location={location}
              onRecommend={handleRecommend}
              hasRestaurants={restaurants.length > 0}
            />

            {error && (
              <Fade in={!!error} timeout={500}>
                <Alert
                  severity={error.includes('額度已') || error.includes('API 每日請求數已達上限') ? "warning" : "error"}
                  sx={{
                    mb: 2, // 減少間距
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    borderRadius: 2,
                    // 如果是額度限制錯誤，使用更大的字體和突出顯示
                    fontSize: error.includes('額度已') || error.includes('API 每日請求數已達上限') ? '1.1rem' : 'inherit',
                    fontWeight: error.includes('額度已') || error.includes('API 每日請求數已達上限') ? 'bold' : 'normal',
                  }}
                >
                  {error}
                </Alert>
              </Fade>
            )}

            {restaurants.length > 0 ? (
              <RestaurantList restaurants={restaurants} />
            ) : (
              !loading && !error && <EmptyState />
            )}
          </Container>
        </Box>

        {/* 頁腳區域 - 更加緊湊的設計 */}
        <Box
          sx={{
            flexShrink: 0,
            width: '100%',
            mt: { xs: 2, md: 0 }, // 減少頂部間距
            position: { xs: 'relative', md: 'sticky' }, // 在電腦版採用固定定位
            bottom: 0,
          }}
        >
          <Footer onOpenDonate={() => setShowDonateDialog(true)} />
        </Box>

        <DonateDialog
          open={showDonateDialog}
          onClose={handleCloseDonateDialog}
          onDonate={handleDonate}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;
