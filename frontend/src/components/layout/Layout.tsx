import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
// Split icon imports for better code splitting
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StoreIcon from '@mui/icons-material/Store';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import InventoryIcon from '@mui/icons-material/Inventory';
import ReceiptIcon from '@mui/icons-material/Receipt';
import TransactionsIcon from '@mui/icons-material/ReceiptLong';
import ReportsIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { styled } from '@mui/material/styles';

// Constants
const DRAWER_WIDTH = 240;
const COLLAPSED_DRAWER_WIDTH = 72;

// Styled components for better performance
const StyledAppBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open'
})<{ open?: boolean }>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: DRAWER_WIDTH,
    width: `calc(100% - ${DRAWER_WIDTH}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== 'open'
})<{ open?: boolean }>(({ theme, open }) => ({
  width: open ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
  '& .MuiDrawer-paper': {
    width: open ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
    boxSizing: 'border-box',
    borderRight: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    boxShadow: 'none',
    '&:hover': {
      boxShadow: open ? 'none' : theme.shadows[3],
    },
  },
}));

const MainContent = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'open'
})<{ open?: boolean }>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  marginTop: theme.spacing(8),
  marginLeft: open ? 0 : theme.spacing(2),
  backgroundColor: theme.palette.background.default,
  height: '100%',
  overflow: 'auto',
  transition: theme.transitions.create(['margin', 'padding'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    marginLeft: 0,
  },
}));

// Memoized navigation item component to prevent unnecessary re-renders
const NavItem = React.memo(({
  item,
  open,
  onNavigate,
  active
}: {
  item: { text: string; icon: React.ReactNode; path: string };
  open: boolean;
  onNavigate: (path: string) => void;
  active: boolean;
}) => {
  const theme = useTheme();

  return (
    <ListItem disablePadding sx={{ display: 'block', my: 0.5 }}>
      <Tooltip title={!open ? item.text : ''} placement="right" arrow>
        <ListItemButton
          sx={{
            minHeight: 44,
            justifyContent: open ? 'initial' : 'center',
            px: open ? 2 : 1.5,
            py: 1,
            mx: open ? 1 : 0.5,
            borderRadius: 1,
            backgroundColor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
            '&:hover': {
              backgroundColor: active
                ? alpha(theme.palette.primary.main, 0.2)
                : alpha(theme.palette.primary.main, 0.05),
            },
            borderLeft: active ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
          }}
          onClick={() => onNavigate(item.path)}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: open ? 2 : 'auto',
              justifyContent: 'center',
              color: active ? theme.palette.primary.main : theme.palette.text.primary,
              fontSize: '1.25rem',
            }}
          >
            {item.icon}
          </ListItemIcon>
          <ListItemText
            primary={item.text}
            sx={{
              opacity: open ? 1 : 0,
              '& .MuiTypography-root': {
                fontWeight: active ? 600 : 400,
                fontSize: '0.9rem',
              }
            }}
          />
        </ListItemButton>
      </Tooltip>
    </ListItem>
  );
});

const Layout = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State
  const [open, setOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Navigation items - memoized to prevent unnecessary re-renders
  const navItems = useMemo(() => [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Branches', icon: <StoreIcon />, path: '/branches' },
    { text: 'Employees', icon: <PeopleIcon />, path: '/employees' },
    { text: 'Customers', icon: <PersonIcon />, path: '/customers' },
    { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
    { text: 'Loan Applications', icon: <TransactionsIcon />, path: '/loan-applications' },
    { text: 'Loans', icon: <ReceiptIcon />, path: '/loans' },
    { text: 'Transactions', icon: <TransactionsIcon />, path: '/transactions' },
    { text: 'Reports', icon: <ReportsIcon />, path: '/reports' },
  ], []);

  // Check if a path is active
  const isActive = useCallback((path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  }, [location.pathname]);

  // Memoized navigation handler
  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  // Close drawer on mobile when location changes
  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [location, isMobile]);

  // Toggle drawer - memoized to prevent unnecessary re-renders
  const toggleDrawer = useCallback(() => {
    setOpen((prevOpen) => !prevOpen);
  }, []);

  // Handle user menu open - memoized
  const handleMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  // Handle user menu close - memoized
  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  // Handle profile click - memoized
  const handleProfile = useCallback(() => {
    handleClose();
    navigate('/profile');
  }, [handleClose, navigate]);

  // Handle settings click - memoized
  const handleSettings = useCallback(() => {
    handleClose();
    navigate('/settings');
  }, [handleClose, navigate]);

  // Handle logout - memoized
  const handleLogout = useCallback(() => {
    handleClose();
    logout();
    navigate('/login');
  }, [handleClose, logout, navigate]);

  // Performance monitoring
  useEffect(() => {
    // Record render time
    const startTime = performance.now();

    return () => {
      // Log render duration on unmount
      const endTime = performance.now();
      console.debug(`Layout render time: ${endTime - startTime}ms`);
    };
  }, []);

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <StyledAppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={toggleDrawer}
            edge="start"
            sx={{
              marginRight: 5,
              ...(open && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            LC Management System
          </Typography>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton color="inherit">
              <NotificationsIcon />
            </IconButton>
          </Tooltip>

          {/* User Menu */}
          <div>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.dark' }}>
                {user?.fullName?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleProfile}>
                <ListItemIcon>
                  <AccountCircleIcon fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={handleSettings}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </StyledAppBar>

      {/* Side Drawer */}
      <StyledDrawer variant="permanent" open={open}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: open ? 'space-between' : 'center',
            padding: theme.spacing(0, 1),
            minHeight: '64px',
          }}
        >
          {open && (
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                pl: 2,
                fontWeight: 'bold',
                color: theme.palette.primary.main
              }}
            >
              Pawn Shop
            </Typography>
          )}
          <IconButton
            onClick={toggleDrawer}
            sx={{
              borderRadius: 1.5,
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
              }
            }}
          >
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        </Box>
        <Divider sx={{ mx: 2 }} />
        <List component="nav" sx={{ pt: 1 }}>
          {navItems.map((item) => (
            <NavItem
              key={item.text}
              item={item}
              open={open}
              onNavigate={handleNavigate}
              active={isActive(item.path)}
            />
          ))}
        </List>
      </StyledDrawer>

      {/* Main Content */}
      <MainContent open={open}>
        <Outlet />
      </MainContent>
    </Box>
  );
};

export default Layout;