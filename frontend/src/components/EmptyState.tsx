import { Box, Typography, Fade } from '@mui/material';
import logo from '../../public/image.png';

const EmptyState = () => {
    return (
        <Fade in={true} timeout={800}>
            <Box textAlign="center" py={{ xs: 4, md: 2 }}>
                <Typography
                    variant="h6"
                    color="text.secondary"
                    mb={{ xs: 2, md: 1.5 }}
                    sx={{
                        fontSize: { xs: '1rem', md: '0.95rem' }
                    }}
                >
                    點擊上方按鈕開始尋找美食！
                </Typography>
                <Box
                    component="img"
                    src={logo}
                    alt="SMK Logo"
                    sx={{
                        height: { xs: 40, md: 35 },
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
    );
};

export default EmptyState; 