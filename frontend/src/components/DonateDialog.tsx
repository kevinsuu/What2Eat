import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    Button,
    Box
} from '@mui/material';
import { Favorite, LocalCafe } from '@mui/icons-material';
import logo from '../../public/image.png';

type DonateDialogProps = {
    open: boolean;
    onClose: () => void;
    onDonate: () => void;
}

const DonateDialog = ({ open, onClose, onDonate }: DonateDialogProps) => {
    const refuseCount = parseInt(localStorage.getItem('donateRefuseCount') || '0');

    return (
        <Dialog
            open={open}
            onClose={onClose}
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
                    {refuseCount > 0
                        ? '我們很努力在做這個服務'
                        : '喜歡 What2Eat 嗎？'}
                </DialogTitle>
            </Box>

            <DialogContent sx={{ pt: 3 }}>
                <Box
                    component="img"
                    src={logo}
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
                    {refuseCount > 0
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
                    onClick={onClose}
                    color="inherit"
                    variant="outlined"
                    sx={{
                        width: '45%',
                        borderRadius: 2,
                    }}
                >
                    {refuseCount > 0 ? '下次再說' : '先不要'}
                </Button>
                <Button
                    onClick={onDonate}
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
    );
};

export default DonateDialog; 