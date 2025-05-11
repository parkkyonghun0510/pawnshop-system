import React, { forwardRef } from 'react';
import {
  Snackbar,
  Alert as MuiAlert,
  AlertProps,
  Typography,
  Box,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

// Custom Alert component
const Alert = forwardRef<HTMLDivElement, AlertProps>((props, ref) => {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

Alert.displayName = 'Alert';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationProps {
  open: boolean;
  type: NotificationType;
  message: string;
  description?: string;
  onClose: () => void;
  autoHideDuration?: number;
  position?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
}

const Notification: React.FC<NotificationProps> = ({
  open,
  type,
  message,
  description,
  onClose,
  autoHideDuration = 5000,
  position = { vertical: 'bottom', horizontal: 'right' },
}) => {
  const theme = useTheme();

  // Get icon based on notification type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <SuccessIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'info':
        return <InfoIcon />;
      default:
        return <InfoIcon />;
    }
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{
        vertical: position.vertical,
        horizontal: position.horizontal,
      }}
    >
      <Alert
        severity={type}
        icon={getIcon()}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={onClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        sx={{
          width: '100%',
          minWidth: '300px',
          boxShadow: theme.shadows[6],
        }}
      >
        <Box>
          <Typography variant="subtitle2" fontWeight="bold">
            {message}
          </Typography>
          {description && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          )}
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default Notification;
