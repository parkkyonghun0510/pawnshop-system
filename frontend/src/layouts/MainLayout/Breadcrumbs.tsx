import { useEffect, useState } from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography, Box, Chip } from '@mui/material';
import { Home as HomeIcon, NavigateNext as NavigateNextIcon } from '@mui/icons-material';

// Map of route paths to readable names
const routeNameMap: Record<string, string> = {
  '': 'Home',
  'dashboard': 'Dashboard',
  'branches': 'Branches',
  'employees': 'Employees',
  'customers': 'Customers',
  'inventory': 'Inventory',
  'loan-applications': 'Loan Applications',
  'loans': 'Loans',
  'transactions': 'Transactions',
  'reports': 'Reports',
  'users': 'Users',
  'roles': 'Roles',
  'permissions': 'Permissions',
  'audit-logs': 'Audit Logs',
  'settings': 'Settings',
  'profile': 'Profile',
  'applications': 'Applications',
};

// Map of parent routes
const parentRouteMap: Record<string, string> = {
  'branches': 'Branch Management',
  'employees': 'Branch Management',
  'customers': 'Customer Management',
  'loan-applications': 'Loan Management',
  'loans': 'Loan Management',
  'transactions': 'Loan Management',
  'users': 'Administration',
  'roles': 'Administration',
  'permissions': 'Administration',
  'audit-logs': 'Administration',
};

interface BreadcrumbItem {
  name: string;
  path: string;
  isLast: boolean;
}

const Breadcrumbs = () => {
  const location = useLocation();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  useEffect(() => {
    const generateBreadcrumbs = () => {
      // Remove leading slash and split path
      const pathSegments = location.pathname.split('/').filter(Boolean);

      // Generate breadcrumb items
      const breadcrumbItems: BreadcrumbItem[] = [];

      // Add home breadcrumb
      breadcrumbItems.push({
        name: 'Home',
        path: '/',
        isLast: pathSegments.length === 0,
      });

      // Add path segments as breadcrumbs
      let currentPath = '';

      pathSegments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        const isLast = index === pathSegments.length - 1;

        // Get readable name for the segment
        const name = routeNameMap[segment] || segment;

        // Check if this segment has a parent category
        const parentCategory = parentRouteMap[segment];

        // If there's a parent category and it's not already in breadcrumbs, add it
        if (parentCategory && !breadcrumbItems.some(item => item.name === parentCategory)) {
          breadcrumbItems.push({
            name: parentCategory,
            path: '', // No direct path for category
            isLast: false,
          });
        }

        breadcrumbItems.push({
          name,
          path: currentPath,
          isLast,
        });
      });

      return breadcrumbItems;
    };

    setBreadcrumbs(generateBreadcrumbs());
  }, [location]);

  // If we're at the root path, don't show breadcrumbs
  if (location.pathname === '/') {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      <MuiBreadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
      >
        {breadcrumbs.map((breadcrumb, index) => {
          // For the home breadcrumb
          if (index === 0) {
            return (
              <Link
                key={breadcrumb.path}
                component={RouterLink}
                to={breadcrumb.path}
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
                <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
                {breadcrumb.name}
              </Link>
            );
          }

          // For category breadcrumbs (no path)
          if (!breadcrumb.path) {
            return (
              <Typography
                key={`category-${breadcrumb.name}`}
                color="text.secondary"
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                {breadcrumb.name}
              </Typography>
            );
          }

          // For the last breadcrumb (current page)
          if (breadcrumb.isLast) {
            return (
              <Typography
                key={breadcrumb.path}
                color="text.primary"
                sx={{ fontWeight: 'medium' }}
              >
                {breadcrumb.name}
              </Typography>
            );
          }

          // For intermediate breadcrumbs
          return (
            <Link
              key={breadcrumb.path}
              component={RouterLink}
              to={breadcrumb.path}
              sx={{
                color: 'text.primary',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              {breadcrumb.name}
            </Link>
          );
        })}
      </MuiBreadcrumbs>

      {/* Page Title - Don't show for Dashboard which has its own title */}
      {location.pathname !== '/dashboard' && (
        <Typography variant="h5" component="h1" sx={{ mt: 1, fontWeight: 600 }}>
          {breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : 'Page'}
        </Typography>
      )}
    </Box>
  );
};

export default Breadcrumbs;
