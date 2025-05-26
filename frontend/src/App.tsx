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
  Paper,
  Fade,
} from '@mui/material';
import { LocationOn, Restaurant, LocalCafe, Favorite, RestaurantMenu } from '@mui/icons-material';
import RestaurantCard from './components/RestaurantCard';
import { getRecommendations } from './services/api';
import type { Restaurant as RestaurantType } from './types';

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
  const [animateIn, setAnimateIn] = useState(false);

  // 在加載時添加動畫效果
  useEffect(() => {
    setAnimateIn(true);
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
        sx={{
          width: '100%',
          minHeight: '100vh',
          py: { xs: 4, md: 3 },
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Container
          maxWidth={restaurants.length > 0 ? "xl" : "lg"}
          sx={{
            width: '100%',
            height: '100%',
            px: { xs: 2, sm: 3, md: 4 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Fade in={animateIn} timeout={800}>
            <Paper
              elevation={2}
              sx={{
                borderRadius: 3,
                py: { xs: 4, md: restaurants.length > 0 ? 3 : 5 },
                px: { xs: 3, md: restaurants.length > 0 ? 3 : 4 },
                mb: { xs: 4, md: restaurants.length > 0 ? 4 : 4 },
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                width: '100%',
                maxWidth: restaurants.length > 0 ? '100%' : '800px',
                mx: 'auto',
                '&:hover': {
                  boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                },
              }}
            >
              <Box
                sx={{
                  mb: { xs: 3, md: restaurants.length > 0 ? 2 : 3 },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: restaurants.length > 0 ? 1 : 2,
                    '& svg': {
                      fontSize: restaurants.length > 0 ? '1.5rem' : '2rem',
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
                        md: restaurants.length > 0 ? '2.2rem' : '2.8rem'
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

              {!restaurants.length && (
                <Typography
                  variant="h6"
                  color="text.secondary"
                  mb={4}
                  sx={{
                    fontSize: {
                      xs: '1.05rem',
                      md: '1.1rem'
                    },
                    px: { xs: 1, md: 2 },
                    maxWidth: '600px',
                    mx: 'auto',
                    lineHeight: 1.5,
                  }}
                >
                  不知道要吃什麼？讓我們為你推薦附近的優質餐廳！
                </Typography>
              )}

              <Button
                variant="contained"
                size={restaurants.length > 0 ? "medium" : "large"}
                onClick={handleRecommend}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Restaurant />}
                sx={{
                  py: {
                    xs: 1.5,
                    md: restaurants.length > 0 ? 1.2 : 1.8
                  },
                  px: {
                    xs: 4,
                    md: restaurants.length > 0 ? 3 : 5
                  },
                  fontSize: {
                    xs: '1.05rem',
                    md: restaurants.length > 0 ? '0.95rem' : '1.1rem'
                  },
                  borderRadius: 3,
                  width: { xs: '100%', sm: 'auto' },
                  minWidth: {
                    xs: '100%',
                    sm: restaurants.length > 0 ? '180px' : '240px'
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
                <Box mt={2} display="flex" alignItems="center" justifyContent="center">
                  <LocationOn color="primary" fontSize="small" />
                  <Typography variant="body2" color="text.secondary" ml={0.5}>
                    已定位到您的位置
                  </Typography>
                </Box>
              )}
            </Paper>
          </Fade>

          {error && (
            <Fade in={!!error} timeout={500}>
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  borderRadius: 2,
                }}
              >
                {error}
              </Alert>
            </Fade>
          )}

          {restaurants.length > 0 && (
            <Fade in={restaurants.length > 0} timeout={800}>
              <Box>
                <Paper
                  sx={{
                    p: { xs: 3, md: 2 },
                    mb: { xs: 3, md: 3 },
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
                      fontSize: { xs: '1.25rem', md: '1.1rem' },
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
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, 1fr)',
                      md: 'repeat(3, 1fr)',
                    },
                    gap: { xs: 3, md: 3 },
                    justifyItems: 'center',
                    mx: 'auto',
                    width: '100%',
                  }}
                >
                  {restaurants.map((restaurant, index) => (
                    <Fade
                      key={restaurant.place_id || index}
                      in={true}
                      style={{ transitionDelay: `${index * 100}ms` }}
                      timeout={800}
                    >
                      <Box
                        sx={{
                          width: '100%',
                          maxWidth: { xs: '100%', sm: '320px', md: '100%' },
                          transition: 'transform 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                          }
                        }}
                      >
                        <RestaurantCard restaurant={restaurant} />
                      </Box>
                    </Fade>
                  ))}
                </Box>
              </Box>
            </Fade>
          )}

          {restaurants.length === 0 && !loading && !error && (
            <Fade in={restaurants.length === 0 && !loading && !error} timeout={800}>
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
                    filter: 'grayscale(100%)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      opacity: 1,
                      filter: 'grayscale(0%)',
                    }
                  }}
                />
              </Box>
            </Fade>
          )}
        </Container>

        {/* 頁腳 */}
        <Box
          component="footer"
          sx={{
            mt: 'auto',
            py: 3,
            textAlign: 'center',
            opacity: 0.7,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} What2Eat |
            <Link
              href="#"
              onClick={() => setShowDonateDialog(true)}
              color="primary"
              sx={{ ml: 1, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              支持開發者
            </Link>
          </Typography>
        </Box>
      </Box>

      {/* Ko-fi 捐贈對話框 */}
      <Dialog
        open={showDonateDialog}
        onClose={handleCloseDonateDialog}
        aria-labelledby="donate-dialog-title"
        aria-describedby="donate-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxWidth: 400,
            overflow: 'hidden',
          }
        }}
      >
        <Box sx={{
          background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c61 100%)',
          py: 1,
          color: 'white',
          textAlign: 'center'
        }}>
          <DialogTitle id="donate-dialog-title" sx={{ color: 'white', fontWeight: 600 }}>
            <Favorite sx={{ mr: 1, verticalAlign: 'middle' }} />
            {parseInt(localStorage.getItem('donateRefuseCount') || '0') > 0
              ? '我們很努力在做這個服務'
              : '喜歡 What2Eat 嗎？'}
          </DialogTitle>
        </Box>

        <DialogContent sx={{ pt: 3 }}>
          <Box
            component="img"
            src="/image.png"
            alt="SMK Logo"
            sx={{
              width: 80,
              height: 80,
              display: 'block',
              margin: '0 auto 20px',
              borderRadius: '50%',
              border: '3px solid #ff6b35',
              padding: 1,
              background: 'white',
            }}
          />
          <DialogContentText id="donate-dialog-description" sx={{ textAlign: 'center', mb: 2 }}>
            {parseInt(localStorage.getItem('donateRefuseCount') || '0') > 0
              ? (
                <>
                  開發與維護這個應用真的很辛苦<br />
                  確定不支持我一下嗎？<br />
                  您的小小支持是我們最大的動力！
                </>
              ) : (
                <>
                  如果這個應用幫到了你<br />
                  考慮請我喝杯咖啡支持開發嗎？
                </>
              )}
            <Box
              component="span"
              display="block"
              mt={2}
              sx={{
                p: 2,
                background: 'rgba(255, 107, 53, 0.1)',
                borderRadius: 2,
                color: 'primary.main',
                fontWeight: 500,
              }}
            >
              <LocalCafe sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              您的支持讓我們能夠持續改進<br />與開發更好的功能！
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', p: 3 }}>
          <Button
            onClick={handleCloseDonateDialog}
            color="inherit"
            variant="outlined"
            sx={{
              width: '45%',
              borderRadius: 2,
            }}
          >
            {parseInt(localStorage.getItem('donateRefuseCount') || '0') > 0 ? '下次再說' : '先不要'}
          </Button>
          <Button
            onClick={handleDonate}
            color="primary"
            variant="contained"
            sx={{
              width: '45%',
              borderRadius: 2,
              background: '#29abe0', // Ko-fi 藍色
              '&:hover': {
                background: '#0d8eca',
              },
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Box component="img" src="https://storage.ko-fi.com/cdn/cup-border.png" sx={{ height: 18, mr: 1 }} />
            支持我
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;
