import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Grid,
  Box,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Timer as TimerIcon,
  EmojiEvents as EmojiEventsIcon,
  People as PeopleIcon,
  Camera as CameraIcon,
} from '@mui/icons-material';

const features = [
  {
    icon: <TimerIcon sx={{ fontSize: 40 }} />,
    title: 'Timed Practice Sessions',
    description: 'Track your progress with structured practice sessions and build consistent habits.',
  },
  {
    icon: <CameraIcon sx={{ fontSize: 40 }} />,
    title: 'Progress Photos',
    description: 'Capture your journey with daily progress photos and create amazing timelapses.',
  },
  {
    icon: <EmojiEventsIcon sx={{ fontSize: 40 }} />,
    title: 'Achievements & Badges',
    description: 'Earn badges and level up as you progress from rookie to grand master.',
  },
  {
    icon: <PeopleIcon sx={{ fontSize: 40 }} />,
    title: 'Social Network',
    description: 'Connect with friends, share progress, and stay motivated together.',
  },
];

const Home = () => {
  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" gutterBottom>
            Master Your Skills with SkillForge
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom>
            The gamified platform that makes skill development fun and social
          </Typography>
          <Button
            component={RouterLink}
            to="/register"
            variant="contained"
            color="secondary"
            size="large"
            sx={{ mt: 4 }}
          >
            Get Started
          </Button>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" align="center" gutterBottom>
          Why Choose SkillForge?
        </Typography>
        <Grid container spacing={4} sx={{ mt: 4 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  p: 2,
                }}
              >
                <Box sx={{ color: 'primary.main', mb: 2 }}>{feature.icon}</Box>
                <CardContent>
                  <Typography variant="h5" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h4" component="h2" gutterBottom>
            Ready to Start Your Journey?
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Join thousands of learners who are already mastering their skills with SkillForge.
          </Typography>
          <Button
            component={RouterLink}
            to="/register"
            variant="contained"
            color="primary"
            size="large"
            sx={{ mt: 2 }}
          >
            Create Your Account
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 