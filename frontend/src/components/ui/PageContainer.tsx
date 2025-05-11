import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Breadcrumbs,
  Link,
  useTheme,
  Fade,
  Zoom,
  IconButton,
  Tooltip,
  useMediaQuery,
  Skeleton,
  LinearProgress
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styled components
const PageWrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  marginBottom: theme.spacing(4),
  animation: 'fadeIn 0.5s ease-in-out',
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

const PageHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  transition: theme.transitions.create(['margin', 'opacity'], {
    duration: theme.transitions.duration.standard,
  }),
}));

const ContentPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  transition: theme.transitions.create(['box-shadow', 'background-color'], {
    duration: theme.transitions.duration.standard,
  }),
  overflow: 'hidden',
}));

interface PageContainerProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{
    label: string;
    path?: string;
    icon?: React.ReactNode;
  }>;
  actions?: React.ReactNode;
  maxWidth?: string | number;
  children: React.ReactNode;
  elevation?: number;
  noPadding?: boolean;
  loading?: boolean;
  refreshable?: boolean;
  onRefresh?: () => void;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  headerDivider?: boolean;
  variant?: 'default' | 'transparent' | 'outlined';
  className?: string;
  contentClassName?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  maxWidth = '100%',
  children,
  elevation = 1,
  noPadding = false,
  loading = false,
  refreshable = false,
  onRefresh,
  collapsible = false,
  defaultCollapsed = false,
  headerDivider = false,
  variant = 'default',
  className,
  contentClassName,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [mounted, setMounted] = useState(false);

  // Animation effect on mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  // Determine content paper props based on variant
  const getContentPaperProps = () => {
    switch (variant) {
      case 'transparent':
        return {
          elevation: 0,
          sx: {
            bgcolor: 'transparent',
            p: noPadding ? 0 : 2,
          }
        };
      case 'outlined':
        return {
          variant: 'outlined' as const,
          sx: {
            p: noPadding ? 0 : 3,
            borderColor: theme.palette.divider,
          }
        };
      default:
        return {
          elevation,
          sx: {
            p: noPadding ? 0 : 3,
            backgroundColor: theme.palette.background.paper,
          }
        };
    }
  };

  return (
    <Fade in={mounted} timeout={300}>
      <PageWrapper className={className}>
        {/* Page Header */}
        <PageHeader>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumbs
              separator={<NavigateNextIcon fontSize="small" />}
              aria-label="breadcrumb"
              sx={{ mb: 1 }}
            >
              {breadcrumbs.map((crumb, index) => {
                // For home breadcrumb
                if (index === 0 && crumb.icon) {
                  return (
                    <Link
                      key={`breadcrumb-${index}`}
                      component={RouterLink}
                      to={crumb.path || '/'}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: 'text.primary',
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {crumb.icon}
                      {crumb.label}
                    </Link>
                  );
                }

                // For the last breadcrumb (current page)
                if (index === breadcrumbs.length - 1) {
                  return (
                    <Typography
                      key={`breadcrumb-${index}`}
                      color="text.primary"
                      sx={{ fontWeight: 'medium' }}
                    >
                      {crumb.label}
                    </Typography>
                  );
                }

                // For intermediate breadcrumbs
                return (
                  <Link
                    key={`breadcrumb-${index}`}
                    component={RouterLink}
                    to={crumb.path || '#'}
                    sx={{
                      color: 'text.primary',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {crumb.label}
                  </Link>
                );
              })}
            </Breadcrumbs>
          )}

          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
            mb: headerDivider ? 2 : 1,
            gap: isMobile ? 2 : 0,
          }}>
            <Box>
              {loading ? (
                <>
                  <Skeleton variant="text" width={300} height={40} />
                  {subtitle && <Skeleton variant="text" width={200} height={24} sx={{ mt: 0.5 }} />}
                </>
              ) : (
                <>
                  <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' },
                    }}
                  >
                    {title}
                  </Typography>
                  {subtitle && (
                    <Typography
                      variant="subtitle1"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {subtitle}
                    </Typography>
                  )}
                </>
              )}
            </Box>

            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isMobile ? 'flex-end' : 'flex-start',
              width: isMobile ? '100%' : 'auto',
              gap: 1,
            }}>
              {refreshable && (
                <Tooltip title="Refresh">
                  <IconButton
                    onClick={handleRefresh}
                    color="primary"
                    disabled={loading}
                    size="small"
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              )}

              {collapsible && (
                <Tooltip title={collapsed ? "Expand" : "Collapse"}>
                  <IconButton
                    onClick={toggleCollapse}
                    color="primary"
                    size="small"
                  >
                    {collapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                  </IconButton>
                </Tooltip>
              )}

              {actions && (
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  ml: 1,
                }}>
                  {actions}
                </Box>
              )}
            </Box>
          </Box>

          {headerDivider && <Divider />}
        </PageHeader>

        {/* Page Content */}
        <Zoom in={!collapsed} timeout={300} unmountOnExit={false} style={{ transitionDelay: collapsed ? '0ms' : '100ms' }}>
          <ContentPaper
            {...getContentPaperProps()}
            sx={{
              maxWidth,
              borderRadius: 2,
              position: 'relative',
              ...getContentPaperProps().sx,
            }}
            className={contentClassName}
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
            <Box sx={{
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.3s ease',
            }}>
              {children}
            </Box>
          </ContentPaper>
        </Zoom>
      </PageWrapper>
    </Fade>
  );
};

export default PageContainer;
