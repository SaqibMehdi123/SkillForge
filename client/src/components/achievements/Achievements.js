import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Divider,
  Avatar,
  Tooltip,
  useTheme,
  Badge,
  CircularProgress,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  LocalFireDepartment as FireIcon,
  Timeline as TimelineIcon,
  Image as ImageIcon,
  AccessTime as TimeIcon,
  Celebration as CelebrationIcon,
  WorkspacePremium as PremiumIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { addBadge, addXP } from '../../features/auth/authSlice';

// API URL for backend requests
const API_URL = 'http://localhost:5000/api';

// The achievements array with streak-related achievements
const achievementsList = [
  {
    id: 'first_steps',
    title: 'First Steps',
    description: 'Complete your first practice session',
    icon: <StarIcon sx={{ fontSize: 40 }} />,
    xp: 100,
    type: 'session',
    requirement: 1,
    color: '#4caf50', // Green
  },
  {
    id: 'streak_starter',
    title: 'Streak Starter',
    description: 'Maintain a 3-day streak',
    icon: <FireIcon sx={{ fontSize: 40 }} />,
    xp: 150,
    type: 'streak',
    requirement: 3,
    color: '#ff9800', // Orange
  },
  {
    id: 'streak_warrior',
    title: 'Streak Warrior',
    description: 'Maintain a 7-day streak',
    icon: <FireIcon sx={{ fontSize: 40 }} />,
    xp: 350,
    type: 'streak',
    requirement: 7,
    color: '#e91e63', // Pink
  },
  {
    id: 'streak_master',
    title: 'Streak Master',
    description: 'Maintain a 30-day streak',
    icon: <FireIcon sx={{ fontSize: 40 }} />,
    xp: 1000,
    type: 'streak',
    requirement: 30,
    color: '#f44336', // Red
  },
  {
    id: 'consistency_king',
    title: 'Consistency King',
    description: 'Complete 30 practice sessions',
    icon: <TimelineIcon sx={{ fontSize: 40 }} />,
    xp: 500,
    type: 'session',
    requirement: 30,
    color: '#2196f3', // Blue
  },
  {
    id: 'picture_perfect',
    title: 'Picture Perfect',
    description: 'Upload 10 practice photos',
    icon: <ImageIcon sx={{ fontSize: 40 }} />,
    xp: 250,
    type: 'photo',
    requirement: 10,
    color: '#9c27b0', // Purple
  },
  {
    id: 'time_wizard',
    title: 'Time Wizard',
    description: 'Accumulate 24 hours of practice time',
    icon: <TimeIcon sx={{ fontSize: 40 }} />,
    xp: 500,
    type: 'time',
    requirement: 1440, // in minutes (24 hours)
    color: '#00bcd4', // Cyan
  },
  {
    id: 'grand_master',
    title: 'Grand Master',
    description: 'Reach level 10',
    icon: <TrophyIcon sx={{ fontSize: 40 }} />,
    xp: 1500,
    type: 'level',
    requirement: 10,
    color: '#ffc107', // Amber
  },
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Complete a practice session before 9 AM',
    icon: <TimeIcon sx={{ fontSize: 40 }} />,
    xp: 150,
    type: 'session',
    requirement: 1,
    color: '#ffeb3b', // Yellow
  },
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Complete a practice session after 10 PM',
    icon: <TimeIcon sx={{ fontSize: 40 }} />,
    xp: 150,
    type: 'session',
    requirement: 1,
    color: '#3f51b5', // Indigo
  },
  {
    id: 'weekend_warrior',
    title: 'Weekend Warrior',
    description: 'Complete sessions on both Saturday and Sunday',
    icon: <TimelineIcon sx={{ fontSize: 40 }} />,
    xp: 200,
    type: 'session',
    requirement: 2,
    color: '#009688', // Teal
  },
  {
    id: 'photography_novice',
    title: 'Photography Novice',
    description: 'Upload your first practice photo',
    icon: <ImageIcon sx={{ fontSize: 40 }} />,
    xp: 100,
    type: 'photo',
    requirement: 1,
    color: '#673ab7', // Deep Purple
  },
  {
    id: 'photography_enthusiast',
    title: 'Photography Enthusiast',
    description: 'Upload 25 practice photos',
    icon: <ImageIcon sx={{ fontSize: 40 }} />,
    xp: 350,
    type: 'photo',
    requirement: 25,
    color: '#8e24aa', // Purple darken-1
  },
  {
    id: 'photography_pro',
    title: 'Photography Pro',
    description: 'Upload 50 practice photos',
    icon: <ImageIcon sx={{ fontSize: 40 }} />,
    xp: 500,
    type: 'photo',
    requirement: 50,
    color: '#6a1b9a', // Purple darken-3
  },
  {
    id: 'first_hour',
    title: 'First Hour',
    description: 'Accumulate 1 hour of practice time',
    icon: <TimeIcon sx={{ fontSize: 40 }} />,
    xp: 100,
    type: 'time',
    requirement: 60, // in minutes
    color: '#00acc1', // Cyan darken-1
  },
  {
    id: 'half_day',
    title: 'Half Day',
    description: 'Accumulate 12 hours of practice time',
    icon: <TimeIcon sx={{ fontSize: 40 }} />,
    xp: 300,
    type: 'time',
    requirement: 720, // in minutes
    color: '#0097a7', // Cyan darken-2
  },
  {
    id: 'centurion',
    title: 'Centurion',
    description: 'Complete 100 practice sessions',
    icon: <TimelineIcon sx={{ fontSize: 40 }} />,
    xp: 1000,
    type: 'session',
    requirement: 100,
    color: '#1976d2', // Blue darken-2
  },
  {
    id: 'level_5',
    title: 'Halfway There',
    description: 'Reach level 5',
    icon: <TrophyIcon sx={{ fontSize: 40 }} />,
    xp: 500,
    type: 'level',
    requirement: 5,
    color: '#ffa000', // Amber darken-2
  },
  {
    id: 'elite_status',
    title: 'Elite Status',
    description: 'Reach level 20',
    icon: <TrophyIcon sx={{ fontSize: 40 }} />,
    xp: 2500,
    type: 'level',
    requirement: 20,
    color: '#ff6f00', // Amber darken-4
  },
];

