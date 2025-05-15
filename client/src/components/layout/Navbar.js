import React, { useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  MenuItem,
  LinearProgress,
  Chip,
  Paper,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  EmojiEvents as EmojiEventsIcon,
  Timer as TimerIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  MonetizationOn as CoinIcon,
  Star as LevelIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { logout, loadUser } from '../../features/auth/authSlice';
import { toggleTheme } from '../../features/theme/themeSlice';

const pages = [
  { name: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { name: 'Practice', path: '/practice', icon: <TimerIcon /> },
  { name: 'Friends', path: '/friends', icon: <PeopleIcon /> },
  { name: 'Achievements', path: '/achievements', icon: <EmojiEventsIcon /> },
];

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const themeMode = useSelector((state) => state.theme.mode);
  const [anchorEl, setAnchorEl] = React.useState(null);

  // Load user data on component mount if token exists
  useEffect(() => {
    if (localStorage.getItem('token')) {
      dispatch(loadUser());
    }
  }, [dispatch]);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleClose();
    navigate('/');
  };

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  // XP progress for level up (e.g., 100 XP per level)
  const xpToNextLevel = user?.level ? user.level * 100 : 100;
  const xpPercent = user?.xp ? Math.min(100, (user.xp / xpToNextLevel) * 100) : 0;

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: 'linear-gradient(90deg, #6d28d9 60%, #a78bfa 100%)',
        borderRadius: 0,
        boxShadow: '0 4px 16px rgba(124,58,237,0.08)',
        borderBottom: '4px solid #a78bfa',
        minHeight: 64,
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Container maxWidth="xl" disableGutters>
        <Toolbar sx={{ minHeight: 64, px: 3, display: 'flex', justifyContent: 'space-between' }}>
          {/* Left: Logo and Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography
              variant="h5"
              component={RouterLink}
              to="/"
              sx={{
                textDecoration: 'none',
                color: 'white',
                fontWeight: 900,
                letterSpacing: 1,
                ml: 1,
                mr: 3,
                fontFamily: 'Quicksand, Nunito, Arial, sans-serif',
              }}
            >
              SkillForge
            </Typography>
            {isAuthenticated && pages.map((page) => (
              <Button
                key={page.name}
                component={RouterLink}
                to={page.path}
                startIcon={page.icon}
                sx={{
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 16,
                  mx: 0.5,
                  px: 1.5,
                  borderRadius: 2,
                  letterSpacing: 0.5,
                  minWidth: 0,
                  '&:hover': {
                    background: 'rgba(255,255,255,0.10)',
                  },
                }}
              >
                {page.name}
              </Button>
            ))}
          </Box>

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Right: Auth Buttons or User Status Section */}
          {!isAuthenticated ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                component={RouterLink}
                to="/login"
                sx={{
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 16,
                  px: 2,
                  borderRadius: 2,
                  letterSpacing: 0.5,
                  background: 'rgba(124,58,237,0.15)',
                  '&:hover': {
                    background: 'rgba(124,58,237,0.25)',
                  },
                }}
              >
                Login
              </Button>
              <Button
                component={RouterLink}
                to="/register"
                sx={{
                  color: '#6d28d9',
                  fontWeight: 700,
                  fontSize: 16,
                  px: 2,
                  borderRadius: 2,
                  letterSpacing: 0.5,
                  background: 'white',
                  ml: 1,
                  '&:hover': {
                    background: '#ede9fe',
                  },
                }}
              >
                Register
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* XP Bar & Level */}
              <Box sx={{ minWidth: 120, mr: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, fontSize: 13, minWidth: 20 }}>
                    XP
                  </Typography>
                  <Box sx={{ position: 'relative', flex: 1, minWidth: 60, maxWidth: 90 }}>
                    <LinearProgress
                      variant="determinate"
                      value={xpPercent}
                      sx={{
                        height: 18,
                        borderRadius: 5,
                        background: '#ede9fe',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#fbbf24', // gold
                        },
                      }}
                    />
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        textAlign: 'center', 
                        lineHeight: '18px', 
                        color: '#fff', 
                        fontWeight: 600, 
                        fontSize: 10,
                        textShadow: '0px 0px 2px rgba(0,0,0,0.7)'
                      }}
                    >
                      {user?.xp || 0} / {xpToNextLevel}
                    </Typography>
                  </Box>
                  <Chip
                    icon={<LevelIcon sx={{ color: '#fff', fontSize: 18 }} />}
                    label={typeof user?.level === 'number' ? `Lv${user?.level || 1}` : user?.level || 'Lv1'}
                    size="small"
                    sx={{ bgcolor: '#a78bfa', color: '#fff', fontWeight: 700, fontSize: 13, borderRadius: 2, px: 0.5 }}
                  />
                </Box>
              </Box>
              {/* Badge */}
              {user?.badge && (
                <Chip
                  icon={<EmojiEventsIcon sx={{ color: '#fbbf24', fontSize: 18 }} />}
                  label={user.badge}
                  size="small"
                  sx={{ bgcolor: '#fff', color: '#6d28d9', fontWeight: 700, fontSize: 13, borderRadius: 2, px: 0.5, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                />
              )}
              {/* User Name */}
              <Typography variant="body2" sx={{ color: 'white', fontWeight: 700, fontSize: 16, mr: 1, textShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                {user?.username || 'User'}
              </Typography>
              {/* Avatar only (clickable for menu) */}
              <Avatar
                src={user?.avatar}
                alt={user?.username}
                sx={{ width: 36, height: 36, border: '2px solid #fbbf24', bgcolor: '#ede9fe', cursor: 'pointer' }}
                onClick={handleMenu}
              />
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem component={RouterLink} to="/profile" onClick={handleClose}>Profile</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar; 