import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Grid,
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  useMediaQuery,
  useTheme,
  Paper,
  Avatar,
  Stack,
  Divider,
  Chip,
  LinearProgress,
  IconButton,
  Tabs,
  Tab,
  Fade,
  Grow,
} from '@mui/material';
import {
  Timer as TimerIcon,
  EmojiEvents as TrophyIcon,
  People as PeopleIcon,
  Camera as CameraIcon,
  MenuBook as BookIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as TimeIcon,
  LocalFireDepartment as FireIcon,
  Speed as SpeedIcon,
  DirectionsRun as ActivityIcon,
  KeyboardDoubleArrowDown as ScrollIcon,
  ArrowForward as ArrowForwardIcon,
  Star as StarIcon,
  Celebration as CelebrationIcon,
} from '@mui/icons-material';

// Mock data for testimonials
const testimonials = [
  {
    name: 'Alex Johnson',
    title: 'Guitar Enthusiast',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    quote: "SkillForge helped me track my guitar practice and stay consistent. I've made more progress in 3 months than I did all last year!",
    stars: 5,
  },
  {
    name: 'Sarah Miller',
    title: 'Digital Artist',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    quote: "The ability to track my daily art practice with photos has been a game-changer. I can actually see my improvement over time.",
    stars: 5,
  },
  {
    name: 'Mike Chen',
    title: 'Language Learner',
    avatar: 'https://randomuser.me/api/portraits/men/62.jpg',
    quote: "The streak feature keeps me motivated to practice Spanish every day. I've maintained a 45-day streak so far!",
    stars: 4,
  },
];

// App statistics - more realistic numbers
const appStats = [
  { 
    value: '3,200+', 
    label: 'Active Users',
    icon: <PeopleIcon sx={{ fontSize: 36, mb: 1, color: '#8c52ff' }} />
  },
  { 
    value: '82,500+', 
    label: 'Practice Sessions',
    icon: <TimerIcon sx={{ fontSize: 36, mb: 1, color: '#8c52ff' }} />
  },
  { 
    value: '15,700+', 
    label: 'Achievements Earned',
    icon: <TrophyIcon sx={{ fontSize: 36, mb: 1, color: '#8c52ff' }} />
  },
  { 
    value: '78%', 
    label: 'Streak Maintenance',
    icon: <FireIcon sx={{ fontSize: 36, mb: 1, color: '#8c52ff' }} />
  },
];

// Expanded features list
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
    icon: <FireIcon sx={{ fontSize: 40 }} />,
    title: 'Daily Streaks',
    description: "Stay motivated with daily streaks and don't break the chain of consecutive practice days.",
  },
  {
    icon: <TrophyIcon sx={{ fontSize: 40 }} />,
    title: 'Achievements & Badges',
    description: 'Earn badges and level up as you progress from rookie to grand master.',
  },
  {
    icon: <TimelineIcon sx={{ fontSize: 40 }} />,
    title: 'Progress Analytics',
    description: 'Visualize your improvement with detailed statistics and progress charts.',
  },
  {
    icon: <PeopleIcon sx={{ fontSize: 40 }} />,
    title: 'Social Community',
    description: 'Connect with friends, share progress, and stay motivated together.',
  },
];

// How it works steps with improved icons
const howItWorks = [
  {
    step: 1,
    title: 'Sign Up',
    description: 'Create your free account in seconds and set up your skill profile.',
    icon: <CheckCircleIcon sx={{ fontSize: 30, color: '#8c52ff' }} />,
    circleColor: '#8c52ff'
  },
  {
    step: 2,
    title: 'Add Your Skills',
    description: 'Add the skills you want to track and improve upon.',
    icon: <BookIcon sx={{ fontSize: 30, color: '#8c52ff' }} />,
    circleColor: '#8c52ff'
  },
  {
    step: 3,
    title: 'Start Practicing',
    description: 'Use the timer to track your focused practice sessions.',
    icon: <TimerIcon sx={{ fontSize: 30, color: '#8c52ff' }} />,
    circleColor: '#8c52ff'
  },
  {
    step: 4,
    title: 'Document Progress',
    description: 'Take photos to document your practice and track visual progress.',
    icon: <CameraIcon sx={{ fontSize: 30, color: '#8c52ff' }} />,
    circleColor: '#8c52ff'
  },
  {
    step: 5,
    title: 'Earn Achievements',
    description: 'Level up and earn achievements as you improve and maintain streaks.',
    icon: <TrophyIcon sx={{ fontSize: 30, color: '#8c52ff' }} />,
    circleColor: '#8c52ff'
  },
];

