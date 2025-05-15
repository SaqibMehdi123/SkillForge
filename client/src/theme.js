import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#7c3aed', // Habitica purple
      light: '#a78bfa',
      dark: '#5b21b6',
      contrastText: '#fff',
    },
    secondary: {
      main: '#fbbf24', // Habitica gold
      light: '#fde68a',
      dark: '#b45309',
      contrastText: '#fff',
    },
    background: {
      default: 'linear-gradient(135deg, #f3e8ff 0%, #e0e7ff 100%)',
      paper: '#fff',
    },
    success: {
      main: '#22c55e',
      light: '#bbf7d0',
      dark: '#15803d',
    },
    error: {
      main: '#ef4444',
      light: '#fecaca',
      dark: '#b91c1c',
    },
    warning: {
      main: '#f59e42',
      light: '#fef3c7',
      dark: '#b45309',
    },
    info: {
      main: '#38bdf8',
      light: '#bae6fd',
      dark: '#0ea5e9',
    },
    divider: '#e0e7ff',
  },
  typography: {
    fontFamily: 'Quicksand, Nunito, Arial, sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          padding: '10px 20px',
          fontWeight: 700,
        },
        contained: {
          boxShadow: '0px 4px 12px rgba(124,58,237,0.08)',
          '&:hover': {
            boxShadow: '0px 6px 16px rgba(124,58,237,0.12)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0px 4px 16px rgba(124,58,237,0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: '0 0 20px 20px',
        },
      },
    },
  },
});

export default theme; 