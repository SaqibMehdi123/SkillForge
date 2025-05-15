import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Snackbar, Alert, IconButton, Avatar, Box, Typography, Stack } from '@mui/material';
import { Close as CloseIcon, Chat as ChatIcon } from '@mui/icons-material';
import theme from './theme';
import { loadUser } from './features/auth/authSlice';
import { getConversations } from './features/messages/messagesSlice';

// Components
import Navbar from './components/layout/Navbar';
import Home from './components/pages/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import Profile from './components/profile/Profile';
import Friends from './components/social/Friends';
import Messages from './components/social/Messages';
import Achievements from './components/achievements/Achievements';
import PracticeSession from './components/practice/PracticeSession';
import FloatingChatButton from './components/social/FloatingChatButton';

// Message Notification Component
const MessageNotification = ({ open, message, handleClose, handleClick }) => {
  if (!message) return null;
  
  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ mt: 7 }}
    >
      <Alert 
        severity="info" 
        sx={{ 
          width: '100%', 
          bgcolor: 'white', 
          color: 'text.primary',
          border: '1px solid #0084FF',
          '& .MuiAlert-icon': { color: '#0084FF' }
        }}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        icon={<ChatIcon sx={{ color: '#0084FF' }} />}
        onClick={handleClick}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <Avatar 
            src={message.sender?.avatar} 
            alt={message.sender?.username}
            sx={{ width: 40, height: 40, mr: 1.5 }}
          >
            {message.sender?.username?.charAt(0).toUpperCase()}
          </Avatar>
          <Stack>
            <Typography variant="subtitle2">{message.sender?.username}</Typography>
            <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
              {message.content || 'Sent you an image'}
            </Typography>
          </Stack>
        </Box>
      </Alert>
    </Snackbar>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  
  // If we're still loading, show nothing or a loading indicator
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Redirect authenticated users away from login/register pages
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  
  // If we're still loading, show nothing or a loading indicator
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>Loading...</div>;
  }
  
  // If authenticated, redirect to the last route or dashboard if no saved route
  if (isAuthenticated) {
    const lastRoute = localStorage.getItem('lastRoute') || '/dashboard';
    return <Navigate to={lastRoute} />;
  }
  
  return children;
};

// Chat button with conditional rendering
const ConditionalChatButton = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { pathname } = window.location;
  
  // Don't show the chat button when on the messages route or not authenticated
  if (!isAuthenticated || pathname.includes('/messages')) {
    return null;
  }
  
  return <FloatingChatButton />;
};

// Route Tracker component to save the current route
const RouteTracker = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Don't save login/register routes
    if (!location.pathname.includes('/login') && !location.pathname.includes('/register')) {
      localStorage.setItem('lastRoute', location.pathname);
    }
  }, [location]);
  
  return null;
};

function App() {
  const dispatch = useDispatch();
  const themeMode = useSelector((state) => state.theme.mode);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { conversations } = useSelector((state) => state.messages);
  const [prevConversations, setPrevConversations] = useState([]);
  const [notification, setNotification] = useState({ open: false, message: null });
  
  const dynamicTheme = React.useMemo(() =>
    createTheme({
      ...theme,
      palette: {
        ...theme.palette,
        mode: themeMode,
        background: {
          ...theme.palette.background,
          default: themeMode === 'dark' ? '#232946' : '#f5f5f5',
          paper: themeMode === 'dark' ? '#232946' : '#fff',
        },
      },
    }), [themeMode]);
    
  // Check for authentication token on app load
  useEffect(() => {
    // Try to load user data if token exists in localStorage
    if (localStorage.getItem('token')) {
      dispatch(loadUser());
    }
  }, [dispatch]);

  // Fetch conversations periodically and check for new messages
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Initial fetch
    dispatch(getConversations());
    
    // Set up polling every 15 seconds
    const interval = setInterval(() => {
      dispatch(getConversations());
    }, 15000);
    
    return () => clearInterval(interval);
  }, [dispatch, isAuthenticated]);

  // Check for new messages and show notifications
  useEffect(() => {
    if (!conversations.length || !prevConversations.length) {
      setPrevConversations(conversations);
      return;
    }

    // Check for any conversation with new messages
    for (const newConv of conversations) {
      const prevConv = prevConversations.find(c => c._id === newConv._id);
      
      // If unread count increased, show notification
      if (
        prevConv && 
        newConv.unreadCount > prevConv.unreadCount && 
        newConv.lastMessage
      ) {
        // Show notification with the new message
        setNotification({
          open: true,
          message: {
            ...newConv.lastMessage,
            sender: newConv.user,
            conversationId: newConv._id
          }
        });
        break;
      }
    }
    
    // Update previous conversations state
    setPrevConversations(conversations);
  }, [conversations, prevConversations]);

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleNotificationClick = () => {
    if (notification.message?.conversationId) {
      window.location.href = `/messages/${notification.message.conversationId}`;
    }
    handleCloseNotification();
  };

  return (
    <ThemeProvider theme={dynamicTheme}>
      <CssBaseline />
      <Router>
        <RouteTracker />
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          } />
          <Route path="/register" element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          } />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/friends"
            element={
              <ProtectedRoute>
                <Friends />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages/:userId"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/achievements"
            element={
              <ProtectedRoute>
                <Achievements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice"
            element={
              <ProtectedRoute>
                <PracticeSession />
              </ProtectedRoute>
            }
          />
        </Routes>
        <ConditionalChatButton />
        <MessageNotification 
          open={notification.open}
          message={notification.message}
          handleClose={handleCloseNotification}
          handleClick={handleNotificationClick}
        />
      </Router>
    </ThemeProvider>
  );
}

export default App; 