const Achievements = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { user = {} } = useSelector((state) => state.auth);
  const { completedTasks = [], photos = [] } = useSelector((state) => state.practice) || { completedTasks: [], photos: [] };
  const [earnedAchievements, setEarnedAchievements] = useState([]);
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0); // 0 = All, 1 = Unlocked

  // Calculate total practice time in minutes
  const totalPracticeMinutes = Array.isArray(completedTasks) ? completedTasks.reduce(
    (total, task) => total + Math.floor(((task && task.duration) || 0) / 60), 
    0
  ) : 0;

  // Fetch achievements from the server
  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        
        const response = await axios.get(`${API_URL}/achievements/me`, config);
        
        // Map server achievements to our format
        const serverAchievements = response.data.map(achievement => ({
          id: achievement.badgeId,
          title: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          earnedAt: achievement.dateUnlocked || achievement.createdAt,
          xp: getXpForBadge(achievement.badgeId),
          color: getColorForType(achievement.type),
        }));
        
        setEarnedAchievements(serverAchievements);
        
        // Get recent achievements (last 3)
        const recentOnes = [...serverAchievements]
          .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
          .slice(0, 3);
        setRecentAchievements(recentOnes);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching achievements:', error);
        setError('Failed to load achievements. Please try again later.');
        
        // Fallback to localStorage if server fails
        const savedAchievements = JSON.parse(localStorage.getItem('earnedAchievements') || '[]');
        setEarnedAchievements(savedAchievements);
        
        const recentOnes = [...savedAchievements]
          .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
          .slice(0, 3);
        setRecentAchievements(recentOnes);
        
        setLoading(false);
      }
    };
    
    fetchAchievements();
  }, []);

  // Check for new achievements when user stats change
  useEffect(() => {
    const checkForNewAchievements = async () => {
      try {
        // Skip achievement checks if still loading existing achievements
        if (loading) return;
        
        // Get stats for checking achievements
        const stats = {
          streak: user?.streaks?.current || 0,
          bestStreak: user?.streaks?.best || 0,
          sessions: completedTasks.length,
          level: user?.level || 1,
          photos: photos.length,
          minutes: totalPracticeMinutes,
        };
        
        // Find achievements that should be earned but aren't in our state
        const newlyEarnedAchievements = [];
        
        achievementsList.forEach(achievement => {
          // Skip if already earned
          if (earnedAchievements.some(earned => earned.id === achievement.id)) {
            return;
          }
          
          // Check if achievement requirements are met
          let earned = false;
          switch (achievement.type) {
            case 'streak':
              earned = stats.streak >= achievement.requirement || stats.bestStreak >= achievement.requirement;
              break;
            case 'session':
              earned = stats.sessions >= achievement.requirement;
              break;
            case 'level':
              earned = stats.level >= achievement.requirement;
              break;
            case 'photo':
              earned = stats.photos >= achievement.requirement;
              break;
            case 'time':
              earned = stats.minutes >= achievement.requirement;
              break;
            default:
              break;
          }
          
          if (earned) {
            newlyEarnedAchievements.push(achievement);
          }
        });
        
        // If there are newly earned achievements, save them to the server
        if (newlyEarnedAchievements.length > 0) {
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('No authentication token found');
          }
          
          const config = {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          };
          
          // Save each achievement to the server
          for (const achievement of newlyEarnedAchievements) {
            try {
              const response = await axios.post(
                `${API_URL}/achievements`,
                {
                  type: achievement.type,
                  name: achievement.title,
                  description: achievement.description,
                  icon: achievement.type,
                  badgeId: achievement.id,
                  xpReward: achievement.xp
                },
                config
              );
              
              // Add the newly earned achievement to the state
              const newAchievement = {
                ...achievement,
                earnedAt: new Date().toISOString()
              };
              
              setEarnedAchievements(prev => [...prev, newAchievement]);
              setRecentAchievements(prev => {
                const updated = [newAchievement, ...prev].slice(0, 3);
                return updated;
              });
            } catch (error) {
              console.error(`Error saving achievement ${achievement.id}:`, error);
            }
          }
        }
      } catch (error) {
        console.error('Error checking for new achievements:', error);
      }
    };
    
    checkForNewAchievements();
  }, [user, completedTasks.length, photos.length, totalPracticeMinutes, loading, earnedAchievements]);

  // Get progress for an achievement
  const getAchievementProgress = (achievement) => {
    if (!achievement) return { current: 0, required: 1, percentage: 0 };

    const stats = {
      streak: user?.streaks?.current || 0,
      bestStreak: user?.streaks?.best || 0,
      sessions: Array.isArray(completedTasks) ? completedTasks.length : 0,
      level: user?.level || 1,
      photos: Array.isArray(photos) ? photos.length : 0,
      minutes: totalPracticeMinutes || 0,
    };

    let current = 0;
    switch (achievement.type) {
      case 'streak':
        current = Math.max(stats.streak, stats.bestStreak);
        break;
      case 'session':
        current = stats.sessions;
        break;
      case 'level':
        current = stats.level;
        break;
      case 'photo':
        current = stats.photos;
        break;
      case 'time':
        current = stats.minutes;
        break;
      default:
        break;
    }

    return {
      current,
      required: achievement.requirement || 1,
      percentage: Math.min(100, Math.round((current / (achievement.requirement || 1)) * 100)),
    };
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

  // For next level calculation
  const nextLevelXP = (user?.level || 1) * 100;
  const xpProgress = Math.min(100, Math.round(((user?.xp || 0) / nextLevelXP) * 100));

  // Helper function to get icon by achievement type
  const getIconByType = (type) => {
    switch (type) {
      case 'streak':
        return <FireIcon sx={{ fontSize: 40 }} />;
      case 'session':
        return <TimelineIcon sx={{ fontSize: 40 }} />;
      case 'level':
        return <TrophyIcon sx={{ fontSize: 40 }} />;
      case 'photo':
        return <ImageIcon sx={{ fontSize: 40 }} />;
      case 'time':
        return <TimeIcon sx={{ fontSize: 40 }} />;
      default:
        return <StarIcon sx={{ fontSize: 40 }} />;
    }
  };

  // Helper function to get color for achievement type
  const getColorForType = (type) => {
    switch (type) {
      case 'streak':
        return '#ff9800';
      case 'session':
        return '#2196f3';
      case 'level':
        return '#ffc107';
      case 'photo':
        return '#9c27b0';
      case 'time':
        return '#00bcd4';
      default:
        return '#4caf50';
    }
  };

  // Helper function to get XP for a badge ID
  const getXpForBadge = (badgeId) => {
    if (!badgeId) return 100;
    const achievement = achievementsList.find(a => a.id === badgeId);
    return achievement ? achievement.xp : 100;
  };

  // Fix icon rendering from string to component
  const renderAchievementIcon = (achievement) => {
    if (!achievement) return <StarIcon sx={{ fontSize: 40 }} />;
    
    // If the achievement already has an icon component, use it
    if (React.isValidElement(achievement.icon)) {
      return achievement.icon;
    }
    
    // Otherwise, use the string icon type to get the appropriate icon component
    return getIconByType(achievement.icon);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography>{error}</Typography>
        </Paper>
      )}
      <Grid container spacing={3}>
        {/* Level Progress */}
        <Grid item xs={12}>
          <Paper sx={{ 
            p: 3, 
            borderRadius: 2,
            boxShadow: 'rgba(99, 99, 99, 0.1) 0px 2px 8px 0px',
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(to right, rgba(55, 65, 81, 0.9), rgba(17, 24, 39, 0.9))'
              : 'linear-gradient(to right, #f9fafb, #f3f4f6)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Avatar 
                sx={{ 
                  width: 64, 
                  height: 64, 
                  bgcolor: theme.palette.primary.main,
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  fontSize: '2rem',
                  fontWeight: 'bold'
                }}
              >
                {user?.level || 1}
              </Avatar>
              
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h5" gutterBottom>
                  Your Level Progress
                </Typography>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={xpProgress}
                    sx={{ 
                      height: 12, 
                      borderRadius: 6,
                      mb: 1,
                      background: theme.palette.mode === 'dark' 
                        ? 'rgba(255,255,255,0.1)' 
                        : 'rgba(0,0,0,0.05)',
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Level {user?.level || 1}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.xp || 0} / {nextLevelXP} XP
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              <Chip 
                icon={<FireIcon />} 
                label={`${user?.streaks?.current || 0} Day Streak`} 
                color="error" 
                variant="outlined" 
              />
              <Chip 
                icon={<TrophyIcon />} 
                label={`${earnedAchievements?.length || 0} Achievements`} 
                color="primary" 
                variant="outlined" 
              />
              <Chip 
                icon={<TimelineIcon />} 
                label={`${Array.isArray(completedTasks) ? completedTasks.length : 0} Sessions`} 
                color="success" 
                variant="outlined" 
              />
            </Box>
          </Paper>
        </Grid>

        {/* Recent Achievements */}
        {Array.isArray(recentAchievements) && recentAchievements.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ 
              p: 3, 
              borderRadius: 2,
              boxShadow: 'rgba(99, 99, 99, 0.1) 0px 2px 8px 0px',
            }}>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <CelebrationIcon sx={{ mr: 1 }} />
                Recent Achievements
              </Typography>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                {recentAchievements.map((achievement) => (
                  <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                    <Card 
                      sx={{
                        height: '100%',
                        border: `1px solid ${theme.palette.divider}`,
                        borderLeft: `4px solid ${achievement.color}`,
                        borderRadius: 2,
                        boxShadow: 'rgba(99, 99, 99, 0.1) 0px 2px 8px 0px',
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 'rgba(0, 0, 0, 0.1) 0px 4px 12px'
                        }
                      }}
                    >
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                          }}
                        >
                          <Avatar 
                            sx={{ 
                              bgcolor: achievement.color,
                              mr: 2
                            }}
                          >
                            {renderAchievementIcon(achievement)}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" gutterBottom>
                              {achievement.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {achievement.description}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                              <Chip 
                                label={`+${achievement.xp} XP`} 
                                size="small" 
                                color="primary" 
                                variant="outlined" 
                              />
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(achievement.earnedAt)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* Achievement Tabs */}
        <Grid item xs={12}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2,
            mt: 2
          }}>
            <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
              <PremiumIcon sx={{ mr: 1 }} />
              Achievements
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip 
                label="All Achievements" 
                color={activeTab === 0 ? "primary" : "default"}
                variant={activeTab === 0 ? "filled" : "outlined"}
                onClick={() => setActiveTab(0)}
                sx={{ fontWeight: activeTab === 0 ? 'bold' : 'normal' }}
              />
              <Chip 
                label={`Unlocked (${earnedAchievements?.length || 0})`} 
                color={activeTab === 1 ? "primary" : "default"}
                variant={activeTab === 1 ? "filled" : "outlined"}
                onClick={() => setActiveTab(1)}
                sx={{ fontWeight: activeTab === 1 ? 'bold' : 'normal' }}
              />
            </Box>
          </Box>
        </Grid>

        {/* Filtered Achievements List */}
        {(activeTab === 0 ? (Array.isArray(achievementsList) ? achievementsList : []) : (Array.isArray(earnedAchievements) ? earnedAchievements : [])).map((achievement) => {
          if (!achievement) return null;
          const isEarned = Array.isArray(earnedAchievements) && earnedAchievements.some(a => a && a.id === achievement.id);
          const progress = getAchievementProgress(achievement);
          
          if (activeTab === 1 && !isEarned) return null; // Skip non-earned achievements when on Unlocked tab
          
          return (
            <Grid item xs={12} sm={6} md={3} key={achievement.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  opacity: isEarned ? 1 : 0.8,
                  filter: isEarned ? 'none' : 'grayscale(40%)',
                  borderRadius: 2,
                  boxShadow: isEarned 
                    ? `0 4px 8px ${achievement.color}40`
                    : 'rgba(99, 99, 99, 0.1) 0px 2px 8px 0px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: isEarned 
                      ? `0 6px 12px ${achievement.color}60`
                      : 'rgba(0, 0, 0, 0.1) 0px 4px 12px'
                  }
                }}
              >
                {isEarned && (
                  <Badge
                    sx={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: achievement.color,
                      color: '#fff',
                      borderRadius: '50%',
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                  >
                    ✓
                  </Badge>
                )}

                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <Box 
                      sx={{ 
                        color: isEarned ? achievement.color : 'text.secondary',
                        mb: 2,
                        p: 1,
                        borderRadius: '50%',
                        background: isEarned 
                          ? `${achievement.color}15`
                          : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        boxShadow: isEarned ? `0 0 8px ${achievement.color}30` : 'none'
                      }}
                    >
                      {isEarned 
                        ? renderAchievementIcon(achievement)
                        : <Tooltip title="Not yet earned">
                            <Box sx={{ position: 'relative' }}>
                              {renderAchievementIcon(achievement)}
                              <LockIcon 
                                sx={{ 
                                  position: 'absolute', 
                                  bottom: -5, 
                                  right: -5, 
                                  fontSize: 16, 
                                  color: 'text.secondary',
                                  bgcolor: theme.palette.background.paper,
                                  borderRadius: '50%',
                                }}
                              />
                            </Box>
                          </Tooltip>
                      }
                    </Box>
                    <Typography 
                      variant="h6" 
                      gutterBottom
                      sx={{ 
                        color: isEarned ? achievement.color : 'text.primary'
                      }}
                    >
                      {achievement.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {achievement.description}
                    </Typography>
                    <Chip 
                      label={`+${achievement.xp} XP`} 
                      size="small" 
                      color={isEarned ? "success" : "default"} 
                      variant={isEarned ? "filled" : "outlined"} 
                      sx={{ mb: 2 }}
                    />
                    
                    {!isEarned && activeTab === 0 && (
                      <Box sx={{ width: '100%', mt: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            Progress
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {progress.current}/{progress.required}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={progress.percentage}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
};

export default Achievements; 