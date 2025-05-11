import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Button,
  Grid,
  useTheme,
  LinearProgress,
  Alert,
  AlertTitle,
  Fade,
  Collapse,
  IconButton,
  Tooltip,
  useMediaQuery,
  Skeleton
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styled components
const FormPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  transition: theme.transitions.create(['box-shadow', 'opacity'], {
    duration: theme.transitions.duration.standard,
  }),
  overflow: 'hidden',
  animation: 'fadeIn 0.4s ease-in-out',
  '@keyframes fadeIn': {
    '0%': {
      opacity: 0,
      transform: 'translateY(10px)',
    },
    '100%': {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
}));

const FormHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  transition: theme.transitions.create('padding', {
    duration: theme.transitions.duration.standard,
  }),
}));

const FormContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  transition: theme.transitions.create(['opacity', 'padding'], {
    duration: theme.transitions.duration.standard,
  }),
}));

interface FormContainerProps {
  title: string;
  subtitle?: string;
  description?: string;
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  error?: string | null;
  success?: string | null;
  warning?: string | null;
  info?: string | null;
  maxWidth?: string | number;
  actions?: React.ReactNode;
  disableSubmit?: boolean;
  hideActions?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  helpText?: string;
  variant?: 'default' | 'outlined' | 'transparent';
  elevation?: number;
  className?: string;
  contentClassName?: string;
}

const FormContainer: React.FC<FormContainerProps> = ({
  title,
  subtitle,
  description,
  children,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  loading = false,
  error = null,
  success = null,
  warning = null,
  info = null,
  maxWidth = '800px',
  actions,
  disableSubmit = false,
  hideActions = false,
  collapsible = false,
  defaultCollapsed = false,
  helpText,
  variant = 'default',
  elevation = 1,
  className,
  contentClassName,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [showHelp, setShowHelp] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Animation effect on mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const toggleHelp = () => {
    setShowHelp(!showHelp);
  };

  // Determine paper props based on variant
  const getPaperProps = () => {
    switch (variant) {
      case 'outlined':
        return {
          variant: 'outlined' as const,
          sx: { borderColor: theme.palette.divider }
        };
      case 'transparent':
        return {
          elevation: 0,
          sx: { bgcolor: 'transparent' }
        };
      default:
        return {
          elevation,
        };
    }
  };

  return (
    <Fade in={mounted} timeout={300}>
      <FormPaper
        {...getPaperProps()}
        sx={{
          maxWidth,
          width: '100%',
          mx: 'auto',
          position: 'relative',
          ...getPaperProps().sx,
        }}
        className={className}
      >
        {loading && (
          <LinearProgress
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
            }}
          />
        )}

        <FormHeader>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}>
            <Box sx={{ flex: 1 }}>
              {loading ? (
                <>
                  <Skeleton variant="text" width={200} height={32} />
                  {subtitle && <Skeleton variant="text" width={300} height={24} sx={{ mt: 1 }} />}
                </>
              ) : (
                <>
                  <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    }}
                  >
                    {title}
                  </Typography>

                  {subtitle && (
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      {subtitle}
                    </Typography>
                  )}
                </>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
              {helpText && (
                <Tooltip title={showHelp ? "Hide help" : "Show help"}>
                  <IconButton
                    onClick={toggleHelp}
                    color="primary"
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    <HelpIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {collapsible && (
                <Tooltip title={collapsed ? "Expand form" : "Collapse form"}>
                  <IconButton
                    onClick={toggleCollapse}
                    color="primary"
                    size="small"
                  >
                    {collapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          {/* Help text section */}
          {helpText && (
            <Collapse in={showHelp}>
              <Alert
                severity="info"
                icon={<InfoIcon />}
                sx={{
                  mt: 2,
                  borderRadius: 1,
                }}
              >
                <AlertTitle>Help</AlertTitle>
                {helpText}
              </Alert>
            </Collapse>
          )}

          {/* Description text */}
          {description && !loading && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1.5 }}
            >
              {description}
            </Typography>
          )}
        </FormHeader>

        <Divider />

        <Collapse in={!collapsed} timeout="auto">
          <FormContent
            component="form"
            onSubmit={handleSubmit}
            sx={{
              opacity: loading ? 0.7 : 1,
              pointerEvents: loading ? 'none' : 'auto',
            }}
            className={contentClassName}
          >
            {/* Status messages */}
            {(error || success || warning || info) && (
              <Box sx={{ mb: 3 }}>
                {error && (
                  <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                  >
                    <AlertTitle>Error</AlertTitle>
                    {error}
                  </Alert>
                )}

                {warning && (
                  <Alert
                    severity="warning"
                    sx={{ mb: 2 }}
                  >
                    <AlertTitle>Warning</AlertTitle>
                    {warning}
                  </Alert>
                )}

                {success && (
                  <Alert
                    severity="success"
                    sx={{ mb: 2 }}
                  >
                    <AlertTitle>Success</AlertTitle>
                    {success}
                  </Alert>
                )}

                {info && (
                  <Alert
                    severity="info"
                    sx={{ mb: 2 }}
                  >
                    <AlertTitle>Information</AlertTitle>
                    {info}
                  </Alert>
                )}
              </Box>
            )}

            {/* Form content */}
            {children}

            {/* Form actions */}
            {!hideActions && (
              <>
                <Divider sx={{ my: 3 }} />

                <Grid
                  container
                  spacing={2}
                  justifyContent={isMobile ? 'center' : 'flex-end'}
                  direction={isMobile ? 'column-reverse' : 'row'}
                >
                  {onCancel && (
                    <Grid item xs={isMobile ? 12 : 'auto'}>
                      <Button
                        variant="outlined"
                        color="inherit"
                        onClick={onCancel}
                        startIcon={<CancelIcon />}
                        disabled={loading}
                        fullWidth={isMobile}
                      >
                        {cancelLabel}
                      </Button>
                    </Grid>
                  )}

                  {actions ? (
                    <Grid item xs={isMobile ? 12 : 'auto'}>
                      {actions}
                    </Grid>
                  ) : onSubmit ? (
                    <Grid item xs={isMobile ? 12 : 'auto'}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        disabled={loading || disableSubmit}
                        fullWidth={isMobile}
                      >
                        {submitLabel}
                      </Button>
                    </Grid>
                  ) : null}
                </Grid>
              </>
            )}
          </FormContent>
        </Collapse>
      </FormPaper>
    </Fade>
  );
};

export default FormContainer;
