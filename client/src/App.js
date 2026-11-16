import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Snackbar, Alert, IconButton, Avatar, Box, Typography, Stack } from '@mui/material';
import { Close as CloseIcon, Chat as ChatIcon } from '@mui/icons-material';
import theme from './theme';
import { loadUser } from './features/auth/authSlice';
import { getConversations, socketMessageReceived } from './features/messages/messagesSlice';
import { connectSocket, disconnectSocket } from './socketService';

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
const MessageNotification = ({ open, message, handleClose }) => {
  // Audit fix F23: notification clicks used window.location.href, forcing a
  // full page reload that discarded all SPA state. This component lives
  // inside <Router>, so it can navigate the SPA way.
  const navigate = useNavigate();

  const handleNotificationClick = () => {
    if (message?.conversationId) {
      navigate(`/messages/${message.conversationId}`);
    }
    handleClose();
  };

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
        onClick={handleNotificationClick}
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
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
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
    return <Navigate to={lastRoute} replace />;
  }
  
  return children;
};

// Chat button with conditional rendering
const ConditionalChatButton = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  // Audit fix F13: this read window.location.pathname, which is NOT reactive
  // to SPA navigation - after client-side navigating to /messages the chat
  // FAB stayed visible (or vanished) until an unrelated store update re-
  // rendered App up to 15 seconds later.
  const { pathname } = useLocation();

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
    
    // R26: Socket.IO pushes arrive instantly; this poll is the reconnect
    // fallback only (was 15s - the primary real-time path before).
    const interval = setInterval(() => {
      dispatch(getConversations());
    }, 60000);
    
    return () => clearInterval(interval);
  }, [dispatch, isAuthenticated]);

  // R26: single socket connection while authenticated - pushes new messages
  // into the store instantly (the poller above is the fallback).
  useEffect(() => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    connectSocket(token, {
      onMessageNew: (msg) => dispatch(socketMessageReceived(msg)),
    });

    return () => disconnectSocket();
  }, [isAuthenticated, dispatch]);

  // Check for new messages and show notifications
  // Audit fix F14: the old version kept prevConversations in state and
  // setPrevConversations INSIDE the same effect - it only worked because the
  // second run was a same-reference no-op; it notified about just the first
  // conversation with increased unread, and the ref was never reset on
  // logout (re-login as another user compared against stale counts).
  const prevConversationsRef = useRef([]);
  useEffect(() => {
    if (!isAuthenticated) {
      prevConversationsRef.current = [];
      return;
    }
    if (!conversations.length) return;

    const prev = prevConversationsRef.current;
    if (prev.length) {
      for (const newConv of conversations) {
        const prevConv = prev.find((c) => c._id === newConv._id);
        if (
          prevConv &&
          newConv.unreadCount > prevConv.unreadCount &&
          newConv.lastMessage
        ) {
          setNotification({
            open: true,
            message: {
              ...newConv.lastMessage,
              sender: newConv.user,
              conversationId: newConv._id,
            },
          });
          break; // one toast at a time is enough
        }
      }
    }

    prevConversationsRef.current = conversations;
  }, [conversations, isAuthenticated]);

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
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
          {/* F23: unknown URLs used to render only the Navbar */}
          <Route
            path="*"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />
            }
          />
        </Routes>
        <ConditionalChatButton />
        <MessageNotification 
          open={notification.open}
          message={notification.message}
          handleClose={handleCloseNotification}
        />
      </Router>
    </ThemeProvider>
  );
}

export default App; 