// Mock screenshot data
const screenshots = [
  {
    title: 'Dashboard Overview',
    description: 'Track all your skills and progress in one place with our intuitive dashboard',
    image: '/images/dashboard.jpg',
    isPlaceholder: false,
  },
  {
    title: 'Practice Timer',
    description: 'Focus your practice with our customizable timer and session tracker',
    image: '/images/practice.jpg',
    isPlaceholder: true,
  },
  {
    title: 'Achievements Gallery',
    description: 'Earn badges and level up as you improve your skills over time',
    image: 'https://placehold.co/800x500/009688/ffffff?text=Achievements+Gallery',
  },
  {
    title: 'Progress Photos',
    description: 'Document your journey with progress photos to visualize improvement',
    image: 'https://placehold.co/800x500/ff9800/ffffff?text=Progress+Photos',
  },
];

// Mock data for team members
const teamMembers = [
  {
    name: 'Saqib Mehdi',
    title: 'Full-Stack Developer',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    bio: "Lead developer responsible for application architecture and backend integration. Skilled in React, Node.js, and MongoDB.",
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
  },
  {
    name: 'Muhammad Shees Ur Rehman',
    title: 'Frontend Developer',
    avatar: 'https://randomuser.me/api/portraits/men/44.jpg',
    bio: "UI/UX specialist focused on creating responsive and intuitive user interfaces. Expert in React, Material-UI, and frontend optimization.",
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
  },
];

