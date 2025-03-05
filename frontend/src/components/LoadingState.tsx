import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

interface LoadingStateProps {
    fullScreen?: boolean;
    message?: string;
    size?: 'small' | 'medium' | 'large';
    overlay?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({
    fullScreen = false,
    message = 'Loading...',
    size = 'medium',
    overlay = false,
}) => {
    const sizeMap = {
        small: 24,
        medium: 40,
        large: 56,
    };

    const content = (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            gap={2}
            sx={{
                minHeight: fullScreen ? '100vh' : '200px',
                width: '100%',
                backgroundColor: overlay ? 'rgba(255, 255, 255, 0.8)' : 'transparent',
                position: overlay ? 'fixed' : 'relative',
                top: overlay ? 0 : 'auto',
                left: overlay ? 0 : 'auto',
                zIndex: overlay ? 1300 : 'auto',
            }}
        >
            <CircularProgress
                size={sizeMap[size]}
                sx={{
                    color: 'primary.main',
                }}
            />
            {message && (
                <Typography
                    variant="body1"
                    color="textSecondary"
                    sx={{
                        marginTop: 1,
                        textAlign: 'center',
                    }}
                >
                    {message}
                </Typography>
            )}
        </Box>
    );

    return content;
};

export default LoadingState; 