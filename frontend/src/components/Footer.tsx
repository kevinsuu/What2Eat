import { Box, Typography, Link } from '@mui/material';

type FooterProps = {
    onOpenDonate: () => void;
};

const Footer = ({ onOpenDonate }: FooterProps) => {
    return (
        <Box
            component="footer"
            id="footer"
            sx={{
                py: { xs: 1.5, md: 1 },
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
                gap: 0.5
            }}
        >
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 500, fontSize: '0.85rem' }}
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

        </Box>
    );
};

export default Footer; 