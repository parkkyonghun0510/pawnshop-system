import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Collapse,
  Tooltip,
  IconButton,
  Typography,
  useTheme,
  alpha
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Dashboard as DashboardIcon,
  Store as StoreIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon,
  ReceiptLong as TransactionsIcon,
  BarChart as ReportsIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandLess,
  ExpandMore,
  AdminPanelSettings as RolesIcon,
  VpnKey as PermissionsIcon,
  History as AuditLogIcon,
  Assignment as ApplicationsIcon,
} from '@mui/icons-material';

// Styled components
const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  minHeight: '64px',
}));

// Navigation items with nested structure
const navigationItems = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: <DashboardIcon />,
  },
  {
    title: 'Branch Management',
    icon: <StoreIcon />,
    children: [
      {
        title: 'Branches',
        path: '/branches',
        icon: <StoreIcon fontSize="small" />,
      },
      {
        title: 'Employees',
        path: '/employees',
        icon: <PeopleIcon fontSize="small" />,
      },
    ],
  },
  {
    title: 'Customer Management',
    icon: <PersonIcon />,
    children: [
      {
        title: 'Customers',
        path: '/customers',
        icon: <PersonIcon fontSize="small" />,
      },
    ],
  },
  {
    title: 'Loan Management',
    icon: <ReceiptIcon />,
    children: [
      {
        title: 'Loan Applications',
        path: '/loan-applications',
        icon: <ApplicationsIcon fontSize="small" />,
      },
      {
        title: 'Loans',
        path: '/loans',
        icon: <ReceiptIcon fontSize="small" />,
      },
      {
        title: 'Transactions',
        path: '/transactions',
        icon: <TransactionsIcon fontSize="small" />,
      },
    ],
  },
  {
    title: 'Inventory',
    path: '/inventory',
    icon: <InventoryIcon />,
  },
  {
    title: 'Reports',
    path: '/reports',
    icon: <ReportsIcon />,
  },
  {
    title: 'Administration',
    icon: <SettingsIcon />,
    children: [
      {
        title: 'Users',
        path: '/users',
        icon: <PeopleIcon fontSize="small" />,
      },
      {
        title: 'Roles',
        path: '/roles',
        icon: <RolesIcon fontSize="small" />,
      },
      {
        title: 'Permissions',
        path: '/permissions',
        icon: <PermissionsIcon fontSize="small" />,
      },
      {
        title: 'Audit Logs',
        path: '/audit-logs',
        icon: <AuditLogIcon fontSize="small" />,
      },
    ],
  },
  {
    title: 'UI Components',
    path: '/sample',
    icon: <SettingsIcon />,
  },
];

interface SidebarProps {
  open: boolean;
  collapsed: boolean;
  drawerWidth: number;
  collapsedWidth: number;
  onDrawerToggle: () => void;
  onDrawerCollapse: () => void;
}

const Sidebar = ({
  open,
  collapsed,
  drawerWidth,
  collapsedWidth,
  onDrawerToggle,
  onDrawerCollapse,
}: SidebarProps) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Track expanded menu items
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Toggle menu item expansion
  const handleExpandClick = (title: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  // Check if a path is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Check if a parent item should be highlighted (if any child is active)
  const isParentActive = (children: { path: string }[]) => {
    return children.some(child => isActive(child.path));
  };

  // Render menu items
  const renderMenuItems = (items: typeof navigationItems) => {
    return items.map((item) => {
      // Check if item has children
      const hasChildren = item.children && item.children.length > 0;

      // Determine if this item or any of its children is active
      const active = item.path ? isActive(item.path) : hasChildren ? isParentActive(item.children!) : false;

      // Determine if this parent item is expanded
      const expanded = expandedItems[item.title] || false;

      return (
        <Box key={item.title}>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: collapsed ? 'center' : 'initial',
                px: 2.5,
                backgroundColor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                '&:hover': {
                  backgroundColor: active
                    ? alpha(theme.palette.primary.main, 0.2)
                    : alpha(theme.palette.primary.main, 0.05),
                },
                borderLeft: active ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
              }}
              onClick={() => {
                if (hasChildren) {
                  handleExpandClick(item.title);
                } else if (item.path) {
                  navigate(item.path);
                }
              }}
            >
              <Tooltip title={collapsed ? item.title : ''} placement="right" arrow>
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: collapsed ? 'auto' : 3,
                    justifyContent: 'center',
                    color: active ? theme.palette.primary.main : theme.palette.text.primary,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
              </Tooltip>

              {!collapsed && (
                <>
                  <ListItemText
                    primary={item.title}
                    sx={{
                      opacity: collapsed ? 0 : 1,
                      color: active ? theme.palette.primary.main : theme.palette.text.primary,
                      '& .MuiTypography-root': {
                        fontWeight: active ? 600 : 400,
                      },
                    }}
                  />

                  {hasChildren && (expanded ? <ExpandLess /> : <ExpandMore />)}
                </>
              )}
            </ListItemButton>
          </ListItem>

          {/* Render children if expanded */}
          {hasChildren && !collapsed && (
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {item.children!.map((child) => {
                  const childActive = isActive(child.path);

                  return (
                    <ListItemButton
                      key={child.title}
                      sx={{
                        pl: 4,
                        py: 0.5,
                        minHeight: 40,
                        backgroundColor: childActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                        '&:hover': {
                          backgroundColor: childActive
                            ? alpha(theme.palette.primary.main, 0.2)
                            : alpha(theme.palette.primary.main, 0.05),
                        },
                        borderLeft: childActive ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                      }}
                      onClick={() => navigate(child.path)}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 36,
                          color: childActive ? theme.palette.primary.main : theme.palette.text.secondary,
                        }}
                      >
                        {child.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={child.title}
                        sx={{
                          '& .MuiTypography-root': {
                            fontSize: '0.875rem',
                            fontWeight: childActive ? 600 : 400,
                            color: childActive ? theme.palette.primary.main : theme.palette.text.secondary,
                          },
                        }}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            </Collapse>
          )}
        </Box>
      );
    });
  };

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: open ? (collapsed ? collapsedWidth : drawerWidth) : 0,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        '& .MuiDrawer-paper': {
          width: collapsed ? collapsedWidth : drawerWidth,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.shorter,
          }),
          overflowX: 'hidden',
          borderRight: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none',
          backgroundColor: theme.palette.background.paper,
        },
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.easeInOut,
          duration: theme.transitions.duration.shorter,
        }),
      }}
    >
      <DrawerHeader>
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', pl: 2 }}>
            <Typography variant="h6" noWrap component="div" fontWeight="bold">
              LC Cash Express
            </Typography>
          </Box>
        )}
        <IconButton onClick={onDrawerCollapse}>
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </DrawerHeader>

      <Divider />

      <List sx={{ pt: 1 }}>
        {renderMenuItems(navigationItems)}
      </List>
    </Drawer>
  );
};

export default Sidebar;
