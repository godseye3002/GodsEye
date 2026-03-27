"use client";

import React from 'react';
import { 
  Modal, 
  ModalDialog, 
  Typography, 
  Button, 
  Box, 
  IconButton, 
  Stack,
  styled 
} from '@mui/joy';
import { useProductStore } from '@/app/optimize/store';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import ContactSupportRoundedIcon from '@mui/icons-material/ContactSupportRounded';

const ModalBox = styled(ModalDialog)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(16, 21, 28, 0.98), rgba(9, 12, 20, 0.96))',
  borderRadius: '24px',
  border: '1px solid rgba(46, 212, 122, 0.22)',
  boxShadow: '0 50px 120px rgba(0, 0, 0, 0.65)',
  backdropFilter: 'blur(14px)',
  padding: '32px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    minWidth: 400,
  },
  maxWidth: 480,
}));

const GlowBackground = styled(Box)({
  position: 'absolute',
  top: '-50%',
  left: '-50%',
  width: '200%',
  height: '200%',
  background: 'radial-gradient(circle at center, rgba(46, 212, 122, 0.08) 0%, transparent 60%)',
  pointerEvents: 'none',
  zIndex: 0,
});

export default function SubscriptionAlertModal() {
  const { subscriptionAlert, setSubscriptionAlert } = useProductStore();

  if (!subscriptionAlert) return null;

  const handleClose = () => {
    setSubscriptionAlert(null);
  };

  const getAlertConfig = (reason: string) => {
    switch (reason) {
      case 'trial_expired':
        return {
          icon: <HourglassEmptyRoundedIcon sx={{ fontSize: 64, color: '#f5b041' }} />,
          title: 'Trial Expired',
          buttonText: 'Contact Provider',
          action: () => window.open('mailto:godseye3002@gmail.com'),
        };
      case 'account_inactive':
        return {
          icon: <ContactSupportRoundedIcon sx={{ fontSize: 64, color: '#e74c3c' }} />,
          title: 'Account Inactive',
          buttonText: 'Contact Provider',
          action: () => window.open('mailto:godseye3002@gmail.com'),
        };
      case 'product_limit_reached':
        return {
          icon: <RocketLaunchRoundedIcon sx={{ fontSize: 64, color: '#3498db' }} />,
          title: 'Product Limit Reached',
          buttonText: 'Contact Provider',
          action: () => window.open('mailto:godseye3002@gmail.com'),
        };
      case 'interaction_limit_reached':
      case 'no_credits':
        return {
          icon: <AutoAwesomeRoundedIcon sx={{ fontSize: 64, color: '#9b59b6' }} />,
          title: 'Usage Limit Reached',
          buttonText: 'Contact Provider',
          action: () => window.open('mailto:godseye3002@gmail.com'),
        };
      default:
        return {
          icon: <ErrorOutlineRoundedIcon sx={{ fontSize: 64, color: '#F35B64' }} />,
          title: 'Access Restricted',
          buttonText: 'Dismiss',
          action: handleClose,
        };
    }
  };

  const config = getAlertConfig(subscriptionAlert.reason);

  return (
    <Modal
      open={subscriptionAlert.isOpen}
      onClose={handleClose}
      sx={{
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(6, 8, 12, 0.85)',
      }}
    >
      <ModalBox>
        <GlowBackground />
        
        <IconButton
          onClick={handleClose}
          variant="plain"
          color="neutral"
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            color: 'rgba(255, 255, 255, 0.5)',
            zIndex: 2,
            '&:hover': {
              color: '#fff',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
            '--IconButton-size': '32px',
          }}
        >
          <CloseRoundedIcon />
        </IconButton>

        <Box sx={{ zIndex: 1, mb: 3 }}>
          {config.icon}
        </Box>

        <Typography
          level="h4"
          sx={{
            color: '#fff',
            fontWeight: 700,
            mb: 2,
            zIndex: 1,
            letterSpacing: '0.02em',
          }}
        >
          {config.title}
        </Typography>

        <Typography
          sx={{
            color: 'rgba(162, 167, 180, 0.9)',
            lineHeight: 1.6,
            mb: 4,
            zIndex: 1,
            fontSize: '1rem',
          }}
        >
          {subscriptionAlert.message}
        </Typography>

        <Button
          onClick={config.action}
          fullWidth
          sx={{
            zIndex: 1,
            background: 'linear-gradient(135deg, #2ED47A, #24b566)',
            color: '#000',
            fontWeight: 700,
            py: 1.5,
            borderRadius: '12px',
            textTransform: 'none',
            fontSize: '1.05rem',
            boxShadow: '0 8px 16px rgba(46, 212, 122, 0.3)',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: 'linear-gradient(135deg, #32e886, #28cc72)',
              boxShadow: '0 12px 24px rgba(46, 212, 122, 0.4)',
              transform: 'translateY(-2px)',
            },
          }}
        >
          {config.buttonText}
        </Button>
      </ModalBox>
    </Modal>
  );
}

