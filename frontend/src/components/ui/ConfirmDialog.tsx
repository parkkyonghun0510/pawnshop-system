import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Help as HelpIcon,
} from '@mui/icons-material';

type ConfirmType = 'delete' | 'warning' | 'info' | 'confirm';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: ConfirmType;
  loading?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  type = 'confirm',
  loading = false,
  maxWidth = 'xs',
}) => {
  const theme = useTheme();

  // Get icon and colors based on dialog type
  const getTypeConfig = () => {
    switch (type) {
      case 'delete':
        return {
          icon: <DeleteIcon fontSize="large" />,
          color: theme.palette.error.main,
          confirmColor: 'error',
        };
      case 'warning':
        return {
          icon: <WarningIcon fontSize="large" />,
          color: theme.palette.warning.main,
          confirmColor: 'warning',
        };
      case 'info':
        return {
          icon: <InfoIcon fontSize="large" />,
          color: theme.palette.info.main,
          confirmColor: 'info',
        };
      default:
        return {
          icon: <HelpIcon fontSize="large" />,
          color: theme.palette.primary.main,
          confirmColor: 'primary',
        };
    }
  };

  const { icon, color, confirmColor } = getTypeConfig();

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ color }}>{icon}</Box>
          <Typography variant="h6" component="span" fontWeight="bold">
            {title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {typeof message === 'string' ? (
          <Typography variant="body1">{message}</Typography>
        ) : (
          message
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onCancel}
          color="inherit"
          variant="outlined"
          disabled={loading}
        >
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          color={confirmColor as any}
          variant="contained"
          disabled={loading}
          startIcon={
            loading ? <CircularProgress size={20} color="inherit" /> : undefined
          }
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
