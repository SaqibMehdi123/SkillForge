import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Avatar,
  Button,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Badge,
  Card,
  CardContent,
  LinearProgress,
  Link,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Email as EmailIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  GitHub as GitHubIcon,
  LinkedIn as LinkedInIcon,
  Language as WebsiteIcon,
  Twitter as TwitterIcon,
  AddAPhoto as AddPhotoIcon,
  EmojiEvents as TrophyIcon,
  BarChart as StatsIcon,
  Settings as SettingsIcon,
  Verified as VerifiedIcon,
  People as PeopleIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { updateProfile } from '../../features/auth/authSlice';
import { getHistory } from '../../features/practice/practiceSlice';
import { styled } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const Profile = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);
  const { completedTasks } = useSelector((state) => state.practice);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    occupation: user?.occupation || '',
    education: user?.education || '',
    socialLinks: {
      github: user?.socialLinks?.github || '',
      linkedin: user?.socialLinks?.linkedin || '',
      twitter: user?.socialLinks?.twitter || '',
      website: user?.socialLinks?.website || '',
    }
  });

  useEffect(() => {
    // Load practice history
    dispatch(getHistory());
  }, [dispatch]);

  // Calculate total practice time in minutes
  const totalPracticeMinutes = completedTasks.reduce(
    (total, task) => total + Math.floor((task.duration || 0) / 60), 
    0
  );

  // Last seven days dates
  const last7Days = Array.from({length: 7}, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  });

  // Get practice sessions by date
  const sessionsByDate = last7Days.map(day => {
    return {
      date: day,
      count: completedTasks.filter(task => 
        new Date(task.completedAt || task.endedAt).toISOString().split('T')[0] === day
      ).length
    };
  }).reverse(); // reverse to get chronological order

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
      bio: user?.bio || '',
      occupation: user?.occupation || '',
      education: user?.education || '',
      socialLinks: {
        github: user?.socialLinks?.github || '',
        linkedin: user?.socialLinks?.linkedin || '',
        twitter: user?.socialLinks?.twitter || '',
        website: user?.socialLinks?.website || '',
      }
    });
  };

  const handleSave = async () => {
    try {
      await dispatch(updateProfile(formData)).unwrap();
      setIsEditing(false);
      setAlertInfo({
        open: true,
        message: 'Profile updated successfully!',
        severity: 'success'
      });
    } catch (error) {
      setAlertInfo({
        open: true,
        message: error || 'Failed to update profile. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setUploadingAvatar(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      };

      const response = await axios.post(`${API_URL}/users/avatar`, formData, config);
      
      if (response.data.success) {
        // Update profile with new avatar URL
        await dispatch(updateProfile({ avatar: response.data.avatarUrl })).unwrap();
        setAlertInfo({
          open: true,
          message: 'Avatar updated successfully!',
          severity: 'success'
        });
      }
    } catch (error) {
      setAlertInfo({
        open: true,
        message: 'Failed to upload avatar. Please try again.',
        severity: 'error'
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAlertClose = () => {
    setAlertInfo({...alertInfo, open: false});
  };

  // Level progress
  const nextLevelXP = (user?.level || 1) * 100;
  const xpProgress = Math.min(100, Math.round(((user?.xp || 0) / nextLevelXP) * 100));

  // Calculate date-based metrics
  const daysActive = completedTasks.length > 0 
    ? new Set(completedTasks.map(task => new Date(task.endedAt || task.completedAt).toDateString())).size 
    : 0;

  // Format date helper
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '80vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Snackbar 
        open={alertInfo.open} 
        autoHideDuration={6000} 
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleAlertClose} 
          severity={alertInfo.severity} 
          sx={{ width: '100%' }}
        >
          {alertInfo.message}
        </Alert>
      </Snackbar>

      {/* Profile Header */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(to right, rgba(55, 65, 81, 0.9), rgba(17, 24, 39, 0.9))' 
            : 'linear-gradient(to right, #f9fafb, #f3f4f6)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={9}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  isEditing ? (
                    <IconButton
                      component="label"
                      sx={{ 
                        bgcolor: theme.palette.primary.main, 
                        color: 'white',
                        '&:hover': { bgcolor: theme.palette.primary.dark }
                      }}
                      size="small"
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <AddPhotoIcon fontSize="small" />
                      )}
                      <VisuallyHiddenInput type="file" accept="image/*" onChange={handleFileUpload} />
                    </IconButton>
                  ) : null
                }
              >
                <Avatar
                  src={user?.avatar}
                  alt={user?.username || 'User'}
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    border: `4px solid ${theme.palette.background.paper}`,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </Badge>
              <Box sx={{ ml: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      name="username"
                      label="Username"
                      variant="outlined"
                      value={formData.username}
                      onChange={handleChange}
                      sx={{ maxWidth: 300 }}
                    />
                  ) : (
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {user?.username || 'User'}
                      {user?.level >= 10 && (
                        <Tooltip title="Experienced User">
                          <VerifiedIcon 
                            color="primary" 
                            sx={{ ml: 1, verticalAlign: 'middle', fontSize: '0.8em' }} 
                          />
                        </Tooltip>
                      )}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrophyIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                    <Typography variant="body1" color="text.secondary">
                      Level {user?.level || 1}
                    </Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem />
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <StatsIcon fontSize="small" color="secondary" sx={{ mr: 0.5 }} />
                    <Typography variant="body1" color="text.secondary">
                      {user?.xp || 0} XP
                    </Typography>
                  </Box>
                  {user?.streaks?.current > 0 && (
                    <>
                      <Divider orientation="vertical" flexItem />
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Tooltip title="Current Streak">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PeopleIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
                            <Typography variant="body1" color="text.secondary">
                              {user?.friends?.length || 0} Friends
                            </Typography>
                          </Box>
                        </Tooltip>
                      </Box>
                    </>
                  )}
                </Box>

                {!isEditing && (
                  <Typography 
                    variant="body1" 
                    color="text.secondary" 
                    sx={{ 
                      mt: 1, 
                      fontStyle: user?.bio ? 'normal' : 'italic',
                      maxWidth: 600, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user?.bio || 'No bio available'}
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            {isEditing ? (
              <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </Box>
            ) : (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEdit}
                sx={{ borderRadius: 2 }}
              >
                Edit Profile
              </Button>
            )}
          </Grid>
        </Grid>

        {/* Level Progress Bar */}
        <Box sx={{ mt: 3, maxWidth: 500 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Level {user?.level || 1}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.xp || 0} / {nextLevelXP} XP
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={xpProgress} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            }} 
          />
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Profile Tabs Navigation */}
        <Grid item xs={12}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              <Tab 
                label="Profile" 
                icon={<SettingsIcon />} 
                iconPosition="start"
                sx={{ fontWeight: 600, textTransform: 'none', fontSize: '0.95rem' }}
              />
              <Tab 
                label="Stats" 
                icon={<StatsIcon />} 
                iconPosition="start"
                sx={{ fontWeight: 600, textTransform: 'none', fontSize: '0.95rem' }}
              />
              <Tab 
                label="Activity" 
                icon={<HistoryIcon />} 
                iconPosition="start"
                sx={{ fontWeight: 600, textTransform: 'none', fontSize: '0.95rem' }}
              />
            </Tabs>
          </Box>
        </Grid>

        {/* Profile Content */}
        {activeTab === 0 && (
          <>
            {/* Profile Details */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, borderRadius: 2, height: '100%', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                  Personal Information
                </Typography>

                {isEditing ? (
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        name="bio"
                        label="Bio"
                        variant="outlined"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Tell us about yourself..."
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="email"
                        label="Email"
                        type="email"
                        variant="outlined"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="occupation"
                        label="Occupation"
                        variant="outlined"
                        value={formData.occupation}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        name="education"
                        label="Education"
                        variant="outlined"
                        value={formData.education}
                        onChange={handleChange}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
                        Social Links
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="socialLinks.github"
                        label="GitHub URL"
                        variant="outlined"
                        value={formData.socialLinks.github}
                        onChange={handleChange}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <GitHubIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="socialLinks.linkedin"
                        label="LinkedIn URL"
                        variant="outlined"
                        value={formData.socialLinks.linkedin}
                        onChange={handleChange}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LinkedInIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="socialLinks.twitter"
                        label="Twitter URL"
                        variant="outlined"
                        value={formData.socialLinks.twitter}
                        onChange={handleChange}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <TwitterIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="socialLinks.website"
                        label="Personal Website"
                        variant="outlined"
                        value={formData.socialLinks.website}
                        onChange={handleChange}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <WebsiteIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>
                ) : (
                  <>
                    <Typography variant="body1" paragraph sx={{ mb: 3 }}>
                      {user?.bio || 'No bio available.'}
                    </Typography>

                    <List disablePadding>
                      <ListItem sx={{ px: 0, py: 1 }}>
                        <ListItemIcon>
                          <EmailIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Email"
                          secondary={user?.email || 'No email provided'}
                        />
                      </ListItem>
                      <Divider component="li" />
                      <ListItem sx={{ px: 0, py: 1 }}>
                        <ListItemIcon>
                          <WorkIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Occupation"
                          secondary={user?.occupation || 'Not specified'}
                        />
                      </ListItem>
                      <Divider component="li" />
                      <ListItem sx={{ px: 0, py: 1 }}>
                        <ListItemIcon>
                          <SchoolIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Education"
                          secondary={user?.education || 'Not specified'}
                        />
                      </ListItem>
                      
                      {/* Social Links */}
                      {(user?.socialLinks?.github || 
                        user?.socialLinks?.linkedin || 
                        user?.socialLinks?.twitter || 
                        user?.socialLinks?.website) && (
                        <>
                          <Divider sx={{ my: 2 }} />
                          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
                            Social Links
                          </Typography>
                          
                          <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                            {user?.socialLinks?.github && (
                              <Tooltip title="GitHub">
                                <IconButton 
                                  component={Link} 
                                  href={user.socialLinks.github} 
                                  target="_blank" 
                                  rel="noopener"
                                  color="primary"
                                >
                                  <GitHubIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            
                            {user?.socialLinks?.linkedin && (
                              <Tooltip title="LinkedIn">
                                <IconButton 
                                  component={Link} 
                                  href={user.socialLinks.linkedin} 
                                  target="_blank" 
                                  rel="noopener"
                                  color="primary"
                                >
                                  <LinkedInIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            
                            {user?.socialLinks?.twitter && (
                              <Tooltip title="Twitter">
                                <IconButton 
                                  component={Link} 
                                  href={user.socialLinks.twitter} 
                                  target="_blank" 
                                  rel="noopener"
                                  color="primary"
                                >
                                  <TwitterIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            
                            {user?.socialLinks?.website && (
                              <Tooltip title="Personal Website">
                                <IconButton 
                                  component={Link} 
                                  href={user.socialLinks.website} 
                                  target="_blank" 
                                  rel="noopener"
                                  color="primary"
                                >
                                  <WebsiteIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </>
                      )}
                    </List>
                  </>
                )}
              </Paper>
            </Grid>

            {/* Account Stats */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                  Account Stats
                </Typography>
                
                <List disablePadding>
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body1" color="text.secondary">
                          Total Practice Sessions
                        </Typography>
                      }
                      secondary={
                        <Typography variant="h6" color="primary" sx={{ mt: 0.5 }}>
                          {completedTasks.length}
                        </Typography>
                      }
                    />
                  </ListItem>
                  <Divider component="li" />
                  
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body1" color="text.secondary">
                          Current Streak
                        </Typography>
                      }
                      secondary={
                        <Typography variant="h6" color="error" sx={{ mt: 0.5 }}>
                          {user?.streaks?.current || 0} days
                        </Typography>
                      }
                    />
                  </ListItem>
                  <Divider component="li" />
                  
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body1" color="text.secondary">
                          Best Streak
                        </Typography>
                      }
                      secondary={
                        <Typography variant="h6" color="secondary" sx={{ mt: 0.5 }}>
                          {user?.streaks?.best || 0} days
                        </Typography>
                      }
                    />
                  </ListItem>
                  <Divider component="li" />
                  
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body1" color="text.secondary">
                          Total Practice Time
                        </Typography>
                      }
                      secondary={
                        <Typography variant="h6" color="primary" sx={{ mt: 0.5 }}>
                          {totalPracticeMinutes} minutes
                        </Typography>
                      }
                    />
                  </ListItem>
                  <Divider component="li" />
                  
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body1" color="text.secondary">
                          Account Created
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {formatDate(user?.createdAt)}
                        </Typography>
                      }
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </>
        )}

        {/* Stats Tab */}
        {activeTab === 1 && (
          <>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                  Practice Statistics
                </Typography>
                
                <Grid container spacing={3}>
                  {/* Total Sessions */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Total Sessions
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1, fontWeight: 'medium' }}>
                          {completedTasks.length}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Days Active */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Days Active
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1, fontWeight: 'medium' }}>
                          {daysActive}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Average Session Length */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Avg. Session (min)
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1, fontWeight: 'medium' }}>
                          {completedTasks.length > 0 
                            ? Math.round(totalPracticeMinutes / completedTasks.length) 
                            : 0}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* XP Per Session */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          XP Per Session
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1, fontWeight: 'medium' }}>
                          {completedTasks.length > 0 
                            ? Math.round(user?.xp / completedTasks.length)
                            : 0}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                
                {/* Weekly Activity */}
                <Box sx={{ mt: 4 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Last 7 Days Activity
                  </Typography>
                  
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-end',
                      height: 160,
                      mt: 2
                    }}
                  >
                    {sessionsByDate.map((day, index) => {
                      const height = day.count * 25;
                      const date = new Date(day.date);
                      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                      
                      return (
                        <Box 
                          key={index} 
                          sx={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: `${100 / 7}%`,
                          }}
                        >
                          <Box sx={{ 
                            height: Math.max(height, 5),
                            width: '60%',
                            backgroundColor: height > 0 
                              ? theme.palette.primary.main 
                              : theme.palette.divider,
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.3s ease-in-out'
                          }}/>
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ mt: 1 }}
                          >
                            {dayName}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ opacity: 0.7 }}
                          >
                            {day.count}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                  Achievements
                </Typography>
                
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Avatar
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      margin: '0 auto',
                      bgcolor: theme.palette.primary.main
                    }}
                  >
                    <TrophyIcon sx={{ fontSize: 40 }} />
                  </Avatar>
                  
                  <Typography variant="h5" sx={{ mt: 2, fontWeight: 'medium' }}>
                    {user?.badges?.length || 0}
                  </Typography>
                  
                  <Typography variant="body1" color="text.secondary">
                    Achievements Earned
                  </Typography>
                  
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    sx={{ mt: 2 }}
                    component={Link}
                    href="/achievements"
                  >
                    View All Achievements
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </>
        )}

        {/* Activity Tab */}
        {activeTab === 2 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                Recent Activity
              </Typography>
              
              {completedTasks.length > 0 ? (
                <List disablePadding>
                  {completedTasks.slice(0, 10).map((task, index) => (
                    <React.Fragment key={task.id || index}>
                      <ListItem sx={{ px: 0, py: 2 }}>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                            {task.skill?.charAt(0).toUpperCase() || 'S'}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                              {task.skill || task.name || 'Practice Session'}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" color="text.secondary">
                                {Math.round((task.duration || 0) / 60)} minutes
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(task.completedAt || task.endedAt)}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      {index < completedTasks.slice(0, 10).length - 1 && (
                        <Divider component="li" />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    justifyContent: 'center', 
                    py: 5 
                  }}
                >
                  <HistoryIcon sx={{ fontSize: 60, color: theme.palette.text.secondary, opacity: 0.3 }} />
                  <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                    No activity yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Complete a practice session to see your activity
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default Profile; 