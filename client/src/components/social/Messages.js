import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
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
  Avatar,
  IconButton,
  Divider,
  Grid,
  CircularProgress,
  Alert,
  Badge,
  InputAdornment,
  Card,
  CardMedia,
  Drawer,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ImageList,
  ImageListItem,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  AttachFile as AttachFileIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  Photo as PhotoIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { 
  getConversations, 
  getConversation, 
  sendMessage,
  uploadMessageImage,
  clearMessagesError,
  clearCurrentConversation
} from '../../features/messages/messagesSlice';
import { getFriends } from '../../features/friends/friendsSlice';
import { getUserPracticePhotos } from '../../features/practice/practiceSlice';
import { format } from 'date-fns';

const Messages = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { user } = useSelector((state) => state.auth);
  const { conversations, currentConversation, loading, error } = useSelector((state) => state.messages);
  const { friends } = useSelector((state) => state.friends);
  const { practicePhotos, loading: photosLoading } = useSelector((state) => state.practice);
  
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [photosDialogOpen, setPhotosDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [imageSourceMenu, setImageSourceMenu] = useState(null);
  const [conversationCache, setConversationCache] = useState({});
  const [loadedChats, setLoadedChats] = useState({});
  const [pendingSentMessage, setPendingSentMessage] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load conversations and friends immediately when component mounts
  useEffect(() => {
    // Initial data loading - conversations list and friends list
    dispatch(getConversations());
    dispatch(getFriends());
    
    // Set up polling for updating the conversations list - not individual chats
    const interval = setInterval(() => {
      dispatch(getConversations());
    }, 15000); // Only check for new messages every 15 seconds
    
    return () => clearInterval(interval);
  }, [dispatch]);

  // Simplified useEffect to load the conversation only when userId changes
  useEffect(() => {
    if (userId) {
      // Always load the chat when a friend is selected
      dispatch(clearCurrentConversation());
      dispatch(getConversation(userId));
      
      // Mark this chat as loaded
      setLoadedChats(prev => ({
        ...prev,
        [userId]: true
      }));
    }
  }, [dispatch, userId]);
  
  // Scroll to bottom of messages when they change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation.messages]);

  // Load practice photos and ensure they're accessible on demand
  useEffect(() => {
    if (photosDialogOpen) {
      dispatch(getUserPracticePhotos());
    }
  }, [dispatch, photosDialogOpen]);

  // Add a new effect to clear any errors
  useEffect(() => {
    // Clear any errors when component mounts or unmounts
    return () => {
      dispatch(clearMessagesError());
    };
  }, [dispatch]);

  const handleSend = async () => {
    if ((!message.trim() && !imageFile && !selectedPhoto) || !userId) return;
    
    try {
      // Send the message
      await dispatch(sendMessage({
        recipientId: userId,
        recipientName: currentFriend?.username,
        content: message,
        image: imageFile,
        practicePhotoUrl: selectedPhoto,
      })).unwrap();
      
      // Clear the form
      setMessage('');
      setImageFile(null);
      setImagePreview('');
      setSelectedPhoto(null);
      
      // Explicitly reload the conversation to show the new message
      dispatch(getConversation(userId));
      
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImageFile(file);
    setSelectedPhoto(null); // Clear any selected practice photo
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview('');
    setSelectedPhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenPhotosDialog = () => {
    dispatch(getUserPracticePhotos());
    setPhotosDialogOpen(true);
  };

  const handleClosePhotosDialog = () => {
    setPhotosDialogOpen(false);
  };

  const handleSelectPhoto = (photoUrl) => {
    // Make sure the URL is properly formatted
    let formattedUrl = photoUrl;
    if (!photoUrl.startsWith('http')) {
      formattedUrl = `http://localhost:5000${photoUrl}`;
    }
    
    setSelectedPhoto(formattedUrl);
    setImageFile(null);
    setImagePreview('');
    setPhotosDialogOpen(false);
  };

  const handleCloseError = () => {
    dispatch(clearMessagesError());
  };

  const handleSelectConversation = (friendId) => {
    // Don't reload if clicking the same friend
    if (friendId === userId) return;
    
    // Navigate to the new conversation immediately
    navigate(`/messages/${friendId}`);
    
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  // Create a function to get the last message between current user and friend
  const getLastMessageContent = (friendId) => {
    const conversation = conversations.find(conv => conv._id === friendId);
    return conversation?.lastMessage?.content || '';
  };

  // Look for the friend data in both friends list and conversations
  const currentFriend = userId ? (
    friends.find(f => f._id === userId) || 
    conversations.find(c => c._id === userId)?.user || 
    { username: 'User', avatar: null }
  ) : null;

  // Add function to handle image source menu
  const handleImageSourceClick = (event) => {
    setImageSourceMenu(event.currentTarget);
  };
  
  const handleImageSourceClose = () => {
    setImageSourceMenu(null);
  };
  
  const handleDeviceImageClick = () => {
    fileInputRef.current.click();
    handleImageSourceClose();
  };
  
  const handlePracticeImageClick = () => {
    dispatch(getUserPracticePhotos());
    setPhotosDialogOpen(true);
    handleImageSourceClose();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, height: 'calc(100vh - 150px)' }}>
      <Box sx={{ display: 'flex', height: '100%' }}>
        {/* Conversations List (as Drawer on mobile, persistent on desktop) */}
        <Drawer
          variant={isMobile ? 'temporary' : 'persistent'}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{
            width: 320,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 320,
              position: isMobile ? 'fixed' : 'relative',
              height: isMobile ? '100%' : '100%',
              borderRight: isMobile ? 'none' : `1px solid ${theme.palette.divider}`,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              borderRadius: 0,
              boxShadow: isMobile ? '0 0 20px rgba(0,0,0,0.1)' : 'none',
            },
          }}
        >
          <Box sx={{ 
            p: 2.5, 
            borderBottom: '1px solid', 
            borderColor: 'divider', 
            background: 'linear-gradient(90deg, #0084FF 0%, #00B2FF 100%)', 
            color: 'white' 
          }}>
            <Typography variant="h6" fontWeight="bold">Messages</Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Search friends"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'white' }} />
                  </InputAdornment>
                ),
                sx: { 
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.5)'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.8)'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white'
                  },
                  '&::placeholder': {
                    color: 'rgba(255,255,255,0.8)',
                    opacity: 1
                  }
                }
              }}
              sx={{ mt: 1.5 }}
            />
          </Box>
          
          {loading && friends.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Loading conversations...
              </Typography>
            </Box>
          ) : friends.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No friends yet. Visit the Friends page to connect!
              </Typography>
              <Button 
                variant="outlined" 
                color="primary"
                component={RouterLink}
                to="/friends"
                sx={{ mt: 2 }}
              >
                Find Friends
              </Button>
            </Box>
          ) : (
            <>
              <List sx={{ 
                overflowY: 'auto', 
                height: '100%', 
                bgcolor: theme.palette.background.default,
                pt: 0
              }}>
                {/* Combined Friends List */}
                <Box sx={{ 
                  backgroundColor: 'rgba(0,0,0,0.02)', 
                  p: 1.5, 
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ px: 1, fontWeight: 500 }}>
                    All Friends
                  </Typography>
                </Box>
                
                {/* Show all friends, disable interaction during loading */}
                {friends.map((friend) => {
                  // Find if this friend has a conversation
                  const conversation = conversations.find(conv => conv._id === friend._id);
                  const hasConversation = Boolean(conversation);
                  const unreadCount = conversation?.unreadCount || 0;
                  const lastMessage = hasConversation ? getLastMessageContent(friend._id) : '';
                  const isSelected = userId === friend._id;
                  const isLoading = loading && isSelected;
                  
                  return (
                    <React.Fragment key={friend._id}>
                      <ListItem 
                        button
                        selected={isSelected}
                        onClick={() => handleSelectConversation(friend._id)}
                        sx={{ 
                          py: 1.5,
                          backgroundColor: isSelected ? 'rgba(0, 132, 255, 0.1)' : 'transparent',
                          borderLeft: isSelected ? '4px solid #0084FF' : '4px solid transparent',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 132, 255, 0.05)',
                            borderLeft: '4px solid rgba(0, 132, 255, 0.5)'
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Badge
                            color="success"
                            variant="dot"
                            overlap="circular"
                            invisible={unreadCount === 0}
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
                                width: 48, 
                                height: 48,
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
                                fontWeight={unreadCount > 0 ? 700 : 500}
                                sx={{ fontSize: '1rem' }}
                              >
                                {friend.username || 'Unknown User'}
                              </Typography>
                              {hasConversation && (
                                <Typography 
                                  variant="caption" 
                                  color="text.secondary"
                                  sx={{ fontSize: '0.7rem' }}
                                >
                                  {conversation?.lastMessage?.createdAt ? 
                                    new Date(conversation.lastMessage.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                                    ''}
                                </Typography>
                              )}
                            </Box>
                          }
                          secondary={
                            <Typography 
                              variant="body2" 
                              color={unreadCount > 0 ? '#0084FF' : 'text.secondary'}
                              noWrap
                              sx={{ 
                                fontWeight: unreadCount > 0 ? 600 : 400,
                                maxWidth: 190,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {isLoading ? 'Loading messages...' : 
                                (lastMessage || (isSelected ? 'Start typing a message...' : ''))}
                            </Typography>
                          }
                        />
                        {unreadCount > 0 && (
                          <Badge
                            badgeContent={unreadCount}
                            color="primary"
                            sx={{
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
            </>
          )}
        </Drawer>

        {/* Main Chat Area */}
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            ml: isMobile ? 0 : (drawerOpen ? 0 : 0),
            bgcolor: '#F0F2F5', // Facebook Messenger-like background
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
          }}
        >
          {userId ? (
            <>
              {/* Chat header */}
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 0,
                  boxShadow: 1,
                  bgcolor: '#0084FF',
                  color: 'white',
                }}
              >
                {isMobile && (
                  <IconButton edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 1, color: 'white' }}>
                    <ArrowBackIcon />
                  </IconButton>
                )}
                
                <Avatar 
                  src={currentFriend?.avatar} 
                  alt={currentFriend?.username}
                  sx={{ 
                    mr: 1.5, 
                    width: 44, 
                    height: 44,
                    border: '2px solid white' 
                  }}
                >
                  {currentFriend?.username?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="600">{currentFriend?.username}</Typography>
                  <Typography variant="caption">
                    Active now
                  </Typography>
                </Box>
              </Paper>

              {/* Messages */}
              <Box
                sx={{
                  flexGrow: 1,
                  overflowY: 'auto',
                  p: 2,
                  bgcolor: '#F0F2F5', // Facebook Messenger background
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress sx={{ color: '#0084FF' }} />
                  </Box>
                ) : currentConversation.messages.length === 0 && !pendingSentMessage ? (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 4, 
                    flexGrow: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center'
                  }}>
                    <Avatar
                      src={currentFriend?.avatar}
                      alt={currentFriend?.username}
                      sx={{ width: 80, height: 80, mx: 'auto', mb: 2, border: '3px solid #0084FF' }}
                    >
                      {currentFriend?.username?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="h6" color="text.primary" fontWeight="600">
                      {currentFriend?.username}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                      This is the beginning of your conversation with {currentFriend?.username}.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Say hi to start chatting! Your conversations are private and only visible to you and {currentFriend?.username}.
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Box sx={{ flexGrow: 1 }}>
                      {/* Combine real messages with pending message for display */}
                      {[...currentConversation.messages, ...(pendingSentMessage ? [pendingSentMessage] : [])]
                        .map((msg, index, messagesArray) => {
                          const isCurrentUser = msg.sender._id === user.id;
                          const showAvatar = !isCurrentUser && 
                            (index === 0 || messagesArray[index - 1].sender._id !== msg.sender._id);
                          const nextIsFromSameSender = 
                            index < messagesArray.length - 1 && 
                            messagesArray[index + 1].sender._id === msg.sender._id;
                          
                          return (
                            <Box
                              key={msg._id}
                              sx={{
                                display: 'flex',
                                flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                                alignItems: 'flex-end',
                                mb: nextIsFromSameSender ? 0.5 : 2,
                                mt: index === 0 ? 2 : 0,
                                opacity: msg.isOptimistic ? 0.7 : 1, // Slightly fade pending messages
                              }}
                            >
                              {showAvatar ? (
                                <Avatar
                                  src={msg.sender.avatar}
                                  alt={msg.sender.username}
                                  sx={{ 
                                    mr: 1, 
                                    ml: 0,
                                    width: 28, 
                                    height: 28, 
                                    alignSelf: 'flex-end',
                                    mb: 0.5
                                  }}
                                >
                                  {msg.sender.username?.charAt(0).toUpperCase()}
                                </Avatar>
                              ) : (
                                !isCurrentUser && <Box sx={{ width: 28, height: 28, mr: 1 }} />
                              )}
                              
                              <Box
                                sx={{
                                  maxWidth: '70%',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
                                }}
                              >
                                {msg.image && (
                                  <Card 
                                    sx={{ 
                                      mb: msg.content ? 1 : 0, 
                                      borderRadius: 2, 
                                      overflow: 'hidden',
                                      maxWidth: 300,
                                      boxShadow: 'none',
                                      border: isCurrentUser ? 'none' : '1px solid rgba(0,0,0,0.1)'
                                    }}
                                  >
                                    <CardMedia
                                      component="img"
                                      image={msg.image}
                                      alt="Message attachment"
                                      sx={{ maxHeight: 300, objectFit: 'contain' }}
                                    />
                                  </Card>
                                )}
                                
                                {msg.content && (
                                  <Paper
                                    sx={{
                                      p: 1.5,
                                      borderRadius: '18px',
                                      bgcolor: isCurrentUser ? '#0084FF' : 'white',
                                      color: isCurrentUser ? 'white' : 'text.primary',
                                      boxShadow: 'none',
                                      border: isCurrentUser ? 'none' : '1px solid rgba(0,0,0,0.1)',
                                      borderTopLeftRadius: !isCurrentUser && !showAvatar ? '4px' : '18px',
                                      borderTopRightRadius: isCurrentUser && (index === 0 || messagesArray[index - 1].sender._id !== msg.sender._id) ? '4px' : '18px',
                                      maxWidth: 'fit-content',
                                    }}
                                  >
                                    <Typography variant="body1">{msg.content}</Typography>
                                  </Paper>
                                )}
                                
                                {(!nextIsFromSameSender || index === messagesArray.length - 1) && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                      display: 'block',
                                      mt: 0.5,
                                      mx: 1,
                                      fontSize: '0.7rem'
                                    }}
                                  >
                                    {format(new Date(msg.createdAt), 'h:mm a')}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          );
                        })}
                    </Box>
                    <div ref={messagesEndRef} />
                  </>
                )}
              </Box>

              {/* Message Input */}
              <Paper
                component="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                sx={{
                  p: 2,
                  borderRadius: 0,
                  boxShadow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: 'white',
                  borderTop: '1px solid rgba(0,0,0,0.1)'
                }}
              >
                {(imagePreview || selectedPhoto) && (
                  <Box sx={{ position: 'relative', mb: 2, maxWidth: 200 }}>
                    <img 
                      src={imagePreview || selectedPhoto} 
                      alt="Preview" 
                      style={{ 
                        width: '100%', 
                        borderRadius: 8,
                        border: `1px solid ${theme.palette.divider}` 
                      }} 
                    />
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: -10,
                        right: -10,
                        bgcolor: 'background.paper',
                        border: `1px solid ${theme.palette.divider}`,
                        '&:hover': {
                          bgcolor: 'background.default',
                        },
                      }}
                      onClick={handleClearImage}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {/* Single image selection button */}
                  <IconButton
                    color="primary"
                    onClick={handleImageSourceClick}
                    title="Add image"
                    sx={{ color: '#0084FF' }}
                  >
                    <ImageIcon />
                  </IconButton>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />
                  
                  {/* Image source selection menu */}
                  <Menu
                    anchorEl={imageSourceMenu}
                    open={Boolean(imageSourceMenu)}
                    onClose={handleImageSourceClose}
                  >
                    <MenuItem onClick={handleDeviceImageClick}>
                      <AttachFileIcon fontSize="small" sx={{ mr: 1 }} />
                      Upload from device
                    </MenuItem>
                    <MenuItem onClick={handlePracticeImageClick}>
                      <PhotoIcon fontSize="small" sx={{ mr: 1 }} />
                      Select from practice photos
                    </MenuItem>
                  </Menu>
                  
                  <TextField
                    fullWidth
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      mx: 1,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '20px',
                        backgroundColor: '#F0F2F5',
                      }
                    }}
                  />
                  
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={(!message.trim() && !imageFile && !selectedPhoto) || loading}
                    type="submit"
                    sx={{ 
                      borderRadius: '50%', 
                      minWidth: 0, 
                      width: 40, 
                      height: 40, 
                      p: 0,
                      bgcolor: '#0084FF',
                      '&:hover': {
                        bgcolor: '#0078E7'
                      }
                    }}
                  >
                    <SendIcon fontSize="small" />
                  </Button>
                </Box>
              </Paper>
            </>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                p: 3,
                bgcolor: '#F0F2F5',
              }}
            >
              <Box 
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#0084FF',
                  color: 'white',
                  mb: 3
                }}
              >
                <ChatIcon sx={{ fontSize: 40 }} />
              </Box>
              <Typography variant="h5" gutterBottom fontWeight="600">
                Your Messages
              </Typography>
              <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3, maxWidth: 500 }}>
                Connect with your friends to start a conversation
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<PersonAddIcon />}
                onClick={() => navigate('/friends')}
                sx={{ 
                  bgcolor: '#0084FF',
                  '&:hover': {
                    bgcolor: '#0078E7'
                  }
                }}
              >
                Add Friends
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* Practice Photos Dialog */}
      <Dialog 
        open={photosDialogOpen} 
        onClose={handleClosePhotosDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Share Practice Photo
          <IconButton
            aria-label="close"
            onClick={handleClosePhotosDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {photosLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : practicePhotos && practicePhotos.length > 0 ? (
            <ImageList cols={isMobile ? 2 : 3} gap={8}>
              {practicePhotos.map((photo, index) => (
                <ImageListItem 
                  key={index} 
                  onClick={() => handleSelectPhoto(photo.url)}
                  sx={{ 
                    cursor: 'pointer',
                    borderRadius: 1,
                    overflow: 'hidden',
                    '&:hover': {
                      boxShadow: 3,
                      transform: 'scale(1.02)',
                      transition: 'all 0.2s'
                    }
                  }}
                >
                  <img
                    src={photo.url}
                    alt={`Practice photo ${index + 1}`}
                    loading="lazy"
                    style={{ height: 200, objectFit: 'cover' }}
                  />
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      left: 0, 
                      right: 0, 
                      bgcolor: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      p: 1,
                      fontSize: 12
                    }}
                  >
                    {format(new Date(photo.date), 'MMM d, yyyy')}
                  </Box>
                </ImageListItem>
              ))}
            </ImageList>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
              <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 2 }}>
                No practice photos available to share.
              </Typography>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={() => navigate('/practice')}
              >
                Go to Practice Session
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePhotosDialog}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Remove the error alert to prevent ObjectId error from showing */}
      {error && error !== "Class constructor ObjectId cannot be invoked without 'new'" && (
        <Alert severity="error" onClose={handleCloseError} sx={{ mt: 2 }}>
          {error.includes('only view conversations with your friends') ? 
            'This conversation is private and only visible to the participants.' : 
            error}
        </Alert>
      )}
    </Container>
  );
};

export default Messages; 