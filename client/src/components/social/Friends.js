import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  TextField,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Badge,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Chat as ChatIcon,
  Search as SearchIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { 
  getFriends, 
  getPendingRequests, 
  getSentRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  clearFriendsError
} from '../../features/friends/friendsSlice';
import { Link as RouterLink } from 'react-router-dom';
import FindUsers from './FindUsers';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`friends-tabpanel-${index}`}
      aria-labelledby={`friends-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Friends = () => {
  const dispatch = useDispatch();
  const { friends, pendingRequests, sentRequests, loading, error } = useSelector((state) => state.friends);
  const [tabValue, setTabValue] = useState(0);
  const [friendUsername, setFriendUsername] = useState('');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    dispatch(getFriends());
    dispatch(getPendingRequests());
    dispatch(getSentRequests());
  }, [dispatch]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAddFriend = async () => {
    if (!friendUsername.trim()) return;
    
    try {
      await dispatch(sendFriendRequest(friendUsername)).unwrap();
      setFriendUsername('');
      setSuccessMessage('Friend request sent successfully!');
    } catch (err) {
      // Error is handled in the slice
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await dispatch(acceptFriendRequest(requestId)).unwrap();
      setSuccessMessage('Friend request accepted!');
    } catch (err) {
      // Error is handled in the slice
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await dispatch(rejectFriendRequest(requestId)).unwrap();
      setSuccessMessage('Friend request rejected.');
    } catch (err) {
      // Error is handled in the slice
    }
  };

  const handleRemoveFriendClick = (friend) => {
    setSelectedFriend(friend);
    setConfirmRemoveOpen(true);
  };

  const handleRemoveFriend = async () => {
    if (!selectedFriend) return;
    
    try {
      await dispatch(removeFriend(selectedFriend._id)).unwrap();
      setSuccessMessage('Friend removed successfully.');
      setConfirmRemoveOpen(false);
    } catch (err) {
      // Error is handled in the slice
    }
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage('');
  };

  const handleCloseError = () => {
    dispatch(clearFriendsError());
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} centered>
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '8px' }}>Friends</span> 
                  <Badge badgeContent={friends.length} color="primary">
                    <PeopleIcon />
                  </Badge>
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '8px' }}>Requests</span>
                  <Badge badgeContent={pendingRequests.length} color="error">
                    <PersonAddIcon />
                  </Badge>
                </Box>
              } 
            />
            <Tab label="Find Users" />
          </Tabs>
        </Box>

        {/* Friends List Tab */}
        <TabPanel value={tabValue} index={0}>
          {friends.length === 0 ? (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 3 }}>
              You don't have any friends yet. Add friends to connect!
            </Typography>
          ) : (
            <List>
              {friends.map((friend) => (
                <React.Fragment key={friend._id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar src={friend.avatar} alt={friend.username}>
                        {friend.username?.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={friend.username}
                      secondary={`Level ${friend.level} • ${friend.xp || 0} XP`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        color="primary"
                        component={RouterLink}
                        to={`/messages/${friend._id}`}
                      >
                        <ChatIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        color="error" 
                        onClick={() => handleRemoveFriendClick(friend)}
                        sx={{ ml: 1 }}
                      >
                        <PersonRemoveIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
        </TabPanel>

        {/* Requests Tab */}
        <TabPanel value={tabValue} index={1}>
          {pendingRequests.length === 0 && sentRequests.length === 0 ? (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 3 }}>
              No pending friend requests.
            </Typography>
          ) : (
            <>
              {pendingRequests.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Received Requests
                  </Typography>
                  <List>
                    {pendingRequests.map((request) => (
                      <React.Fragment key={request._id}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar src={request.sender.avatar} alt={request.sender.username}>
                              {request.sender.username?.charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={request.sender.username}
                            secondary={`Level ${request.sender.level}`}
                          />
                          <ListItemSecondaryAction>
                            <IconButton 
                              edge="end" 
                              color="success" 
                              onClick={() => handleAcceptRequest(request._id)}
                            >
                              <CheckIcon />
                            </IconButton>
                            <IconButton 
                              edge="end" 
                              color="error" 
                              onClick={() => handleRejectRequest(request._id)}
                              sx={{ ml: 1 }}
                            >
                              <CloseIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        <Divider variant="inset" component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                </>
              )}

              {sentRequests.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    Sent Requests
                  </Typography>
                  <List>
                    {sentRequests.map((request) => (
                      <React.Fragment key={request._id}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar src={request.recipient.avatar} alt={request.recipient.username}>
                              {request.recipient.username?.charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={request.recipient.username}
                            secondary="Pending"
                          />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                </>
              )}
            </>
          )}
        </TabPanel>

        {/* Find Users Tab */}
        <TabPanel value={tabValue} index={2}>
          <FindUsers />
        </TabPanel>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={handleCloseError} sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmRemoveOpen}
        onClose={() => setConfirmRemoveOpen(false)}
      >
        <DialogTitle>Remove Friend</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove {selectedFriend?.username} from your friends?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRemoveOpen(false)}>Cancel</Button>
          <Button onClick={handleRemoveFriend} color="error" autoFocus>
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Message */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={successMessage}
        action={
          <IconButton
            size="small"
            color="inherit"
            onClick={handleCloseSnackbar}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Container>
  );
};

export default Friends; 