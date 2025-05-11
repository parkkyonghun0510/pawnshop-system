import React, { createContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, alpha } from '@mui/material/styles';
import { CssBaseline, PaletteMode } from '@mui/material';

// Define color palette
const primaryColor = {
  main: '#1a457a', // Deep blue for a professional financial look
  light: '#446ca5',
  dark: '#002253',
  contrastText: '#ffffff',
};

const secondaryColor = {
  main: '#e6a817', // Gold accent, representing valuables
  light: '#ffda47',
  dark: '#af7900',
  contrastText: '#000000',
};

// Create theme with color mode support
const createAppTheme = (mode: PaletteMode) => {
  return createTheme({
    palette: {
      mode,
      primary: primaryColor,
      secondary: secondaryColor,
      error: {
        main: '#d32f2f',
        light: '#ef5350',
        dark: '#c62828',
      },
      warning: {
        main: '#ed6c02',
        light: '#ff9800',
        dark: '#e65100',
      },
      info: {
        main: '#0288d1',
        light: '#03a9f4',
        dark: '#01579b',
      },
      success: {
        main: '#2e7d32',
        light: '#4caf50',
        dark: '#1b5e20',
      },
      background: {
        default: mode === 'light' ? '#f5f7fa' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
      text: {
        primary: mode === 'light' ? '#333333' : '#e0e0e0',
        secondary: mode === 'light' ? '#666666' : '#a0a0a0',
      },
      divider: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
      action: {
        active: mode === 'light' ? 'rgba(0, 0, 0, 0.54)' : 'rgba(255, 255, 255, 0.7)',
        hover: mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)',
        selected: mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.16)',
        disabled: mode === 'light' ? 'rgba(0, 0, 0, 0.26)' : 'rgba(255, 255, 255, 0.3)',
        disabledBackground: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: '-0.01562em',
        '@media (max-width:600px)': {
          fontSize: '2rem',
        },
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: '-0.00833em',
        '@media (max-width:600px)': {
          fontSize: '1.8rem',
        },
      },
      h3: {
        fontSize: '1.8rem',
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: '0em',
        '@media (max-width:600px)': {
          fontSize: '1.5rem',
        },
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: '0.00735em',
      },
      h5: {
        fontSize: '1.2rem',
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: '0em',
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: '0.0075em',
      },
      subtitle1: {
        fontSize: '1rem',
        fontWeight: 500,
        lineHeight: 1.5,
        letterSpacing: '0.00938em',
      },
      subtitle2: {
        fontSize: '0.875rem',
        fontWeight: 500,
        lineHeight: 1.5,
        letterSpacing: '0.00714em',
      },
      body1: {
        fontSize: '1rem',
        fontWeight: 400,
        lineHeight: 1.5,
        letterSpacing: '0.00938em',
      },
      body2: {
        fontSize: '0.875rem',
        fontWeight: 400,
        lineHeight: 1.5,
        letterSpacing: '0.01071em',
      },
      button: {
        fontSize: '0.875rem',
        fontWeight: 500,
        lineHeight: 1.75,
        letterSpacing: '0.02857em',
        textTransform: 'none', // Avoid uppercase buttons
      },
      caption: {
        fontSize: '0.75rem',
        fontWeight: 400,
        lineHeight: 1.66,
        letterSpacing: '0.03333em',
      },
      overline: {
        fontSize: '0.75rem',
        fontWeight: 600,
        lineHeight: 2.66,
        letterSpacing: '0.08333em',
        textTransform: 'uppercase',
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '*': {
            boxSizing: 'border-box',
          },
          html: {
            height: '100%',
            width: '100%',
          },
          body: {
            height: '100%',
            margin: 0,
            padding: 0,
          },
          '#root': {
            height: '100%',
          },
          'input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button': {
            '-webkit-appearance': 'none',
            margin: 0,
          },
          'input[type=number]': {
            '-moz-appearance': 'textfield',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: 'none',
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': {
              boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
            },
          },
          sizeLarge: {
            height: 48,
            padding: '0 24px',
          },
          sizeMedium: {
            height: 40,
            padding: '0 16px',
          },
          sizeSmall: {
            height: 32,
            padding: '0 12px',
          },
          containedPrimary: {
            '&:hover': {
              backgroundColor: primaryColor.dark,
            },
          },
          containedSecondary: {
            '&:hover': {
              backgroundColor: secondaryColor.dark,
            },
          },
          outlined: {
            borderWidth: 1.5,
            '&:hover': {
              borderWidth: 1.5,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: mode === 'light' 
              ? '0px 4px 12px rgba(0, 0, 0, 0.05)' 
              : '0px 4px 12px rgba(0, 0, 0, 0.2)',
          },
          rounded: {
            borderRadius: 12,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'light' 
              ? '0px 4px 12px rgba(0, 0, 0, 0.05)' 
              : '0px 4px 12px rgba(0, 0, 0, 0.2)',
            borderRadius: 12,
            position: 'relative',
            zIndex: 0,
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: mode === 'light' 
                ? '0px 12px 24px rgba(0, 0, 0, 0.1)' 
                : '0px 12px 24px rgba(0, 0, 0, 0.3)',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'light' 
              ? '0px 2px 10px rgba(0, 0, 0, 0.1)' 
              : '0px 2px 10px rgba(0, 0, 0, 0.3)',
            backgroundImage: 'none',
          },
          colorDefault: {
            backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
            color: mode === 'light' ? '#333333' : '#ffffff',
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'light' 
              ? alpha(primaryColor.light, 0.1) 
              : alpha(primaryColor.dark, 0.2),
            '& .MuiTableCell-root': {
              color: mode === 'light' ? primaryColor.dark : primaryColor.light,
              fontWeight: 600,
            },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            border: 'none',
            backgroundImage: 'none',
          },
        },
      },
    },
  });
};

// Theme context type
interface ThemeContextType {
  mode: PaletteMode;
  toggleColorMode: () => void;
}

// Create context
export const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleColorMode: () => {},
});

// Theme provider props
interface ThemeProviderProps {
  children: React.ReactNode;
}

// Theme provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get saved theme from localStorage or use light mode as default
  const [mode, setMode] = useState<PaletteMode>(() => {
    const savedMode = localStorage.getItem('themeMode');
    return (savedMode as PaletteMode) || 'light';
  });

  // Toggle between light and dark mode
  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Save theme mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  // Create theme based on current mode
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  // Context value
  const contextValue = useMemo(
    () => ({
      mode,
      toggleColorMode,
    }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useThemeContext = () => {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};
