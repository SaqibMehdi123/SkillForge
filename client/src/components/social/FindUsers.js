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
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { getAllUsers, sendFriendRequest, clearFriendsError } from '../../features/friends/friendsSlice';

const FindUsers = () => {
  const dispatch = useDispatch();
  const { allUsers, friends, sentRequests, pendingRequests, loading, error } = useSelector((state) => state.friends);
  const { user } = useSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]); // Track users with pending requests during this session

  useEffect(() => {
    fetchUsers();
  }, [dispatch]);

  useEffect(() => {
    if (allUsers && allUsers.length > 0) {
      filterUsers();
    } else {
      setSearchResults([]);
    }
  }, [allUsers, searchTerm, friends, sentRequests, pendingRequests, pendingUsers]);

  const fetchUsers = () => {
    dispatch(getAllUsers());
  };

  const filterUsers = () => {
    if (!allUsers || !Array.isArray(allUsers)) return;
    
    // Ensure friends is an array
    const friendsList = Array.isArray(friends) ? friends : [];
    
    // Filter out the current user and already friends
    let filteredUsers = allUsers.filter(u => 
      u._id !== user.id && 
      !friendsList.some(f => f._id === u._id)
    );

    // Filter by search term if any
    if (searchTerm.trim()) {
      filteredUsers = filteredUsers.filter(u => 
        u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase())
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
    const pendingList = Array.isArray(pendingRequests) ? pendingRequests : [];
    return pendingList.some(req => req.sender && req.sender._id === userId);
  };

  const isSentRequest = (userId) => {
    const sentList = Array.isArray(sentRequests) ? sentRequests : [];
    return sentList.some(req => req.recipient && req.recipient._id === userId) || pendingUsers.includes(userId);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleRefresh = () => {
    dispatch(clearFriendsError());
    fetchUsers();
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            Find Users
          </Typography>
          <Button 
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
            variant="outlined"
            size="small"
          >
            Refresh
          </Button>
        </Box>
        
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

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={handleRefresh}>
                RETRY
              </Button>
            }
          >
            {error}
          </Alert>
        ) : !allUsers || allUsers.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            No users found in the system.
          </Alert>
        ) : searchResults.length === 0 ? (
          <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 3 }}>
            {searchTerm ? 'No users found matching your search.' : 'No users available to add.'}
          </Typography>
        ) : (
          <List>
            {searchResults.map((userData) => {
              const pendingIncoming = isPendingRequest(userData._id);
              const pendingOutgoing = isSentRequest(userData._id);
              
              return (
                <React.Fragment key={userData._id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar src={userData.avatar} alt={userData.username} sx={{ width: 50, height: 50 }}>
                        {userData.username?.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography variant="body1" fontWeight={500}>{userData.username}</Typography>}
                      secondary={`Level ${userData.level || 1} • ${userData.xp || 0} XP`}
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
                          onClick={() => handleSendRequest(userData._id)}
                          disabled={loading || pendingUsers.includes(userData._id)}
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
      </Paper>
    </Container>
  );
};

export default FindUsers; 