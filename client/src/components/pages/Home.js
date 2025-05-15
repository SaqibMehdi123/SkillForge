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
  useMediaQuery,
  useTheme,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: { xs: 5, sm: 6, md: 8 },
          px: { xs: 2, sm: 3, md: 4 },
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography 
            variant={isMobile ? "h3" : "h2"} 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
              mb: { xs: 2, sm: 3 }
            }}
          >
            Master Your Skills with SkillForge
          </Typography>
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            component="h2" 
            gutterBottom
            sx={{ 
              mx: 'auto',
              maxWidth: { xs: '100%', sm: '80%', md: '70%' },
              lineHeight: 1.5,
              mb: { xs: 3, md: 4 }
            }}
          >
            The gamified platform that makes skill development fun and social
          </Typography>
          <Button
            component={RouterLink}
            to="/register"
            variant="contained"
            color="secondary"
            size={isMobile ? "medium" : "large"}
            sx={{ 
              mt: { xs: 2, md: 4 },
              py: { xs: 1, md: 1.5 },
              px: { xs: 3, md: 4 },
              fontSize: { xs: '0.9rem', md: '1rem' },
              fontWeight: 'bold'
            }}
          >
            Get Started
          </Button>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 5, sm: 6, md: 8 }, px: { xs: 2, sm: 3, md: 4 } }}>
        <Typography 
          variant={isMobile ? "h4" : "h3"} 
          component="h2" 
          align="center" 
          gutterBottom
          sx={{ 
            fontWeight: 'bold',
            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
            mb: { xs: 3, md: 4 }
          }}
        >
          Why Choose SkillForge?
        </Typography>
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ mt: { xs: 2, md: 4 } }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: { xs: 2, md: 3 },
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6
                  }
                }}
                elevation={2}
              >
                <Box sx={{ color: 'primary.main', mb: 2, mt: 1 }}>
                  {React.cloneElement(feature.icon, { 
                    sx: { fontSize: { xs: 32, sm: 36, md: 40 } } 
                  })}
                </Box>
                <CardContent sx={{ flexGrow: 1, p: { xs: 1, sm: 2 } }}>
                  <Typography 
                    variant="h5" 
                    component="h3" 
                    gutterBottom
                    sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, fontWeight: 'bold', mb: 1 }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ 
        bgcolor: 'grey.100', 
        py: { xs: 5, sm: 6, md: 8 },
        px: { xs: 2, sm: 3, md: 4 },
      }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            component="h2" 
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
              mb: { xs: 2, md: 3 }
            }}
          >
            Ready to Start Your Journey?
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary" 
            paragraph
            sx={{ 
              maxWidth: { sm: '80%', md: '70%' },
              mx: 'auto',
              mb: { xs: 3, md: 4 },
              fontSize: { xs: '0.9rem', md: '1rem' },
            }}
          >
            Join thousands of learners who are already mastering their skills with SkillForge.
          </Typography>
          <Button
            component={RouterLink}
            to="/register"
            variant="contained"
            color="primary"
            size={isMobile ? "medium" : "large"}
            sx={{ 
              mt: { xs: 1, md: 2 },
              py: { xs: 1, md: 1.5 },
              px: { xs: 3, md: 4 },
              fontWeight: 'bold'
            }}
          >
            Create Your Account
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 