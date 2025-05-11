import React from 'react';
import { 
  Box, 
  Typography, 
  Divider, 
  IconButton, 
  Collapse, 
  useTheme,
  Paper
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styled components
const SectionContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'noDivider' && prop !== 'noMargin',
})<{ noDivider?: boolean; noMargin?: boolean }>(({ theme, noDivider, noMargin }) => ({
  marginBottom: noMargin ? 0 : theme.spacing(4),
  paddingBottom: noDivider ? 0 : theme.spacing(2),
  borderBottom: noDivider ? 'none' : `1px solid ${theme.palette.divider}`,
  '&:last-child': {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottom: 'none',
  },
  transition: theme.transitions.create(['margin', 'padding'], {
    duration: theme.transitions.duration.standard,
  }),
}));

interface ContentSectionProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  noDivider?: boolean;
  noMargin?: boolean;
  variant?: 'default' | 'paper';
  elevation?: number;
  id?: string;
  className?: string;
}

const ContentSection: React.FC<ContentSectionProps> = ({
  title,
  subtitle,
  icon,
  actions,
  children,
  collapsible = false,
  defaultExpanded = true,
  noDivider = false,
  noMargin = false,
  variant = 'default',
  elevation = 0,
  id,
  className,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  const content = (
    <>
      {(title || actions) && (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: subtitle ? 0.5 : 2,
          }}
        >
          {title && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {icon && (
                <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center' }}>
                  {icon}
                </Box>
              )}
              <Typography 
                variant="h5" 
                component="h2" 
                sx={{ 
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                }}
              >
                {title}
              </Typography>
              {collapsible && (
                <IconButton 
                  onClick={handleToggleExpand} 
                  size="small" 
                  sx={{ ml: 1 }}
                  aria-expanded={expanded}
                  aria-label={expanded ? "collapse section" : "expand section"}
                >
                  {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              )}
            </Box>
          )}
          {actions && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {actions}
            </Box>
          )}
        </Box>
      )}
      
      {subtitle && (
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ mb: 2 }}
        >
          {subtitle}
        </Typography>
      )}
      
      <Collapse in={!collapsible || expanded} timeout="auto">
        <Box sx={{ pt: (title || subtitle) ? 1 : 0 }}>
          {children}
        </Box>
      </Collapse>
    </>
  );

  return variant === 'paper' ? (
    <Paper 
      elevation={elevation} 
      sx={{ 
        p: 3, 
        borderRadius: 2,
        mb: noMargin ? 0 : 3,
      }}
      id={id}
      className={className}
    >
      {content}
    </Paper>
  ) : (
    <SectionContainer 
      noDivider={noDivider} 
      noMargin={noMargin}
      id={id}
      className={className}
    >
      {content}
    </SectionContainer>
  );
};

export default ContentSection;
