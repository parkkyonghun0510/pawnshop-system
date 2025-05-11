import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  CardHeader, 
  CardActions, 
  Typography, 
  Divider, 
  IconButton, 
  Tooltip,
  Collapse,
  useTheme,
  alpha
} from '@mui/material';
import { 
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styled components
const ExpandButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'expanded',
})<{ expanded: boolean }>(({ theme, expanded }) => ({
  transform: !expanded ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

interface ContentCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  expandable?: boolean;
  defaultExpanded?: boolean;
  refreshable?: boolean;
  onRefresh?: () => void;
  headerBgColor?: string;
  loading?: boolean;
  minHeight?: number | string;
  maxHeight?: number | string;
  noPadding?: boolean;
  variant?: 'default' | 'outlined' | 'elevation';
  className?: string;
}

const ContentCard: React.FC<ContentCardProps> = ({
  title,
  subtitle,
  icon,
  actions,
  children,
  footer,
  expandable = false,
  defaultExpanded = true,
  refreshable = false,
  onRefresh,
  headerBgColor,
  loading = false,
  minHeight,
  maxHeight,
  noPadding = false,
  variant = 'default',
  className,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  // Determine card elevation and styles based on variant
  const getCardProps = () => {
    switch (variant) {
      case 'outlined':
        return {
          variant: 'outlined' as const,
          sx: { borderColor: theme.palette.divider }
        };
      case 'elevation':
        return {
          elevation: 2,
        };
      default:
        return {
          elevation: 1,
        };
    }
  };

  return (
    <Card 
      {...getCardProps()}
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        opacity: loading ? 0.8 : 1,
        transition: 'all 0.3s ease',
        minHeight,
        maxHeight,
        position: 'relative',
      }}
      className={className}
    >
      {/* Card Header */}
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {icon && (
              <Box 
                sx={{ 
                  mr: 1.5, 
                  display: 'flex', 
                  alignItems: 'center',
                  color: headerBgColor || theme.palette.primary.main
                }}
              >
                {icon}
              </Box>
            )}
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
          </Box>
        }
        subheader={subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
        action={
          <Box sx={{ display: 'flex' }}>
            {refreshable && (
              <Tooltip title="Refresh">
                <IconButton onClick={handleRefresh} size="small">
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {actions && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {actions}
              </Box>
            )}
            {expandable && (
              <Tooltip title={expanded ? "Collapse" : "Expand"}>
                <ExpandButton
                  expanded={expanded}
                  onClick={handleExpandClick}
                  aria-expanded={expanded}
                  aria-label="show more"
                  size="small"
                >
                  <ExpandMoreIcon fontSize="small" />
                </ExpandButton>
              </Tooltip>
            )}
          </Box>
        }
        sx={{
          backgroundColor: headerBgColor ? alpha(headerBgColor, 0.1) : 'transparent',
          borderBottom: `1px solid ${theme.palette.divider}`,
          py: 1.5,
          '& .MuiCardHeader-action': {
            margin: 0,
            alignSelf: 'center',
          },
        }}
      />

      {/* Card Content */}
      <Collapse in={!expandable || expanded} timeout="auto" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ 
          flexGrow: 1, 
          p: noPadding ? 0 : 2,
          '&:last-child': { pb: noPadding ? 0 : 2 },
          overflow: 'auto'
        }}>
          {children}
        </CardContent>
      </Collapse>

      {/* Card Footer */}
      {footer && (
        <>
          <Divider />
          <CardActions sx={{ p: 2, justifyContent: 'flex-end' }}>
            {footer}
          </CardActions>
        </>
      )}
    </Card>
  );
};

export default ContentCard;
