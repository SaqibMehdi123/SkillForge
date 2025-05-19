import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  useTheme,
  useMediaQuery,
  Divider,
  Avatar,
  LinearProgress,
  IconButton,
  Stack,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Timer as TimerIcon,
  Camera as CameraIcon,
  BarChart as BarChartIcon,
  Group as GroupIcon,
  ArrowForward as ArrowForwardIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  LocalFireDepartment as FireIcon,
  WorkspacePremium as AchievementIcon,
  EmojiEvents as TrophyIcon,
  Celebration as CelebrationIcon,
  Star as StarIcon,
  Image as ImageIcon,
  InsertChart as InsertChartIcon,
  StackedLineChart as StackedLineChartIcon,
  CalendarMonth as CalendarIcon,
  Speed as SpeedIcon,
  DirectionsRun as ActivityIcon
} from '@mui/icons-material';
import { getHistory } from '../../features/practice/practiceSlice';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const currentTask = useSelector((state) => state.practice.currentTask);
  const tasks = useSelector((state) => state.practice.tasks);
  const completedTasks = useSelector((state) => state.practice.completedTasks);
  const photos = useSelector((state) => state.practice.photos || []);
  const themeMode = useSelector((state) => state.theme.mode);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [liveTime, setLiveTime] = useState(currentTask?.remaining || 0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);

  // Fetch practice session history when component mounts
  useEffect(() => {
    dispatch(getHistory());
  }, [dispatch]);

  // Helper to format seconds as mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get hours from minutes
  const getHoursFromMinutes = (minutes) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  // Calculate total practice time in minutes
  const totalPracticeMinutes = completedTasks.reduce(
    (total, task) => total + Math.floor(task.duration / 60), 
    0
  );

  // Get recent tasks (last 5)
  const recentCompletedTasks = [...completedTasks]
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 5);

  // Calculate streak summary
  const streakData = {
    current: user?.streaks?.current || 0,
    best: user?.streaks?.best || 0,
    level: user?.level || 1,
    xp: user?.xp || 0,
    nextLevel: (user?.level || 1) * 100,
    progress: Math.min(100, ((user?.xp || 0) % 100)),
    lastUpdate: user?.streaks?.lastUpdate ? new Date(user?.streaks?.lastUpdate) : null
  };

  // Calculate time until streak expires
  const getStreakExpiryInfo = () => {
    if (!streakData.lastUpdate) {
      return { 
        hoursLeft: 0, 
        expired: true, 
        expiryText: 'Upload a photo to start your streak!'
      };
    }

    const currentTime = new Date();
    const lastUpdate = new Date(streakData.lastUpdate);
    const timeDiff = currentTime - lastUpdate;
    const hoursPassed = timeDiff / (1000 * 60 * 60);
    const hoursLeft = Math.max(0, 30 - hoursPassed);
    
    if (hoursLeft <= 0) {
      return { 
        hoursLeft: 0, 
        expired: true,
        expiryText: 'Your streak has expired! Upload a photo to start a new streak.'
      };
    } else if (hoursLeft < 6) {
      return { 
        hoursLeft, 
        expired: false,
        expiryText: `⚠️ Only ${Math.floor(hoursLeft)} hours left to maintain your streak!`
      };
    } else {
      return { 
        hoursLeft, 
        expired: false,
        expiryText: `${Math.floor(hoursLeft)} hours left until streak expires`
      };
    }
  };

  const streakExpiry = getStreakExpiryInfo();

  // Calculate date-based metrics
  const daysActive = completedTasks.length > 0 
    ? new Set(completedTasks.map(task => new Date(task.endedAt || task.completedAt).toDateString())).size 
    : 0;
    
  // Calculate completion rate based on completed vs total sessions
  const completionRate = completedTasks.length > 0 || tasks.length > 0
    ? Math.round((completedTasks.length / (completedTasks.length + tasks.length)) * 100) 
    : 0;

  // Create weekly data for chart
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Calculate real weekly activity data from completed tasks
  const getWeeklyActivityData = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
    
    // Create a date for the Monday of current week
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    
    // Initialize activity data for each day of the week
    const activityData = weekdays.map((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return {
        day,
        date: date,
        minutes: 0,
        completed: 0
      };
    });
    
    // Populate with real data from completed tasks
    completedTasks.forEach(task => {
      const taskDate = new Date(task.endedAt || task.completedAt);
      
      // Check if task falls within current week
      if (taskDate >= monday && taskDate <= today) {
        // Get the day index (0 = Monday, 6 = Sunday)
        const dayIndex = (taskDate.getDay() + 6) % 7;
        
        // Add minutes and count completion
        activityData[dayIndex].minutes += Math.floor((task.duration || 0) / 60);
        activityData[dayIndex].completed += 1;
      }
    });
    
    return activityData;
  };
  
  const weeklyActivity = getWeeklyActivityData();

  useEffect(() => {
    setLiveTime(currentTask?.remaining || 0);
    if (currentTask && currentTask.isRunning) {
      const interval = setInterval(() => {
        setLiveTime((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentTask]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box
            sx={{ 
        minHeight: '100vh',
        background: themeMode === 'light' 
          ? 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ff 100%)' 
          : 'linear-gradient(135deg, #1a1f35 0%, #232946 100%)',
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1, sm: 2, md: 3 },
        overflowX: 'hidden'
      }}
    >
      <Container maxWidth="xl">
        {/* Hero Section */}
        <Paper
          elevation={3}
              sx={{ 
            borderRadius: 3,
            overflow: 'hidden',
            mb: { xs: 2, sm: 3, md: 4 },
            background: themeMode === 'light' 
              ? 'linear-gradient(90deg, #4776E6 0%, #8E54E9 100%)' 
              : 'linear-gradient(90deg, #3a4a7b 0%, #5d4a8a 100%)',
          }}
        >
          <Box sx={{ 
            p: { xs: 3, sm: 4, md: 5 },
            color: 'white',
          }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={7}>
            <Typography 
                  variant="h3" 
              sx={{ 
                    fontWeight: 800,
                    mb: 1,
                    fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
                    letterSpacing: '-0.5px',
                    textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                  }}
                >
                  Welcome, {user?.username || 'Artist'}!
            </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 400,
                    opacity: 0.9,
                    mb: 3,
                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' }
                  }}
                >
                  Track your progress, manage your practice sessions, and achieve your creative goals.
                </Typography>
              <Button
                variant="contained"
                  size="large"
                onClick={() => navigate('/practice')}
                sx={{ 
                    bgcolor: 'white',
                    color: '#4776E6',
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.9)',
                    },
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                  borderRadius: 2,
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                  Start Practice Session
              </Button>
        </Grid>
              <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
                <Box
            sx={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
              height: '100%',
                    position: 'relative'
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      width: 200,
                      height: 200,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: -10,
                        left: -10,
                        right: -10,
                        bottom: -10,
                        borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.2)',
                      }
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        border: '15px solid',
                        borderColor: 'rgba(255,255,255,0.15)',
                        borderTopColor: 'white',
                        animation: 'spin 10s linear infinite',
                        '@keyframes spin': {
                          '0%': {
                            transform: 'rotate(0deg)',
                          },
                          '100%': {
                            transform: 'rotate(360deg)',
                          },
                        },
                      }}
                    />
                    <Typography 
                      variant="h2" 
                      align="center"
                      sx={{ 
                        fontWeight: 800,
                        fontSize: '3.5rem',
                        color: 'white',
                        textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                      }}
                    >
                      {streakData.level}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      align="center"
                      sx={{ 
                        position: 'absolute',
                        bottom: 40,
                        fontWeight: 600,
                        opacity: 0.8
                      }}
                    >
                      Your Level
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Dashboard Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons={isMobile ? "auto" : false}
            centered={!isMobile}
          >
            <Tab 
              label="Overview" 
              icon={<InsertChartIcon />} 
              iconPosition="start"
              sx={{ fontWeight: 600, textTransform: 'none', fontSize: '0.95rem' }}
            />
            <Tab 
              label="Progress" 
              icon={<TrendingUpIcon />} 
              iconPosition="start"
              sx={{ fontWeight: 600, textTransform: 'none', fontSize: '0.95rem' }}
            />
            <Tab 
              label="Streaks & XP" 
              icon={<FireIcon />} 
              iconPosition="start"
              sx={{ fontWeight: 600, textTransform: 'none', fontSize: '0.95rem' }}
            />
            <Tab 
              label="Activity" 
              icon={<CalendarIcon />} 
              iconPosition="start"
              sx={{ fontWeight: 600, textTransform: 'none', fontSize: '0.95rem' }}
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {activeTab === 0 && (
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {/* Stats Cards Row */}
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Card elevation={2} sx={{ borderRadius: 2, height: '100%', position: 'relative', overflow: 'visible' }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ 
                        position: 'absolute', 
                        top: -15, 
                        left: 20, 
                        backgroundColor: '#ff9800',
                        borderRadius: '50%',
                        width: 40,
                        height: 40,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxShadow: '0 4px 10px rgba(255, 152, 0, 0.3)'
                      }}>
                        <AccessTimeIcon sx={{ color: 'white' }} />
                      </Box>
                      <Box sx={{ mt: 2, mb: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Total Practice
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                          {getHoursFromMinutes(totalPracticeMinutes)}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Lifetime practice time
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card elevation={2} sx={{ borderRadius: 2, height: '100%', position: 'relative', overflow: 'visible', borderLeft: streakExpiry.expired ? '3px solid #e91e63' : 'none' }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ 
                        position: 'absolute', 
                        top: -15, 
                        left: 20, 
                        backgroundColor: streakExpiry.expired ? '#9e9e9e' : 
                                           (streakExpiry.hoursLeft < 6 ? '#ff9800' : '#e91e63'),
                        borderRadius: '50%',
                        width: 40,
                        height: 40,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxShadow: '0 4px 10px rgba(233, 30, 99, 0.3)',
                        animation: streakExpiry.hoursLeft < 6 && !streakExpiry.expired ? 
                                   'pulse 2s infinite' : 'none',
                        '@keyframes pulse': {
                          '0%': { transform: 'scale(1)' },
                          '50%': { transform: 'scale(1.1)' },
                          '100%': { transform: 'scale(1)' }
                        }
                      }}>
                        <FireIcon sx={{ color: 'white' }} />
                      </Box>
                      <Box sx={{ mt: 2, mb: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Daily Streak
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                          {streakData.current} {streakData.current === 1 ? 'day' : 'days'}
                </Typography>
              </Box>
                      <Stack direction="column" spacing={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          Best: {streakData.best} {streakData.best === 1 ? 'day' : 'days'}
                        </Typography>
              <Typography 
                          variant="caption" 
                          color={streakExpiry.expired ? 'error.main' : 
                                 (streakExpiry.hoursLeft < 6 ? 'warning.main' : 'text.secondary')}
                          sx={{ 
                            fontWeight: streakExpiry.hoursLeft < 6 ? 'bold' : 'normal',
                            display: 'block'
                          }}
                        >
                          {streakExpiry.expiryText}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card elevation={2} sx={{ borderRadius: 2, height: '100%', position: 'relative', overflow: 'visible' }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ 
                        position: 'absolute', 
                        top: -15, 
                        left: 20, 
                        backgroundColor: '#4caf50',
                        borderRadius: '50%',
                        width: 40,
                        height: 40,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxShadow: '0 4px 10px rgba(76, 175, 80, 0.3)'
                      }}>
                        <AchievementIcon sx={{ color: 'white' }} />
                      </Box>
                      <Box sx={{ mt: 2, mb: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Sessions
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                          {completedTasks.length}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Completed practice sessions
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card elevation={2} sx={{ borderRadius: 2, height: '100%', position: 'relative', overflow: 'visible' }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ 
                        position: 'absolute', 
                        top: -15, 
                        left: 20, 
                        backgroundColor: '#3f51b5',
                        borderRadius: '50%',
                        width: 40,
                        height: 40,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxShadow: '0 4px 10px rgba(63, 81, 181, 0.3)'
                      }}>
                        <ImageIcon sx={{ color: 'white' }} />
                      </Box>
                      <Box sx={{ mt: 2, mb: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Uploads
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                          {photos.length}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Practice works captured
              </Typography>
            </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>

            {/* Current Activity and Level Progress */}
            <Grid item xs={12} md={8}>
              <Grid container spacing={3}>
                {/* Current Activity */}
                <Grid item xs={12}>
                  <Card elevation={2} sx={{ 
                    borderRadius: 2, 
                    background: currentTask 
                      ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.02) 100%)' 
                      : 'background.paper',
                    borderLeft: currentTask ? '4px solid #4caf50' : 'none'
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Current Activity
                      </Typography>
                      {currentTask ? (
                        <Box>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'flex-start',
                            mb: 2 
                          }}>
                            <Box>
                              <Typography variant="h6" fontWeight="bold">
                                {currentTask.label || currentTask.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                In progress
                              </Typography>
                            </Box>
                            <Chip
                              label={currentTask.isRunning ? 'Running' : 'Paused'}
                              color={currentTask.isRunning ? 'success' : 'default'}
                              size="small"
                              variant="outlined"
                              icon={<AccessTimeIcon />}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                            <TimerIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                            <Typography variant="body2" color="text.secondary">
                              Remaining Time: {formatTime(liveTime)}
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={((currentTask.duration - liveTime) / currentTask.duration) * 100}
                            sx={{ 
                              mb: 2, 
                              height: 6, 
                              borderRadius: 3,
                              bgcolor: 'rgba(0,0,0,0.05)'
                            }} 
                          />
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => navigate('/practice')}
                            endIcon={<ArrowForwardIcon />}
                            sx={{ mt: 1 }}
                          >
                            Resume Session
                          </Button>
                        </Box>
                      ) : (
                        <Box sx={{ py: 2 }}>
                          <Typography variant="body1" sx={{ mb: 2 }}>
                            No active practice session. Start one now to track your progress.
                          </Typography>
              <Button
                variant="contained"
                            color="primary"
                onClick={() => navigate('/practice')}
                            startIcon={<TimerIcon />}
              >
                            Start Practice
              </Button>
                        </Box>
                      )}
                    </CardContent>
          </Card>
        </Grid>

                {/* Level Progress */}
        <Grid item xs={12}>
                  <Card elevation={2} sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Progress to Level {streakData.level + 1}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
                        <Box sx={{ position: 'relative', display: 'inline-flex', mr: 3 }}>
                          <CircularProgress
                            variant="determinate"
                            value={streakData.progress}
                            size={80}
                            thickness={4}
                            sx={{
                              color: theme.palette.primary.main,
                              '& .MuiCircularProgress-circle': {
                                strokeLinecap: 'round',
                              },
                            }}
                          />
                          <Box
                sx={{ 
                              top: 0,
                              left: 0,
                              bottom: 0,
                              right: 0,
                              position: 'absolute',
                  display: 'flex',
                              alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography 
                  variant="h6" 
                              component="div"
                              color="text.primary"
                              sx={{ fontWeight: 'bold' }}
                            >
                              {`${streakData.progress}%`}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" color="text.primary" sx={{ mb: 0.5, fontWeight: 'medium' }}>
                            Level {streakData.level} • {streakData.xp} XP
                </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={streakData.progress}
                            sx={{ height: 8, borderRadius: 5 }}
                          />
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, textAlign: 'right' }}>
                            {streakData.xp} / {streakData.nextLevel} XP needed for next level
                </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>

            {/* Recent Activity */}
            <Grid item xs={12} md={4}>
              <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Recent Activity
                  </Typography>
                  
                  {recentCompletedTasks.length > 0 ? (
                    <Stack spacing={2} sx={{ mt: 1, flexGrow: 1 }}>
                      {recentCompletedTasks.map((task) => (
                        <Box
                          key={task.id}
                sx={{ 
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: 'background.default',
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold" noWrap sx={{ maxWidth: '70%' }}>
                              {task.label || task.name}
                            </Typography>
                            <Chip
                              label={`${Math.floor(task.duration / 60)} min`}
                              size="small"
                              variant="outlined"
                              sx={{ height: 24 }}
                            />
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {formatDate(task.completedAt)}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Box sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                      alignItems: 'center', 
                  justifyContent: 'center',
                      flexGrow: 1,
                      py: 4
                    }}>
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
                        No completed activities yet.
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate('/practice')}
                      >
                        Start Practice
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Upcoming Practice Sessions */}
            <Grid item xs={12}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">
                      Upcoming Practice Sessions
                    </Typography>
                    <Button
                      variant="text"
                  color="primary"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigate('/practice')}
                      sx={{ textTransform: 'none' }}
                    >
                      View All
                    </Button>
                  </Box>
                  
                  {tasks.length > 0 ? (
                    <Grid container spacing={2}>
                      {tasks.slice(0, 3).map((task) => (
                        <Grid item xs={12} sm={6} md={4} key={task.id}>
                          <Box
                  sx={{ 
                              p: 2,
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'divider',
                              '&:hover': {
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                borderColor: 'primary.main',
                              },
                              transition: 'all 0.3s ease',
                            }}
                          >
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                              {task.label || task.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                              <AccessTimeIcon sx={{ color: 'text.secondary', fontSize: 18, mr: 0.5 }} />
                              <Typography variant="body2" color="text.secondary">
                                {Math.floor(task.duration / 60)} minutes
                              </Typography>
                            </Box>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => navigate('/practice')}
                              sx={{ mt: 1 }}
                            >
                              Start
                            </Button>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        No upcoming practice sessions scheduled.
                </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('/practice')}
                        startIcon={<TimerIcon />}
                        size="small"
                      >
                        Create Practice Session
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {activeTab === 1 && (
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {/* Progress Tab Content */}
            <Grid item xs={12} md={6}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Skill Progress
                  </Typography>
                  {/* Placeholder for skill progress chart */}
                  <Box sx={{ 
                    height: 250, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: 'background.default',
                    borderRadius: 2,
                    my: 2
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      Skill progression visualization will appear here
                </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Session Completion Rate
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    flexDirection: 'column',
                    py: 4
                  }}>
                    <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                      <CircularProgress
                        variant="determinate"
                        value={completionRate}
                        size={120}
                        thickness={6}
                        sx={{
                          color: completionRate >= 75 ? 'success.main' : 
                                 completionRate >= 50 ? 'warning.main' : 'error.main',
                        }}
                      />
                      <Box
                sx={{ 
                          top: 0,
                          left: 0,
                          bottom: 0,
                          right: 0,
                          position: 'absolute',
                  display: 'flex',
                          alignItems: 'center',
                  justifyContent: 'center',
                          flexDirection: 'column'
                }}
              >
                <Typography 
                          variant="h4"
                          component="div"
                          sx={{ fontWeight: 'bold' }}
                        >
                          {completionRate}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Completion
                </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" align="center" sx={{ maxWidth: 250 }}>
                      You've completed {completedTasks.length} out of {completedTasks.length + tasks.length} total
                      practice sessions
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {activeTab === 2 && (
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {/* Streaks & XP Tab Content */}
            <Grid item xs={12} md={6}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Daily Streak System
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: '#e91e63',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2
                      }}>
                        <FireIcon sx={{ color: 'white' }} />
                      </Box>
                      <Box>
                        <Typography variant="h5" fontWeight="bold">
                          {streakData.current} Day Streak
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {streakExpiry.expired ? (
                            "Your streak has expired! Upload a new image to start again."
                          ) : (
                            `Expires in ${Math.floor(streakExpiry.hoursLeft)} hours and ${Math.floor((streakExpiry.hoursLeft % 1) * 60)} minutes`
                          )}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 3 }} />
                    
                    <Typography variant="h6" fontWeight="medium" gutterBottom>
                      How Streaks Work
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" paragraph>
                        <strong>1. Start your streak</strong> by uploading a photo of your practice work.
                      </Typography>
                      
                      <Typography variant="body2" paragraph>
                        <strong>2. Maintain your streak</strong> by uploading at least one photo every 30 hours.
                        If you don't upload within 30 hours, your streak will reset to 0.
                      </Typography>
                      
                      <Typography variant="body2" paragraph>
                        <strong>3. Earn bonus XP</strong> as your streak grows longer:
                      </Typography>
                      
                      <Box sx={{ pl: 2, mb: 2 }}>
                        <Typography variant="body2">• 1-2 days: +10 XP per photo</Typography>
                        <Typography variant="body2">• 3-6 days: +25 XP per photo</Typography>
                        <Typography variant="body2">• 7+ days: +50 XP per photo</Typography>
                      </Box>
                      
                      <Typography variant="body2" sx={{ 
                        fontWeight: 'bold',
                        color: 'warning.main'
                      }}>
                        Don't break your streak! Keep practicing and uploading photos daily.
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
        </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    XP & Levels
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, mt: 2 }}>
                    <Avatar
            sx={{ 
                        width: 64, 
                        height: 64, 
                        bgcolor: 'primary.main', 
                        color: 'white',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                        mr: 3
                      }}
                    >
                      {streakData.level}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h5" fontWeight="bold" gutterBottom>
                        Level {streakData.level}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={streakData.progress} 
                        sx={{ height: 8, borderRadius: 2 }}
                      />
                      <Typography variant="caption" align="right" sx={{ display: 'block', mt: 0.5 }}>
                        {streakData.xp} / {streakData.nextLevel} XP
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 3 }} />
                  
                  <Typography variant="h6" fontWeight="medium" gutterBottom>
                    Ways to Earn XP
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <AchievementIcon sx={{ color: 'success.main', mr: 1.5, mt: 0.5 }} />
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            Complete Practice Sessions
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Earn 1 XP for every 5 minutes of practice time.
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <ImageIcon sx={{ color: 'info.main', mr: 1.5, mt: 0.5 }} />
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            Upload Practice Photos
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Earn 10-50 XP per photo depending on your streak length.
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <FireIcon sx={{ color: 'error.main', mr: 1.5, mt: 0.5 }} />
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            Maintain Daily Streaks
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Keep your streak going to multiply your XP rewards.
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {activeTab === 3 && (
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {/* Activity Tab Content */}
            <Grid item xs={12}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Weekly Activity
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    my: 3,
                    height: 200, 
                    alignItems: 'flex-end' 
                  }}>
                    {weeklyActivity.map((day, index) => (
                      <Box key={index} sx={{ textAlign: 'center', width: `${100 / 7}%` }}>
                        <Box sx={{ 
                          height: day.minutes * 1.5,
                          maxHeight: 150,
                          width: '60%',
                          margin: '0 auto',
                          bgcolor: 'primary.main',
                          borderRadius: '4px 4px 0 0',
                          position: 'relative',
                          minHeight: 5,
                          opacity: day.minutes > 0 ? 1 : 0.3,
                        }}>
                          {day.completed > 0 && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: -10,
                                right: -10,
                                bgcolor: 'success.main',
                                color: 'white',
                                borderRadius: '50%',
                                width: 20,
                                height: 20,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                              }}
                            >
                              {day.completed}
                            </Box>
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          {day.day}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 12, height: 12, bgcolor: 'primary.main', borderRadius: 1, mr: 1 }} />
                      <Typography variant="caption" color="text.secondary">Practice Minutes</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        bgcolor: 'success.main', 
                        borderRadius: '50%', 
                        mr: 1 
                      }}></Box>
                      <Typography variant="caption" color="text.secondary">Completed Sessions</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
    </Container>
    </Box>
  );
};

export default Dashboard; 