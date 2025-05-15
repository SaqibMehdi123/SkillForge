import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  Box,
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
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  HourglassEmpty as PendingIcon,
} from '@mui/icons-material';
import { getAllUsers, sendFriendRequest } from '../../features/friends/friendsSlice';

const FindUsers = () => {
  const dispatch = useDispatch();
  const { allUsers, friends, sentRequests, pendingRequests, loading, error } = useSelector((state) => state.friends);
  const { user } = useSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]); // Track users with pending requests during this session

  useEffect(() => {
    dispatch(getAllUsers());
  }, [dispatch]);

  useEffect(() => {
    if (allUsers.length > 0) {
      filterUsers();
    }
  }, [allUsers, searchTerm, friends, sentRequests, pendingRequests, pendingUsers]);

  const filterUsers = () => {
    if (!allUsers) return;
    
    // Filter out the current user and already friends
    let filteredUsers = allUsers.filter(u => 
      u._id !== user.id && 
      !friends.some(f => f._id === u._id)
    );

    // Filter by search term if any
    if (searchTerm.trim()) {
      filteredUsers = filteredUsers.filter(u => 
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setSearchResults(filteredUsers);
  };

  const handleSendRequest = (userId) => {
    // Optimistically update UI by adding user to pending list
    setPendingUsers(prev => [...prev, userId]);
    
    // Dispatch the actual request
    dispatch(sendFriendRequest(userId));
  };

  const isPendingRequest = (userId) => {
    return pendingRequests.some(req => req.sender._id === userId);
  };

  const isSentRequest = (userId) => {
    return sentRequests.some(req => req.recipient._id === userId) || pendingUsers.includes(userId);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Find Users
        </Typography>
        
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by username"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        {loading && !searchResults.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : searchResults.length === 0 ? (
          <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 3 }}>
            {searchTerm ? 'No users found matching your search.' : 'No users available to add.'}
          </Typography>
        ) : (
          <List>
            {searchResults.map((user) => {
              const pendingIncoming = isPendingRequest(user._id);
              const pendingOutgoing = isSentRequest(user._id);
              
              return (
                <React.Fragment key={user._id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar src={user.avatar} alt={user.username} sx={{ width: 50, height: 50 }}>
                        {user.username?.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography variant="body1" fontWeight={500}>{user.username}</Typography>}
                      secondary={`Level ${user.level || 1} • ${user.xp || 0} XP`}
                    />
                    <ListItemSecondaryAction>
                      {pendingIncoming ? (
                        <Button 
                          variant="outlined" 
                          color="secondary" 
                          disabled
                          startIcon={<PendingIcon />}
                          sx={{ 
                            borderColor: 'secondary.main',
                            color: 'secondary.main'
                          }}
                        >
                          Request Received
                        </Button>
                      ) : pendingOutgoing ? (
                        <Button 
                          variant="outlined" 
                          color="primary" 
                          disabled
                          startIcon={<PendingIcon />}
                          sx={{ 
                            borderColor: 'primary.main',
                            color: 'primary.main',
                            opacity: 0.7
                          }}
                        >
                          Request Sent
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<PersonAddIcon />}
                          onClick={() => handleSendRequest(user._id)}
                          disabled={loading || pendingUsers.includes(user._id)}
                          sx={{ 
                            bgcolor: '#0084FF',
                            '&:hover': {
                              bgcolor: '#0078E7'
                            }
                          }}
                        >
                          Add Friend
                        </Button>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              );
            })}
          </List>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default FindUsers; 