const Home = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [animateStats, setAnimateStats] = useState(false);
  
  // Animation effect for stats when scrolled into view
  useEffect(() => {
    const handleScroll = () => {
      const statsSection = document.getElementById('stats-section');
      if (statsSection) {
        const rect = statsSection.getBoundingClientRect();
        const isVisible = rect.top <= window.innerHeight && rect.bottom >= 0;
        if (isVisible) {
          setAnimateStats(true);
          window.removeEventListener('scroll', handleScroll);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      {/* Hero Section with Animated Background */}
      <Box
        sx={{
          position: 'relative',
          backgroundImage: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
          color: 'white',
          overflow: 'hidden',
          py: { xs: 8, sm: 12, md: 16 },
          px: { xs: 2, sm: 3, md: 4 },
          textAlign: 'center',
        }}
      >
        {/* Animated Background Elements */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            opacity: 0.1,
            background: 'radial-gradient(circle, transparent 20%, rgba(255,255,255,0.3) 20%, rgba(255,255,255,0.3) 21%, transparent 21%, transparent 34%, rgba(255,255,255,0.3) 34%, rgba(255,255,255,0.3) 35%, transparent 35%) 0 0/80px 80px',
          }}
        />
        
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Grow in={true} timeout={1000}>
            <Typography 
              variant={isMobile ? "h3" : "h1"} 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 800,
                fontSize: { xs: '2.25rem', sm: '3rem', md: '4rem' },
                mb: { xs: 2, sm: 3 },
                letterSpacing: '-0.5px',
                textShadow: '0 2px 10px rgba(0,0,0,0.2)',
              }}
            >
              Transform Your Skills with <br /> <Box component="span" sx={{ color: '#FFD700' }}>SkillForge</Box>
            </Typography>
          </Grow>
          
          <Fade in={true} timeout={1500} style={{ transitionDelay: '500ms' }}>
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              component="h2" 
              gutterBottom
              sx={{ 
                mx: 'auto',
                maxWidth: { xs: '100%', sm: '80%', md: '70%' },
                lineHeight: 1.6,
                mb: { xs: 4, md: 5 },
                fontWeight: 300,
              }}
            >
              The gamified platform that makes skill development fun, measurable, and consistent. Track progress, earn achievements, and build lasting habits.
            </Typography>
          </Fade>
          
          <Fade in={true} timeout={2000} style={{ transitionDelay: '1000ms' }}>
            <Box sx={{ mt: 4 }}>
              <Button
                component={RouterLink}
                to="/register"
                variant="contained"
                color="secondary"
                size={isMobile ? "medium" : "large"}
                sx={{ 
                  py: { xs: 1.5, md: 2 },
                  px: { xs: 4, md: 5 },
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  fontWeight: 'bold',
                  borderRadius: '30px',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 12px 20px rgba(0,0,0,0.2)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Start Your Journey
              </Button>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Free to start. No credit card required.
                </Typography>
              </Box>
            </Box>
          </Fade>
          
          {/* Scroll Down Indicator */}
          <Box sx={{ 
            position: 'absolute', 
            bottom: -50, 
            left: '50%', 
            transform: 'translateX(-50%)',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': { opacity: 0.6, transform: 'translate(-50%, 0)' },
              '50%': { opacity: 1, transform: 'translate(-50%, 10px)' },
              '100%': { opacity: 0.6, transform: 'translate(-50%, 0)' },
            }
          }}>
            <IconButton 
              color="inherit" 
              aria-label="scroll down"
              onClick={() => document.getElementById('features-section').scrollIntoView({ behavior: 'smooth' })}
              sx={{ 
                color: 'white',
                opacity: 0.7,
                '&:hover': { opacity: 1 },
              }}
            >
              <ScrollIcon fontSize="large" />
            </IconButton>
          </Box>
        </Container>
      </Box>

      {/* Stats Counter Section */}
      <Box 
        id="stats-section"
        sx={{
          py: { xs: 5, sm: 6 },
          bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="center">
            {appStats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Grow in={animateStats} timeout={(index + 1) * 300}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      p: 2,
                      borderRadius: 3,
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'white',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                      height: '100%',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                      }
                    }}
                  >
                    <Box 
                      sx={{ 
                        borderRadius: '50%',
                        p: 1.5, 
                        mb: 2,
                        backgroundColor: 'rgba(140, 82, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {stat.icon}
                    </Box>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 'bold',
                        mb: 0.5,
                        color: '#8c52ff',
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                </Grow>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box id="features-section" sx={{ py: { xs: 6, sm: 8, md: 10 }, px: { xs: 2, sm: 3, md: 4 } }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6}>
            <Typography 
              variant={isMobile ? "h4" : "h3"} 
              component="h2" 
              sx={{ 
                fontWeight: 'bold',
                mb: 2,
                color: 'primary.main',
              }}
            >
              Powerful Features to Accelerate Your Growth
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ 
                maxWidth: '800px',
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              Everything you need to track, measure, and improve your skills efficiently
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 3, sm: 4, md: 5 }}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  elevation={4}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    overflow: 'hidden',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 8,
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      p: 3, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)',
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: 'primary.main',
                        width: 60,
                        height: 60,
                        mb: 2,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    >
                      {React.cloneElement(feature.icon, { 
                        sx: { fontSize: 30 } 
                      })}
                    </Avatar>
                    <Typography 
                      variant="h5" 
                      component="h3" 
                      align="center"
                      sx={{ fontWeight: 'bold' }}
                    >
                      {feature.title}
                    </Typography>
                  </Box>
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      align="center"
                      sx={{ lineHeight: 1.6 }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* How It Works Section - Improved */}
      <Box 
        sx={{ 
          py: { xs: 6, sm: 8, md: 10 }, 
          px: { xs: 2, sm: 3, md: 4 },
          bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50', 
        }}
      >
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6}>
            <Typography 
              variant={isMobile ? "h4" : "h3"} 
              component="h2" 
              sx={{ 
                fontWeight: 'bold',
                mb: 2,
                color: '#8c52ff',
              }}
            >
              How SkillForge Works
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ 
                maxWidth: '800px',
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              Getting started is simple and takes just a few minutes
            </Typography>
          </Box>

          {/* New improved process flow */}
          <Box sx={{ position: 'relative', my: 8, maxWidth: '1000px', mx: 'auto' }}>
            {/* Horizontal connecting line */}
            {!isMobile && (
              <Box sx={{
                position: 'absolute',
                height: '4px',
                top: '60px',
                left: '10%',
                right: '10%',
                bgcolor: '#8c52ff',
                zIndex: 0,
                borderRadius: '4px',
              }} />
            )}
            
            <Grid container spacing={3} justifyContent="center">
              {howItWorks.map((item, index) => (
                <Grid item xs={12} sm={6} md={2.4} key={index}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      zIndex: 1,
                      height: '100%',
                    }}
                  >
                    {/* Number Circle with Improved Style */}
                    <Avatar
                      sx={{
                        bgcolor: '#8c52ff',
                        width: 80,
                        height: 80,
                        mb: 2,
                        boxShadow: '0 0 0 6px #fff, 0 8px 16px rgba(140, 82, 255, 0.4)',
                        fontSize: '1.75rem',
                        fontWeight: 'bold',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-5px) scale(1.1)',
                          boxShadow: '0 0 0 6px #fff, 0 12px 20px rgba(140, 82, 255, 0.5)',
                        }
                      }}
                    >
                      {item.step}
                    </Avatar>
                    
                    {/* Centered Icon Below Number */}
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        bgcolor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                        position: 'absolute',
                        top: 65,
                        zIndex: 2,
                        border: '2px solid #f0f0f0',
                      }}
                    >
                      {item.icon}
                    </Box>
                    
                    {/* Content Card */}
                    <Card
                      elevation={3}
                      sx={{
                        width: '100%',
                        height: '100%',
                        mt: 2,
                        pt: 3,
                        pb: 3,
                        px: 2,
                        borderRadius: 4,
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'white',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: '0 10px 25px rgba(140, 82, 255, 0.15)',
                        }
                      }}
                    >
                      <Typography 
                        variant="h6" 
                        component="h3" 
                        gutterBottom 
                        align="center"
                        sx={{ fontWeight: 'bold', color: '#8c52ff', mt: 1 }}
                      >
                        {item.title}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        align="center"
                        sx={{ lineHeight: 1.6 }}
                      >
                        {item.description}
                      </Typography>
                    </Card>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Button
              component={RouterLink}
              to="/register"
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              sx={{ 
                py: 1.5, 
                px: 4, 
                borderRadius: 30,
                fontWeight: 'bold',
                boxShadow: '0 8px 16px rgba(140, 82, 255, 0.3)',
                bgcolor: '#8c52ff',
                '&:hover': {
                  bgcolor: '#7a45e0',
                  boxShadow: '0 12px 20px rgba(140, 82, 255, 0.4)',
                  transform: 'translateY(-3px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Get Started Now
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Screenshots / App Preview Section */}
      <Box sx={{ py: { xs: 6, sm: 8, md: 10 }, px: { xs: 2, sm: 3, md: 4 } }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6}>
            <Typography 
              variant={isMobile ? "h4" : "h3"} 
              component="h2" 
              sx={{ 
                fontWeight: 'bold',
                mb: 2,
                color: 'primary.main',
              }}
            >
              See SkillForge in Action
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ 
                maxWidth: '800px',
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              Explore the intuitive interface and powerful features
            </Typography>
          </Box>

          {/* Screenshots Tab Navigation - Improved & Centered */}
          <Box sx={{ 
            mb: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center'
          }}>
            <Box sx={{ 
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 50,
              p: 0.5,
              display: 'inline-flex',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              mb: 5,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              mx: 'auto',
              maxWidth: '100%',
              overflowX: 'auto',
              '&::-webkit-scrollbar': {
                display: 'none'
              }
            }}>
              {screenshots.map((screenshot, index) => (
                <Button
                  key={index}
                  variant={activeTab === index ? 'contained' : 'text'}
                  color="primary"
                  onClick={() => setActiveTab(index)}
                  sx={{
                    borderRadius: 50,
                    px: 3,
                    py: 1,
                    minWidth: 120,
                    fontWeight: 'bold',
                    textTransform: 'none',
                    transition: 'all 0.3s ease',
                    mx: 0.5,
                    whiteSpace: 'nowrap',
                    ...(activeTab !== index && {
                      color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                      }
                    })
                  }}
                >
                  {screenshot.title}
                </Button>
              ))}
            </Box>
          </Box>

          {/* Screenshot Display */}
          <Box>
            {screenshots.map((screenshot, index) => (
              <Box
                key={index}
                sx={{
                  display: activeTab === index ? 'block' : 'none',
                  borderRadius: 4,
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                  border: `1px solid ${theme.palette.divider}`,
                  position: 'relative',
                }}
              >
                <Fade in={activeTab === index}>
                  <Box>
                    {screenshot.isPlaceholder ? (
                      <Box sx={{ position: 'relative' }}>
                        <CardMedia
                          component="img"
                          image={screenshot.image}
                          alt={screenshot.title}
                          sx={{ 
                            width: '100%',
                            height: 'auto',
                            maxHeight: 600,
                            objectFit: 'contain',
                            filter: 'brightness(0.7)',
                          }}
                        />
                        <Box 
                          sx={{ 
                            position: 'absolute', 
                            top: '50%', 
                            left: '50%', 
                            transform: 'translate(-50%, -50%)', 
                            bgcolor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            p: 3,
                            borderRadius: 2,
                            textAlign: 'center',
                            maxWidth: '80%',
                          }}
                        >
                          <Typography variant="h6" gutterBottom>
                            Replace with Your Actual Screenshot
                          </Typography>
                          <Typography variant="body2">
                            Place your {screenshot.title.toLowerCase()} screenshot in <code>/public/images/{screenshot.image.split('/').pop()}</code>
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <CardMedia
                        component="img"
                        image={screenshot.image}
                        alt={screenshot.title}
                        sx={{ 
                          width: '100%',
                          height: 'auto',
                          maxHeight: 600,
                          objectFit: 'contain',
                        }}
                      />
                    )}
                    <Box sx={{ 
                      p: 3, 
                      bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'rgba(245, 245, 245, 0.9)',
                      textAlign: 'center',
                      borderTop: `1px solid ${theme.palette.divider}`,
                    }}>
                      <Typography variant="h6" gutterBottom color="primary.main" fontWeight="bold">
                        {screenshot.title}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {screenshot.description}
                      </Typography>
                    </Box>
                  </Box>
                </Fade>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Team Members Section */}
      <Box 
        sx={{ 
          py: { xs: 6, sm: 8, md: 10 }, 
          px: { xs: 2, sm: 3, md: 4 },
          bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50', 
        }}
      >
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6}>
            <Typography 
              variant={isMobile ? "h4" : "h3"} 
              component="h2" 
              sx={{ 
                fontWeight: 'bold',
                mb: 2,
                color: 'primary.main',
              }}
            >
              Meet Our Team
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ 
                maxWidth: '800px',
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              The talented developers behind SkillForge
            </Typography>
          </Box>

          <Grid container spacing={6} justifyContent="center">
            {teamMembers.map((member, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card
                  elevation={3}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    borderRadius: 3,
                    overflow: 'hidden',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                    }
                  }}
                >
                  <Box 
                    sx={{
                      width: { xs: '100%', sm: '40%' },
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 3,
                      bgcolor: 'primary.main',
                      color: 'white',
                    }}
                  >
                    <Avatar 
                      src={member.avatar} 
                      alt={member.name}
                      sx={{ 
                        width: 120, 
                        height: 120, 
                        mb: 2,
                        border: '4px solid white',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                      }}
                    />
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                      {member.name}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.9, textAlign: 'center' }}>
                      {member.title}
                    </Typography>
                    <Box sx={{ display: 'flex', mt: 2, gap: 2 }}>
                      <IconButton 
                        aria-label="github"
                        sx={{ 
                          color: 'white',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                        }}
                        onClick={() => window.open(member.github, '_blank')}
                      >
                        <Box component="img" src="https://cdn.jsdelivr.net/npm/simple-icons@v6/icons/github.svg" alt="GitHub" sx={{ width: 24, height: 24, filter: 'invert(1)' }} />
                      </IconButton>
                      <IconButton 
                        aria-label="linkedin"
                        sx={{ 
                          color: 'white',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                        }}
                        onClick={() => window.open(member.linkedin, '_blank')}
                      >
                        <Box component="img" src="https://cdn.jsdelivr.net/npm/simple-icons@v6/icons/linkedin.svg" alt="LinkedIn" sx={{ width: 24, height: 24, filter: 'invert(1)' }} />
                      </IconButton>
                    </Box>
                  </Box>
                  <CardContent sx={{ flexGrow: 1, p: 4, width: { xs: '100%', sm: '60%' } }}>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        lineHeight: 1.7,
                        mb: 3,
                      }}
                    >
                      {member.bio}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                      {index === 0 ? (
                        <>
                          <Chip size="small" label="Backend" color="primary" variant="outlined" />
                          <Chip size="small" label="Architecture" color="primary" variant="outlined" />
                          <Chip size="small" label="Database" color="primary" variant="outlined" />
                          <Chip size="small" label="APIs" color="primary" variant="outlined" />
                        </>
                      ) : (
                        <>
                          <Chip size="small" label="Frontend" color="primary" variant="outlined" />
                          <Chip size="small" label="UI/UX" color="primary" variant="outlined" />
                          <Chip size="small" label="Responsive Design" color="primary" variant="outlined" />
                          <Chip size="small" label="Animations" color="primary" variant="outlined" />
                        </>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Final CTA Section */}
      <Box 
        sx={{ 
          py: { xs: 8, sm: 10, md: 12 },
          px: { xs: 2, sm: 3, md: 4 },
          textAlign: 'center',
          backgroundImage: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            background: 'radial-gradient(circle, transparent 20%, rgba(255,255,255,0.3) 20%, rgba(255,255,255,0.3) 21%, transparent 21%, transparent 34%, rgba(255,255,255,0.3) 34%, rgba(255,255,255,0.3) 35%, transparent 35%) 0 0/60px 60px',
          }}
        />
        
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant={isMobile ? "h4" : "h3"}
            component="h2"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              mb: 3,
              textShadow: '0 2px 10px rgba(0,0,0,0.2)',
            }}
          >
            Ready to Accelerate Your Skill Development?
          </Typography>
          
          <Typography
            variant={isMobile ? "body1" : "h6"}
            sx={{
              mb: 5,
              maxWidth: '800px',
              mx: 'auto',
              opacity: 0.9,
            }}
          >
            Join thousands of users who are transforming their skills and habits with SkillForge. 
            Start for free and see the difference structured practice makes.
          </Typography>
          
          <Button
            component={RouterLink}
            to="/register"
            variant="contained"
            color="secondary"
            size="large"
            endIcon={<CelebrationIcon />}
            sx={{
              py: 2,
              px: 5,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              borderRadius: '30px',
              boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 12px 20px rgba(0,0,0,0.2)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Start Your Free Account
          </Button>
          
          <Typography variant="body2" sx={{ mt: 3, opacity: 0.8 }}>
            No credit card required. Cancel anytime.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 