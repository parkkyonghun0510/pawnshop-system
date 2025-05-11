import { Box, Typography, Link, Divider, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled components
// Footer with dynamic width and margin based on sidebar state
const FooterWrapper = styled(Box)<{
  open: boolean;
  collapsed: boolean;
  drawerWidth: number;
}>(({ theme, open, collapsed, drawerWidth }) => ({
  padding: theme.spacing(1.5, 3),
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.shorter,
  }),
  width: open ? `calc(100% - ${drawerWidth}px)` : '100%',
  marginLeft: open ? drawerWidth : 0,
  zIndex: theme.zIndex.drawer - 1,
  position: 'relative',
}));

interface FooterProps {
  open: boolean;
  collapsed: boolean;
  drawerWidth: number;
}

const Footer = ({ open, collapsed, drawerWidth }: FooterProps) => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <FooterWrapper open={open} collapsed={collapsed} drawerWidth={drawerWidth}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          &copy; {currentYear} Pawn Shop Management System. All rights reserved.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Link href="#" color="inherit" underline="hover" variant="body2">
            Privacy Policy
          </Link>
          <Link href="#" color="inherit" underline="hover" variant="body2">
            Terms of Service
          </Link>
          <Link href="#" color="inherit" underline="hover" variant="body2">
            Help
          </Link>
        </Box>
      </Box>
    </FooterWrapper>
  );
};

export default Footer;
