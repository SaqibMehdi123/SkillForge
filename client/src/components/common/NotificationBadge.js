import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Badge, IconButton, Menu, MenuItem, Typography, Avatar, Box, Divider } from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getPendingRequests } from '../../features/friends/friendsSlice';

const NotificationBadge = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pendingRequests } = useSelector((state) => state.friends);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    // Fetch friend requests when component mounts
    dispatch(getPendingRequests());
    
    // Set up polling to check for new requests every minute
    const interval = setInterval(() => {
      dispatch(getPendingRequests());
    }, 60000);
    
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = () => {
    handleClose();
    navigate('/friends');
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-controls={open ? 'notification-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Badge 
          badgeContent={pendingRequests.length} 
          color="error"
          invisible={pendingRequests.length === 0}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        id="notification-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'notification-button',
        }}
        PaperProps={{
          sx: { 
            width: 320,
            maxHeight: 400,
          }
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle1">Notifications</Typography>
        </Box>
        <Divider />
        
        {pendingRequests.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2">No new notifications</Typography>
          </MenuItem>
        ) : (
          <>
            {pendingRequests.map((request) => (
              <MenuItem key={request._id} onClick={handleNotificationClick}>
                <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                  <Avatar 
                    src={request.sender.avatar} 
                    alt={request.sender.username}
                    sx={{ mr: 2 }}
                  >
                    {request.sender.username?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="body2">
                      <strong>{request.sender.username}</strong> sent you a friend request
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(request.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
            <Divider />
            <MenuItem onClick={handleNotificationClick}>
              <Typography variant="body2" color="primary" sx={{ width: '100%', textAlign: 'center' }}>
                View all friend requests
              </Typography>
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationBadge; 