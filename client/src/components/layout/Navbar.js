import React, { useEffect, useState } from 'react';
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
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
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
  Menu as MenuIcon,
  Whatshot as WhatshotIcon,
} from '@mui/icons-material';
import { logout, loadUser } from '../../features/auth/authSlice';
import { toggleTheme } from '../../features/theme/themeSlice';
import NotificationBadge from '../common/NotificationBadge';

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
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
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
        <Toolbar sx={{ minHeight: 64, px: { xs: 2, md: 3 }, display: 'flex', justifyContent: 'space-between' }}>
          {/* Left: Logo and Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isMobile && isAuthenticated && (
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={toggleMobileMenu}
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}
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
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
              }}
            >
              SkillForge
            </Typography>
          </Box>
          
          {/* Navigation Links - Desktop only */}
          {isAuthenticated && !isMobile && (
            <Box sx={{ display: 'flex', justifyContent: 'center', flexGrow: 1 }}>
              {pages.map((page) => (
                <Button
                  key={page.name}
                  component={RouterLink}
                  to={page.path}
                  startIcon={page.icon}
                  sx={{
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 16,
                    mx: 1.5,
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
          )}

          {/* Right: Auth Buttons or User Status Section */}
          {!isAuthenticated ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {!isMobile && (
                <Button
                  component={RouterLink}
                  to="/login"
                  sx={{
                    color: 'white',
                    fontWeight: 700,
                    fontSize: { xs: 14, sm: 16 },
                    px: { xs: 1.5, sm: 2 },
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
              )}
              <Button
                component={RouterLink}
                to="/register"
                sx={{
                  color: '#6d28d9',
                  fontWeight: 700,
                  fontSize: { xs: 14, sm: 16 },
                  px: { xs: 1.5, sm: 2 },
                  borderRadius: 2,
                  letterSpacing: 0.5,
                  background: 'white',
                  ml: isMobile ? 0 : 1,
                  '&:hover': {
                    background: '#ede9fe',
                  },
                }}
              >
                {isMobile ? 'Join' : 'Register'}
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* XP Bar & Level - Hidden on mobile */}
              {!isMobile && (
                <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ position: 'relative', width: 100 }}>
                    <LinearProgress
                      variant="determinate"
                      value={xpPercent}
                      sx={{
                        height: 22,
                        borderRadius: 5,
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%)', // Cyan to blue gradient
                          boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)',
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
                        lineHeight: '22px', 
                        color: '#fff', 
                        fontWeight: 600, 
                        fontSize: 10,
                        textShadow: '0px 0px 2px rgba(0,0,0,0.7)',
                        display: 'flex',
                        justifyContent: 'space-evenly',
                        px: 1
                      }}
                    >
                      <span>XP</span> <span>{user?.xp || 0}/{xpToNextLevel}</span>
                    </Typography>
                  </Box>
                  
                  <Chip
                    icon={<LevelIcon sx={{ color: '#fff', fontSize: 16 }} />}
                    label={typeof user?.level === 'number' ? `Lv${user?.level || 1}` : user?.level || 'Lv1'}
                    size="small"
                    sx={{ 
                      bgcolor: '#a78bfa', 
                      color: '#fff', 
                      fontWeight: 700, 
                      fontSize: 12, 
                      borderRadius: 2,
                      height: 22, 
                      '& .MuiChip-label': { px: 1 } 
                    }}
                  />
                  
                  {/* Streak Indicator */}
                  <Tooltip title="Current Streak">
                    <Chip
                      icon={<WhatshotIcon sx={{ color: '#fff', fontSize: 16 }} />}
                      label={user?.streaks?.current || 0}
                      size="small"
                      sx={{ 
                        bgcolor: '#f97316', // Orange color for flames
                        color: '#fff', 
                        fontWeight: 700, 
                        fontSize: 12, 
                        borderRadius: 2,
                        height: 22, 
                        '& .MuiChip-label': { px: 1 } 
                      }}
                    />
                  </Tooltip>
                </Box>
              )}
              
              {/* Notification Badge */}
              <NotificationBadge />
              
              {/* User Name and Avatar Group */}
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}>
                {!isMobile && (
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 700, fontSize: 16, mr: 0.5, textShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                    {user?.username || 'User'}
                  </Typography>
                )}
                <Avatar
                  src={user?.avatar}
                  alt={user?.username}
                  sx={{ width: 36, height: 36, border: '2px solid #fbbf24', bgcolor: '#ede9fe', cursor: 'pointer' }}
                  onClick={handleMenu}
                />
              </Box>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  sx: { mt: 1.5, boxShadow: 3 }
                }}
              >
                {isMobile && (
                  <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ position: 'relative', width: 80 }}>
                      <LinearProgress
                        variant="determinate"
                        value={xpPercent}
                        sx={{
                          height: 18,
                          borderRadius: 5,
                          background: 'rgba(255, 255, 255, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          '& .MuiLinearProgress-bar': {
                            background: 'linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%)', // Cyan to blue gradient
                            boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)',
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
                          fontSize: 9,
                          textShadow: '0px 0px 2px rgba(0,0,0,0.5)',
                        }}
                      >
                        <span>XP: {user?.xp || 0}/{xpToNextLevel}</span>
                      </Typography>
                    </Box>
                    <Chip
                      icon={<LevelIcon sx={{ color: '#fff', fontSize: 14 }} />}
                      label={typeof user?.level === 'number' ? `Lv${user?.level || 1}` : user?.level || 'Lv1'}
                      size="small"
                      sx={{ 
                        bgcolor: '#a78bfa', 
                        color: '#fff', 
                        fontWeight: 700, 
                        fontSize: 10, 
                        borderRadius: 2,
                        height: 18
                      }}
                    />
                    {/* Mobile Streak Indicator */}
                    <Chip
                      icon={<WhatshotIcon sx={{ color: '#fff', fontSize: 14 }} />}
                      label={user?.streaks?.current || 0}
                      size="small"
                      sx={{ 
                        bgcolor: '#f97316',
                        color: '#fff', 
                        fontWeight: 700, 
                        fontSize: 10, 
                        borderRadius: 2,
                        height: 18
                      }}
                    />
                  </Box>
                )}
                <MenuItem component={RouterLink} to="/profile" onClick={handleClose}>Profile</MenuItem>
                <MenuItem onClick={handleThemeToggle}>
                  {themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </Container>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={toggleMobileMenu}
        PaperProps={{
          sx: {
            width: 240,
            bgcolor: themeMode === 'dark' ? '#1a1f35' : '#fff',
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#6d28d9' }}>
            SkillForge
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Hello, {user?.username || 'User'}
          </Typography>
        </Box>
        <List sx={{ pt: 1 }}>
          {pages.map((page) => (
            <ListItem 
              button 
              key={page.name} 
              component={RouterLink} 
              to={page.path}
              onClick={toggleMobileMenu}
              sx={{ 
                borderRadius: 2, 
                mx: 1, 
                mb: 0.5,
                '&:hover': { bgcolor: themeMode === 'dark' ? 'rgba(167, 139, 250, 0.1)' : 'rgba(109, 40, 217, 0.05)' } 
              }}
            >
              <ListItemIcon sx={{ color: '#6d28d9', minWidth: 40 }}>
                {page.icon}
              </ListItemIcon>
              <ListItemText 
                primary={page.name} 
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
          ))}
          <Divider sx={{ my: 1.5 }} />
          <ListItem 
            button 
            component={RouterLink} 
            to="/profile"
            onClick={toggleMobileMenu}
            sx={{ 
              borderRadius: 2, 
              mx: 1, 
              mb: 0.5,
              '&:hover': { bgcolor: themeMode === 'dark' ? 'rgba(167, 139, 250, 0.1)' : 'rgba(109, 40, 217, 0.05)' } 
            }}
          >
            <ListItemIcon sx={{ color: '#6d28d9', minWidth: 40 }}>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Profile" 
              primaryTypographyProps={{ fontWeight: 600 }}
            />
          </ListItem>
          <ListItem 
            button 
            onClick={() => {
              handleThemeToggle();
              toggleMobileMenu();
            }}
            sx={{ 
              borderRadius: 2, 
              mx: 1, 
              mb: 0.5,
              '&:hover': { bgcolor: themeMode === 'dark' ? 'rgba(167, 139, 250, 0.1)' : 'rgba(109, 40, 217, 0.05)' } 
            }}
          >
            <ListItemIcon sx={{ color: '#6d28d9', minWidth: 40 }}>
              {themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </ListItemIcon>
            <ListItemText 
              primary={themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'} 
              primaryTypographyProps={{ fontWeight: 600 }}
            />
          </ListItem>
          <ListItem 
            button 
            onClick={() => {
              handleLogout();
              toggleMobileMenu();
            }}
            sx={{ 
              borderRadius: 2, 
              mx: 1, 
              mb: 0.5,
              '&:hover': { bgcolor: themeMode === 'dark' ? 'rgba(167, 139, 250, 0.1)' : 'rgba(109, 40, 217, 0.05)' } 
            }}
          >
            <ListItemIcon sx={{ color: '#6d28d9', minWidth: 40 }}>
              <RefreshIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Logout" 
              primaryTypographyProps={{ fontWeight: 600 }}
            />
          </ListItem>
        </List>
      </Drawer>
    </AppBar>
  );
};

export default Navbar; 