import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, useMediaQuery, Theme } from '@mui/material';
import { styled } from '@mui/material/styles';

// Components
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import Breadcrumbs from './Breadcrumbs';

// Constants
const DRAWER_WIDTH = 280;
const COLLAPSED_DRAWER_WIDTH = 72;

// Styled components
// Main content area with dynamic margin based on sidebar state
const Main = styled('main')<{
  open: boolean;
  collapsed: boolean;
}>(({ theme, open, collapsed }) => ({
  flexGrow: 1,
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(3),
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.shorter,
  }),
  marginLeft: open
    ? (collapsed ? `${COLLAPSED_DRAWER_WIDTH}px` : `${DRAWER_WIDTH}px`)
    : 0,
  width: open
    ? (collapsed ? `calc(100% - ${COLLAPSED_DRAWER_WIDTH}px)` : `calc(100% - ${DRAWER_WIDTH}px)`)
    : '100%',
  [theme.breakpoints.down('md')]: {
    marginLeft: 0,
    padding: theme.spacing(2),
    width: '100%',
  },
  minHeight: 'calc(100vh - 64px - 48px)', // Subtract header and footer height
}));

const MainLayout = () => {
  const location = useLocation();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));

  // State for drawer
  const [open, setOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  // Close drawer on mobile when location changes
  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, [location, isMobile]);

  // Toggle drawer
  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  // Toggle collapse
  const handleDrawerCollapse = () => {
    setCollapsed(!collapsed);
    setOpen(true); // Ensure drawer is open when collapsing
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header
        open={open}
        collapsed={collapsed}
        drawerWidth={collapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH}
        onDrawerToggle={handleDrawerToggle}
      />

      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        <Sidebar
          open={open}
          collapsed={collapsed}
          drawerWidth={DRAWER_WIDTH}
          collapsedWidth={COLLAPSED_DRAWER_WIDTH}
          onDrawerToggle={handleDrawerToggle}
          onDrawerCollapse={handleDrawerCollapse}
        />

        <Main open={open} collapsed={collapsed}>
          <Breadcrumbs />
          <Box sx={{ pt: 2 }}>
            <Outlet />
          </Box>
        </Main>
      </Box>

      <Footer
        open={open}
        collapsed={collapsed}
        drawerWidth={collapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH}
      />
    </Box>
  );
};

export default MainLayout;
