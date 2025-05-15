import React, { useState } from 'react';
import { useSelector } from 'react-redux';
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
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Email as EmailIcon,
  School as SchoolIcon,
  Work as WorkIcon,
} from '@mui/icons-material';

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    occupation: user?.occupation || '',
    education: user?.education || '',
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: user?.username || '',
      email: user?.email || '',
      bio: user?.bio || '',
      occupation: user?.occupation || '',
      education: user?.education || '',
    });
  };

  const handleSave = () => {
    // TODO: Implement save functionality with API call
    setIsEditing(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Profile Header */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
            <Avatar
              sx={{ width: 100, height: 100, mr: 3 }}
              src={user?.avatar}
            />
            <Box sx={{ flexGrow: 1 }}>
              {isEditing ? (
                <TextField
                  fullWidth
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  margin="normal"
                />
              ) : (
                <Typography variant="h4" gutterBottom>
                  {user?.username || 'User Name'}
                </Typography>
              )}
              <Typography variant="body1" color="text.secondary">
                {user?.level || 'White Badge'} • {user?.xp || 0} XP
              </Typography>
            </Box>
            {isEditing ? (
              <Box>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  sx={{ mr: 1 }}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </Box>
            ) : (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEdit}
              >
                Edit Profile
              </Button>
            )}
          </Paper>
        </Grid>

        {/* Profile Details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              About
            </Typography>
            {isEditing ? (
              <TextField
                fullWidth
                multiline
                rows={4}
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                margin="normal"
                placeholder="Tell us about yourself..."
              />
            ) : (
              <Typography variant="body1" paragraph>
                {user?.bio || 'No bio available'}
              </Typography>
            )}

            <Divider sx={{ my: 3 }} />

            <List>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Email"
                  secondary={user?.email || 'No email provided'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <WorkIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Occupation"
                  secondary={user?.occupation || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <SchoolIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Education"
                  secondary={user?.education || 'Not specified'}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Stats */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Statistics
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Practice Sessions"
                  secondary={user?.practiceSessions || 0}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Achievements"
                  secondary={user?.achievements?.length || 0}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Friends"
                  secondary={user?.friends?.length || 0}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile; 