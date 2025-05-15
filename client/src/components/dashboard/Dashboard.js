import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Timer as TimerIcon,
  Camera as CameraIcon,
  BarChart as BarChartIcon,
  Group as GroupIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const currentTask = useSelector((state) => state.practice.currentTask);
  const navigate = useNavigate();
  const [liveTime, setLiveTime] = useState(currentTask?.remaining || 0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Helper to format seconds as mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    setLiveTime(currentTask?.remaining || 0);
    if (currentTask && currentTask.isRunning) {
      const interval = setInterval(() => {
        setLiveTime((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentTask]);

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 3, md: 4 }, mb: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 } }}>
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Welcome Section */}
        <Grid item xs={12}>
          <Paper 
            elevation={2}
            sx={{ 
              p: { xs: 2, sm: 3 }, 
              display: 'flex', 
              flexDirection: 'column',
              borderRadius: { xs: 2, sm: 3 },
              mb: { xs: 1, sm: 0 }
            }}
          >
            <Typography 
              variant={isMobile ? "h5" : "h4"} 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' }
              }}
            >
              Welcome back, {user?.username}!
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              Continue your journey to mastery
            </Typography>
          </Paper>
        </Grid>

        {/* Current Activity Section */}
        <Grid item xs={12} md={6}>
          <Card 
            elevation={2}
            sx={{ 
              bgcolor: currentTask ? 'rgba(76, 175, 80, 0.08)' : 'background.paper',
              borderRadius: { xs: 2, sm: 3 },
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TimerIcon color={currentTask ? 'success' : 'primary'} sx={{ mr: 1, fontSize: { xs: 20, sm: 24 } }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 'bold',
                    fontSize: { xs: '1.1rem', sm: '1.25rem' } 
                  }}
                >
                  Current Activity
                </Typography>
              </Box>
              {currentTask ? (
                <>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {currentTask.label}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TimerIcon fontSize="small" color="success" sx={{ mr: 1, opacity: 0.7 }} />
                    <Typography variant="body2" color="text.secondary">
                      Time Left: <Box component="span" sx={{ fontWeight: 'bold' }}>{formatTime(liveTime)}</Box>
                    </Typography>
                  </Box>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  No activity running. Start a practice session!
                </Typography>
              )}
            </CardContent>
            <CardActions sx={{ p: 2, pt: 0 }}>
              <Button
                variant="contained"
                color="primary"
                size={isMobile ? "small" : "medium"}
                fullWidth
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/practice')}
                sx={{ 
                  borderRadius: 2,
                  py: { xs: 0.75, sm: 1 }
                }}
              >
                Go to Practice
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card 
            elevation={2}
            sx={{ 
              borderRadius: { xs: 2, sm: 3 },
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TimerIcon color="primary" sx={{ mr: 1, fontSize: { xs: 20, sm: 24 } }} />
                <Typography 
                  variant="h6"
                  sx={{ 
                    fontWeight: 'bold',
                    fontSize: { xs: '1.1rem', sm: '1.25rem' } 
                  }}
                >
                  Start Practice
                </Typography>
              </Box>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                paragraph
                sx={{ mb: { xs: 1, sm: 2 } }}
              >
                Begin a new practice session and track your progress
              </Typography>
            </CardContent>
            <CardActions sx={{ p: 2, pt: 0 }}>
              <Button
                variant="contained"
                fullWidth
                size={isMobile ? "small" : "medium"}
                onClick={() => navigate('/practice')}
                sx={{ 
                  borderRadius: 2,
                  py: { xs: 0.75, sm: 1 }
                }}
              >
                Start Session
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Stats Overview */}
        <Grid item xs={12}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={4}>
              <Paper 
                elevation={2}
                sx={{ 
                  p: { xs: 1.5, sm: 2 }, 
                  textAlign: 'center',
                  borderRadius: { xs: 2, sm: 3 },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Typography 
                  variant="h6" 
                  color="primary"
                  sx={{ 
                    fontWeight: 'bold',
                    fontSize: { xs: '1.2rem', sm: '1.5rem' } 
                  }}
                >
                  {user?.streaks?.current || 0}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    mt: 0.5
                  }}
                >
                  Current Streak
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper 
                elevation={2}
                sx={{ 
                  p: { xs: 1.5, sm: 2 }, 
                  textAlign: 'center',
                  borderRadius: { xs: 2, sm: 3 },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Typography 
                  variant="h6" 
                  color="primary"
                  sx={{ 
                    fontWeight: 'bold',
                    fontSize: { xs: '1.2rem', sm: '1.5rem' } 
                  }}
                >
                  {user?.xp || 0}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    mt: 0.5
                  }}
                >
                  Total XP
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper 
                elevation={2}
                sx={{ 
                  p: { xs: 1.5, sm: 2 }, 
                  textAlign: 'center',
                  borderRadius: { xs: 2, sm: 3 },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Typography 
                  variant="h6" 
                  color="primary"
                  sx={{ 
                    fontWeight: 'bold',
                    fontSize: { xs: '1.2rem', sm: '1.5rem' } 
                  }}
                >
                  {user?.level || 1}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    mt: 0.5
                  }}
                >
                  Current Level
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Paper 
            elevation={2}
            sx={{ 
              p: { xs: 2, sm: 3 },
              borderRadius: { xs: 2, sm: 3 }
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                mb: 2,
                display: 'flex',
                alignItems: 'center' 
              }}
            >
              <BarChartIcon sx={{ mr: 1, fontSize: { xs: 20, sm: 24 } }} />
              Recent Activity
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No recent activity to show
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 