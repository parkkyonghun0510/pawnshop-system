import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  Divider,
  useTheme,
  LinearProgress,
  DialogProps,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface ModalDialogProps extends Omit<DialogProps, 'title'> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  onClose: () => void;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  loading?: boolean;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  disablePrimaryAction?: boolean;
  disableSecondaryAction?: boolean;
  hideActions?: boolean;
  fullWidth?: boolean;
  contentSx?: React.CSSProperties;
}

const ModalDialog: React.FC<ModalDialogProps> = ({
  title,
  subtitle,
  children,
  actions,
  onClose,
  maxWidth = 'sm',
  loading = false,
  primaryActionLabel = 'Confirm',
  secondaryActionLabel = 'Cancel',
  onPrimaryAction,
  onSecondaryAction,
  disablePrimaryAction = false,
  disableSecondaryAction = false,
  hideActions = false,
  fullWidth = true,
  contentSx,
  ...rest
}) => {
  const theme = useTheme();

  return (
    <Dialog
      onClose={loading ? undefined : onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      {...rest}
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: 'hidden',
        },
      }}
    >
      {loading && (
        <LinearProgress
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            zIndex: 1,
          }}
        />
      )}

      <DialogTitle sx={{ p: 0 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            pb: subtitle ? 1 : 2,
          }}
        >
          <Box>
            <Typography variant="h6" component="div" fontWeight="bold">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <IconButton
            aria-label="close"
            onClick={onClose}
            disabled={loading}
            sx={{
              color: theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
      </DialogTitle>

      <DialogContent
        sx={{
          px: 3,
          py: 2,
          opacity: loading ? 0.7 : 1,
          pointerEvents: loading ? 'none' : 'auto',
          ...contentSx,
        }}
      >
        {children}
      </DialogContent>

      {!hideActions && (
        <>
          <Divider />
          <DialogActions sx={{ px: 3, py: 2 }}>
            {actions ? (
              actions
            ) : (
              <>
                {onSecondaryAction && (
                  <Button
                    onClick={onSecondaryAction}
                    color="inherit"
                    variant="outlined"
                    disabled={loading || disableSecondaryAction}
                  >
                    {secondaryActionLabel}
                  </Button>
                )}
                {onPrimaryAction && (
                  <Button
                    onClick={onPrimaryAction}
                    color="primary"
                    variant="contained"
                    disabled={loading || disablePrimaryAction}
                    autoFocus
                  >
                    {primaryActionLabel}
                  </Button>
                )}
              </>
            )}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default ModalDialog;
