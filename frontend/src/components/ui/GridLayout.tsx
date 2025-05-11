import React from 'react';
import { Grid, Box, useTheme, useMediaQuery } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled components
const GridContainer = styled(Grid)(({ theme }) => ({
  width: '100%',
  margin: 0,
  transition: theme.transitions.create(['margin', 'width'], {
    duration: theme.transitions.duration.standard,
  }),
}));

// Types for grid item sizing
type GridSizeType = boolean | 'auto' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
type GridSpacingType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

interface GridItemProps {
  children: React.ReactNode;
  xs?: GridSizeType;
  sm?: GridSizeType;
  md?: GridSizeType;
  lg?: GridSizeType;
  xl?: GridSizeType;
  height?: string | number;
  minHeight?: string | number;
  maxHeight?: string | number;
  className?: string;
}

interface GridLayoutProps {
  children: React.ReactNode;
  spacing?: GridSpacingType;
  columnSpacing?: GridSpacingType;
  rowSpacing?: GridSpacingType;
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  equalHeight?: boolean;
  container?: boolean;
  className?: string;
  sx?: any;
}

// GridItem component
export const GridItem: React.FC<GridItemProps> = ({
  children,
  xs = 12,
  sm,
  md,
  lg,
  xl,
  height,
  minHeight,
  maxHeight,
  className,
}) => {
  return (
    <Grid 
      item 
      xs={xs} 
      sm={sm} 
      md={md} 
      lg={lg} 
      xl={xl}
      className={className}
      sx={{ 
        height: height || 'auto',
        minHeight: minHeight || 'auto',
        maxHeight: maxHeight || 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </Grid>
  );
};

// Main GridLayout component
const GridLayout: React.FC<GridLayoutProps> = ({
  children,
  spacing = 3,
  columnSpacing,
  rowSpacing,
  alignItems = 'stretch',
  justifyContent = 'flex-start',
  equalHeight = false,
  container = true,
  className,
  sx,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Adjust spacing for mobile
  const effectiveSpacing = isMobile ? Math.min(spacing, 2) : spacing;
  const effectiveColumnSpacing = columnSpacing !== undefined 
    ? (isMobile ? Math.min(columnSpacing, 2) : columnSpacing) 
    : effectiveSpacing;
  const effectiveRowSpacing = rowSpacing !== undefined 
    ? (isMobile ? Math.min(rowSpacing, 2) : rowSpacing) 
    : effectiveSpacing;

  return container ? (
    <GridContainer 
      container 
      spacing={0}
      columnSpacing={effectiveColumnSpacing}
      rowSpacing={effectiveRowSpacing}
      alignItems={alignItems}
      justifyContent={justifyContent}
      className={className}
      sx={{
        ...sx,
        '& > .MuiGrid-item': {
          height: equalHeight ? '100%' : 'auto',
        },
      }}
    >
      {children}
    </GridContainer>
  ) : (
    <Box 
      sx={{ 
        width: '100%',
        ...sx,
      }}
      className={className}
    >
      {children}
    </Box>
  );
};

export default GridLayout;
