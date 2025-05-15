import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Fab, Badge, Popover, List, ListItem, ListItemAvatar, ListItemText, Avatar, Typography, Box, Divider, Paper, IconButton } from '@mui/material';
import { Chat as ChatIcon, MoreVert as MoreVertIcon, Message as MessageIcon } from '@mui/icons-material';
import { getConversations } from '../../features/messages/messagesSlice';
import { getFriends } from '../../features/friends/friendsSlice';

const FloatingChatButton = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { conversations, loading: conversationsLoading } = useSelector((state) => state.messages);
  const { friends, loading: friendsLoading } = useSelector((state) => state.friends);
  
  const unreadCount = conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
  const open = Boolean(anchorEl);

  useEffect(() => {
    // Preload conversations and friends immediately when component mounts
    dispatch(getConversations());
    dispatch(getFriends());
    
    // Set up polling to check for new messages every 15 seconds
    const interval = setInterval(() => {
      dispatch(getConversations());
    }, 15000);
    
    return () => {
      clearInterval(interval);
    };
  }, [dispatch]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    
    // Refresh conversations and friends list to ensure latest data
    dispatch(getConversations());
    dispatch(getFriends());
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleConversationClick = (userId) => {
    navigate(`/messages/${userId}`);
    handleClose();
  };

  // Function to get the last message content for a friend
  const getLastMessageContent = (friendId) => {
    const conversation = conversations.find(conv => conv._id === friendId);
    return conversation?.lastMessage?.content || '';
  };

  // Function to check if friend has an active conversation
  const hasActiveConversation = (friendId) => {
    return conversations.some(conv => conv._id === friendId);
  };

  // Function to get the unread count for a friend
  const getUnreadCount = (friendId) => {
    const conversation = conversations.find(conv => conv._id === friendId);
    return conversation?.unreadCount || 0;
  };

  // Function to get time since last message
  const getLastMessageTime = (friendId) => {
    const conversation = conversations.find(conv => conv._id === friendId);
    if (!conversation?.lastMessage?.createdAt) return '';
    
    const messageDate = new Date(conversation.lastMessage.createdAt);
    const now = new Date();
    const diffMs = now - messageDate;
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return messageDate.toLocaleDateString();
  };

  return (
    <>
      <Fab
        color="primary"
        aria-label="chat"
        onClick={handleClick}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          backgroundColor: '#0084FF',
          '&:hover': {
            backgroundColor: '#0078E7'
          },
          boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
          zIndex: 1000,
          width: 60,
          height: 60,
          transition: 'all 0.3s ease'
        }}
      >
        <Badge 
          badgeContent={unreadCount} 
          color="error" 
          overlap="circular"
          sx={{
            '& .MuiBadge-badge': {
              backgroundColor: '#FF3366',
              fontWeight: 'bold',
              minWidth: 18,
              height: 18,
              fontSize: 12
            }
          }}
        >
          <ChatIcon fontSize="medium" />
        </Badge>
      </Fab>
      
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { 
            width: 320,
            maxHeight: 480,
            borderRadius: '16px',
            boxShadow: '0 12px 28px rgba(0,0,0,0.15), 0 8px 10px rgba(0,0,0,0.12)',
            overflow: 'hidden'
          }
        }}
        sx={{ mt: -2 }}
      >
        <Paper elevation={0} sx={{ pb: 1 }}>
          <Box 
            sx={{ 
              p: 2.5, 
              borderBottom: '1px solid', 
              borderColor: 'divider', 
              background: 'linear-gradient(90deg, #0084FF 0%, #00B2FF 100%)', 
              color: 'white',
              position: 'relative'
            }}
          >
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>Messages</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 300 }}>
              Your friends ({friends.length})
            </Typography>
            <Box 
              sx={{ 
                position: 'absolute',
                left: 0,
                bottom: -15,
                width: '100%',
                height: 15,
                background: 'linear-gradient(180deg, rgba(0,132,255,0.15) 0%, rgba(255,255,255,0) 100%)'
              }} 
            />
          </Box>
          
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Click on a friend to start chatting
            </Typography>
          </Box>
        </Paper>
        
        {friendsLoading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Loading friends...
            </Typography>
          </Box>
        ) : friends.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <MessageIcon sx={{ fontSize: 48, color: '#0084FF', opacity: 0.5, mb: 2 }} />
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
              No friends yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add friends to start chatting!
            </Typography>
          </Box>
        ) : (
          <>
            <List sx={{ py: 0, overflowY: 'auto', maxHeight: 320 }}>
              {friends.map((friend) => {
                const unreadCount = getUnreadCount(friend._id);
                const hasConversation = hasActiveConversation(friend._id);
                return (
                  <React.Fragment key={friend._id}>
                    <ListItem 
                      button
                      onClick={() => handleConversationClick(friend._id)}
                      sx={{ 
                        py: 1.5,
                        backgroundColor: unreadCount > 0 ? 'rgba(0, 132, 255, 0.08)' : 'transparent',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 132, 255, 0.05)',
                          transform: 'translateX(4px)'
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Badge
                          color="success"
                          variant="dot"
                          overlap="circular"
                          invisible={!unreadCount}
                          anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                          }}
                          sx={{
                            '& .MuiBadge-badge': {
                              border: '2px solid white',
                              width: 12,
                              height: 12,
                              borderRadius: '50%'
                            }
                          }}
                        >
                          <Avatar 
                            src={friend.avatar} 
                            alt={friend.username || 'User'}
                            sx={{ 
                              width: 50, 
                              height: 50,
                              boxShadow: unreadCount > 0 ? '0 0 0 2px #0084FF' : 'none',
                              transition: 'box-shadow 0.2s ease'
                            }}
                          >
                            {(friend.username || 'U')?.charAt(0).toUpperCase()}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography 
                              variant="body1" 
                              component="span"
                              fontWeight={unreadCount > 0 ? 700 : 500}
                            >
                              {friend.username || 'Unknown User'}
                            </Typography>
                            {hasConversation && (
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ fontSize: '0.7rem' }}
                              >
                                {getLastMessageTime(friend._id)}
                              </Typography>
                            )}
                          </Box>
                        }
                        secondary={
                          hasConversation ? (
                            <Typography 
                              variant="body2" 
                              component="span"
                              noWrap
                              fontWeight={unreadCount > 0 ? 600 : 400}
                              sx={{
                                display: 'inline-block',
                                maxWidth: '180px',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                color: unreadCount > 0 ? '#0084FF' : 'text.secondary'
                              }}
                            >
                              {getLastMessageContent(friend._id)}
                            </Typography>
                          ) : null
                        }
                      />
                      {unreadCount > 0 && (
                        <Badge 
                          badgeContent={unreadCount} 
                          color="primary"
                          sx={{
                            ml: 1,
                            '& .MuiBadge-badge': {
                              backgroundColor: '#0084FF',
                              fontWeight: 'bold',
                              minWidth: 18,
                              height: 18
                            }
                          }}
                        />
                      )}
                    </ListItem>
                    <Divider variant="inset" component="li" sx={{ ml: 9 }} />
                  </React.Fragment>
                );
              })}
            </List>
            <Box sx={{ p: 2, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography 
                variant="body2" 
                color="primary" 
                fontWeight={600}
                sx={{ 
                  cursor: 'pointer', 
                  py: 0.5,
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
                onClick={() => {
                  navigate('/messages');
                  handleClose();
                }}
              >
                See All Messages
              </Typography>
            </Box>
          </>
        )}
      </Popover>
    </>
  );
};

export default FloatingChatButton; 