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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Timer as TimerIcon,
  Camera as CameraIcon,
  BarChart as BarChartIcon,
  Group as GroupIcon,
} from '@mui/icons-material';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const currentTask = useSelector((state) => state.practice.currentTask);
  const navigate = useNavigate();
  const [liveTime, setLiveTime] = useState(currentTask?.remaining || 0);

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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Welcome Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h4" gutterBottom>
              Welcome back, {user?.username}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Continue your journey to mastery
            </Typography>
          </Paper>
        </Grid>

        {/* Current Activity Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: currentTask ? 'success.lighter' : 'background.paper' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TimerIcon color={currentTask ? 'success' : 'primary'} sx={{ mr: 1 }} />
                <Typography variant="h6">Current Activity</Typography>
              </Box>
              {currentTask ? (
                <>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {currentTask.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Time Left: {formatTime(liveTime)}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/practice')}
                  >
                    Go to Practice
                  </Button>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No activity running. Start a practice session!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TimerIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Start Practice</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Begin a new practice session and track your progress
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate('/practice')}
              >
                Start Session
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Stats Overview */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                {user?.streaks?.current || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current Streak
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                {user?.xp || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total XP
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                {user?.level || 'White Badge'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current Level
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} sx={{ mt: 2 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No recent activity to show
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 