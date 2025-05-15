import React from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  LocalFireDepartment as FireIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';

const achievements = [
  {
    id: 1,
    title: 'First Steps',
    description: 'Complete your first practice session',
    icon: <StarIcon sx={{ fontSize: 40 }} />,
    xp: 100,
  },
  {
    id: 2,
    title: 'Streak Master',
    description: 'Maintain a 7-day streak',
    icon: <FireIcon sx={{ fontSize: 40 }} />,
    xp: 500,
  },
  {
    id: 3,
    title: 'Consistency King',
    description: 'Complete 30 practice sessions',
    icon: <TimelineIcon sx={{ fontSize: 40 }} />,
    xp: 1000,
  },
  {
    id: 4,
    title: 'Grand Master',
    description: 'Reach the highest level',
    icon: <TrophyIcon sx={{ fontSize: 40 }} />,
    xp: 5000,
  },
];

const Achievements = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Level Progress */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Your Progress
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Current Level: {user?.level || 'White Badge'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={70}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
                <Box sx={{ minWidth: 35 }}>
                  <Typography variant="body2" color="text.secondary">
                    {`${70}%`}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {user?.xp || 0} / 1000 XP to next level
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Achievements List */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>
            Available Achievements
          </Typography>
        </Grid>
        {achievements.map((achievement) => (
          <Grid item xs={12} sm={6} md={3} key={achievement.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                opacity: 0.7,
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                  }}
                >
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {achievement.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {achievement.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {achievement.description}
                  </Typography>
                  <Typography variant="body2" color="primary">
                    +{achievement.xp} XP
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Recent Achievements */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Achievements
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No recent achievements to show
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Achievements; 