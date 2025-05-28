import { Box, Typography, Link } from '@mui/material';

type FooterProps = {
    onOpenDonate: () => void;
    pacificTime?: string;  // 可選的太平洋時間屬性
};

const Footer = ({ onOpenDonate, pacificTime }: FooterProps) => {
    return (
        <Box
            component="footer"
            id="footer"
            sx={{
                py: { xs: 3, md: 2 },
                px: 2,
                textAlign: 'center',
                opacity: 0.9,
                width: '100%',
                background: 'rgba(255, 255, 255, 0.2)',
                borderTop: '1px solid rgba(0,0,0,0.05)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1
            }}
        >
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 500 }}
            >
                © {new Date().getFullYear()} What2Eat |
                <Link
                    href="#"
                    onClick={onOpenDonate}
                    color="primary"
                    sx={{ ml: 1, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                    支持開發者
                </Link>
            </Typography>

            {pacificTime && (
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                        fontWeight: 400,
                        fontSize: '0.7rem',
                        opacity: 0.7,
                        fontFamily: 'monospace'
                    }}
                >
                    {pacificTime} (API重置時間參考)
                </Typography>
            )}
        </Box>
    );
};

export default Footer; 