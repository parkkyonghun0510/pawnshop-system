import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useThemeContext } from '../../contexts/ThemeContext';

// Styled components
// App bar with dynamic width and margin based on sidebar state
const StyledAppBar = styled(AppBar)<{
  open: boolean;
  collapsed: boolean;
  drawerWidth: number;
}>(({ theme, open, collapsed, drawerWidth }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.shorter,
  }),
  width: open ? `calc(100% - ${drawerWidth}px)` : '100%',
  marginLeft: open ? drawerWidth : 0,
  boxShadow: '0 2px 10px 0 rgba(0,0,0,0.1)',
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
}));

const SearchWrapper = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.black, 0.05),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.black, 0.1),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
  display: 'flex',
  alignItems: 'center',
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled('input')(({ theme }) => ({
  color: 'inherit',
  border: 'none',
  outline: 'none',
  background: 'transparent',
  padding: theme.spacing(1, 1, 1, 0),
  paddingLeft: `calc(1em + ${theme.spacing(4)})`,
  transition: theme.transitions.create('width'),
  width: '100%',
  height: '40px',
  [theme.breakpoints.up('md')]: {
    width: '20ch',
  },
}));

interface HeaderProps {
  open: boolean;
  collapsed: boolean;
  drawerWidth: number;
  onDrawerToggle: () => void;
}

const Header = ({ open, collapsed, drawerWidth, onDrawerToggle }: HeaderProps) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { mode, toggleColorMode } = useThemeContext();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const handleThemeToggle = () => {
    toggleColorMode();
  };

  return (
    <StyledAppBar position="fixed" open={open} collapsed={collapsed} drawerWidth={drawerWidth}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 2, ...(open && { display: { sm: 'none' } }) }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 600 }}
        >
          Pawn Shop Management System
        </Typography>

        <SearchWrapper>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Search…"
            inputProps={{ 'aria-label': 'search' }}
          />
        </SearchWrapper>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Theme Toggle */}
          <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
            <IconButton
              size="large"
              aria-label="toggle theme"
              color="inherit"
              onClick={handleThemeToggle}
              sx={{
                transition: 'transform 0.3s ease-in-out',
                '&:hover': { transform: 'rotate(30deg)' }
              }}
            >
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              size="large"
              aria-label="show new notifications"
              color="inherit"
              onClick={handleNotificationMenuOpen}
            >
              <Badge badgeContent={4} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Profile */}
          <Tooltip title="Account settings">
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
              sx={{ ml: 1 }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: theme.palette.primary.main,
                  fontSize: '0.875rem'
                }}
              >
                {user?.name?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            mt: 1.5,
            width: 200,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {user?.name || 'User'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email || 'user@example.com'}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
          <AccountCircleIcon fontSize="small" sx={{ mr: 2 }} />
          Profile
        </MenuItem>
        <MenuItem onClick={() => { navigate('/settings'); handleMenuClose(); }}>
          <SettingsIcon fontSize="small" sx={{ mr: 2 }} />
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <LogoutIcon fontSize="small" sx={{ mr: 2 }} />
          Logout
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchorEl}
        id="notifications-menu"
        open={Boolean(notificationAnchorEl)}
        onClose={handleNotificationMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            mt: 1.5,
            width: 320,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Notifications
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleNotificationMenuClose}>
          <Box sx={{ width: '100%' }}>
            <Typography variant="body2" fontWeight="medium">
              New loan application submitted
            </Typography>
            <Typography variant="caption" color="text.secondary">
              5 minutes ago
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={handleNotificationMenuClose}>
          <Box sx={{ width: '100%' }}>
            <Typography variant="body2" fontWeight="medium">
              Loan #12345 is due tomorrow
            </Typography>
            <Typography variant="caption" color="text.secondary">
              1 hour ago
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Typography
            variant="body2"
            color="primary"
            sx={{ cursor: 'pointer', fontWeight: 'medium' }}
            onClick={() => { navigate('/notifications'); handleNotificationMenuClose(); }}
          >
            View all notifications
          </Typography>
        </Box>
      </Menu>
    </StyledAppBar>
  );
};

export default Header;
