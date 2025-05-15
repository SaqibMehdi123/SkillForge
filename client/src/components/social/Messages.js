import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  AttachFile as AttachFileIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  Image as ImageIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { 
  getConversations, 
  getConversation, 
  sendMessage,
  uploadMessageImage,
  clearMessagesError,
} from '../../features/messages/messagesSlice';
import { getFriends } from '../../features/friends/friendsSlice';
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
  
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load conversations and friends
  useEffect(() => {
    dispatch(getConversations());
    dispatch(getFriends());
  }, [dispatch]);

  // Load conversation when user id changes
  useEffect(() => {
    if (userId) {
      dispatch(getConversation(userId));
    }
  }, [dispatch, userId]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation.messages]);

  const handleSend = async () => {
    if ((!message.trim() && !imageFile) || !userId) return;
    
    try {
      await dispatch(sendMessage({
        recipientId: userId,
        content: message,
        image: imageFile,
      })).unwrap();
      
      setMessage('');
      setImageFile(null);
      setImagePreview('');
    } catch (err) {
      // Error is handled in the slice
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImageFile(file);
    
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCloseError = () => {
    dispatch(clearMessagesError());
  };

  const handleSelectConversation = (userId) => {
    navigate(`/messages/${userId}`);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const currentFriend = friends.find(f => f._id === userId);

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
            },
          }}
        >
          <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6">Messages</Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Search conversations"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mt: 1 }}
            />
          </Box>

          <List sx={{ overflowY: 'auto', height: '100%' }}>
            {conversations.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No conversations yet. Start chatting with a friend!
                </Typography>
              </Box>
            ) : (
              conversations.map((conv) => (
                <React.Fragment key={conv._id}>
                  <ListItem 
                    button 
                    selected={userId === conv._id.toString()}
                    onClick={() => handleSelectConversation(conv._id)}
                  >
                    <ListItemAvatar>
                      <Badge
                        color="primary"
                        badgeContent={conv.unreadCount}
                        invisible={conv.unreadCount === 0}
                      >
                        <Avatar src={conv.user.avatar} alt={conv.user.username}>
                          {conv.user.username?.charAt(0).toUpperCase()}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={conv.user.username}
                      secondary={
                        conv.lastMessage?.content.length > 30
                          ? `${conv.lastMessage.content.substring(0, 30)}...`
                          : conv.lastMessage?.content
                      }
                      primaryTypographyProps={{
                        fontWeight: conv.unreadCount > 0 ? 'bold' : 'normal',
                      }}
                      secondaryTypographyProps={{
                        fontWeight: conv.unreadCount > 0 ? 'bold' : 'normal',
                      }}
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))
            )}
          </List>
        </Drawer>

        {/* Main Chat Area */}
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            ml: isMobile ? 0 : (drawerOpen ? 0 : 0),
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
                }}
              >
                {isMobile && (
                  <IconButton edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }}>
                    <ArrowBackIcon />
                  </IconButton>
                )}
                
                <Avatar 
                  src={currentFriend?.avatar} 
                  alt={currentFriend?.username}
                  sx={{ mr: 1.5 }}
                >
                  {currentFriend?.username?.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h6">{currentFriend?.username}</Typography>
              </Paper>

              {/* Messages */}
              <Box
                sx={{
                  flexGrow: 1,
                  overflowY: 'auto',
                  p: 2,
                  bgcolor: 'background.default',
                }}
              >
                {loading && currentConversation.messages.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : currentConversation.messages.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No messages yet. Start the conversation!
                    </Typography>
                  </Box>
                ) : (
                  currentConversation.messages.map((msg) => {
                    const isCurrentUser = msg.sender._id === user.id;
                    
                    return (
                      <Box
                        key={msg._id}
                        sx={{
                          display: 'flex',
                          justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                          mb: 2,
                        }}
                      >
                        {!isCurrentUser && (
                          <Avatar
                            src={msg.sender.avatar}
                            alt={msg.sender.username}
                            sx={{ mr: 1, alignSelf: 'flex-end' }}
                          >
                            {msg.sender.username?.charAt(0).toUpperCase()}
                          </Avatar>
                        )}
                        
                        <Box
                          sx={{
                            maxWidth: '70%',
                          }}
                        >
                          {msg.image && (
                            <Card sx={{ mb: 1, borderRadius: 2, overflow: 'hidden' }}>
                              <CardMedia
                                component="img"
                                image={msg.image}
                                alt="Message attachment"
                                sx={{ maxHeight: 300, objectFit: 'contain' }}
                              />
                            </Card>
                          )}
                          
                          <Paper
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: isCurrentUser ? 'primary.main' : 'background.paper',
                              color: isCurrentUser ? 'primary.contrastText' : 'text.primary',
                            }}
                          >
                            <Typography variant="body1">{msg.content}</Typography>
                          </Paper>
                          
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: 'block',
                              textAlign: isCurrentUser ? 'right' : 'left',
                              mt: 0.5,
                            }}
                          >
                            {format(new Date(msg.createdAt), 'MMM d, h:mm a')}
                          </Typography>
                        </Box>
                        
                        {isCurrentUser && (
                          <Avatar
                            src={user.avatar}
                            alt={user.username}
                            sx={{ ml: 1, alignSelf: 'flex-end' }}
                          >
                            {user.username?.charAt(0).toUpperCase()}
                          </Avatar>
                        )}
                      </Box>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
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
                }}
              >
                {imagePreview && (
                  <Box sx={{ position: 'relative', mb: 2, maxWidth: 200 }}>
                    <img 
                      src={imagePreview} 
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
                  <IconButton
                    color="primary"
                    onClick={() => fileInputRef.current.click()}
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
                  
                  <TextField
                    fullWidth
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{ mx: 1 }}
                  />
                  
                  <Button
                    variant="contained"
                    endIcon={<SendIcon />}
                    disabled={(!message.trim() && !imageFile) || loading}
                    type="submit"
                  >
                    Send
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
              }}
            >
              <Typography variant="h6" gutterBottom>
                Select a conversation or start a new one
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                Choose a friend from the list to start or continue a conversation
              </Typography>
              <Button 
                variant="outlined" 
                startIcon={<PersonAddIcon />}
                onClick={() => navigate('/friends')}
              >
                Add Friends
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={handleCloseError} sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Container>
  );
};

export default Messages; 