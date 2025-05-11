import { Box, CircularProgress, Typography, useTheme } from '@mui/material';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

const LoadingScreen = ({ 
  message = 'Loading...', 
  fullScreen = false 
}: LoadingScreenProps) => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: fullScreen ? '100vh' : '100%',
        minHeight: fullScreen ? '100vh' : '300px',
        width: '100%',
        backgroundColor: theme.palette.background.default,
      }}
    >
      <CircularProgress 
        size={48} 
        thickness={4}
        sx={{ 
          color: theme.palette.primary.main,
          mb: 2
        }} 
      />
      <Typography 
        variant="h6" 
        color="textSecondary"
        sx={{ 
          fontWeight: 500,
          animation: 'pulse 1.5s infinite ease-in-out',
          '@keyframes pulse': {
            '0%': {
              opacity: 0.6,
            },
            '50%': {
              opacity: 1,
            },
            '100%': {
              opacity: 0.6,
            },
          },
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingScreen;
