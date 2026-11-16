import { createSlice, createAsyncThunk, createAction } from '@reduxjs/toolkit';
import axios from 'axios';

import { API_URL } from '../../config';
import API from '../../api';

// Get all conversations
export const getConversations = createAsyncThunk(
  'messages/getConversations',
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get(`${API_URL}/messages/conversations`, config);
      
      // Enhance conversation data with friend information when available
      const { friends } = getState().friends;
      const enhancedConversations = response.data.data.map(conv => {
        // Look for matching friend to get proper user details
        const matchingFriend = friends.find(f => f._id === conv._id);
        if (matchingFriend) {
          return {
            ...conv,
            user: {
              ...conv.user,
              username: matchingFriend.username || conv.user.username || 'User',
              avatar: matchingFriend.avatar || conv.user.avatar
            }
          };
        }
        return conv;
      });
      
      return enhancedConversations;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load conversations');
    }
  }
);

// Get conversation with a specific user - simplified to always get fresh data
export const getConversation = createAsyncThunk(
  'messages/getConversation',
  async (userId, { rejectWithValue, getState }) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      // Always make a fresh request with a timestamp to prevent caching
      const url = `${API_URL}/messages/conversations/${userId}?timestamp=${Date.now()}`;
      const response = await axios.get(url, config);
      
      // Get friend info to enhance messages if needed
      const { friends } = getState().friends;
      const friendInfo = friends.find(f => f._id === userId);
      
      // Make sure all messages have proper sender information
      const enhancedMessages = response.data.data.map(msg => {
        // Ensure sender always has a username
        if (!msg.sender.username && msg.sender._id === userId && friendInfo) {
          return {
            ...msg,
            sender: {
              ...msg.sender,
              username: friendInfo.username || 'User',
              avatar: friendInfo.avatar
            }
          };
        }
        return msg;
      });
      
      return { userId, messages: enhancedMessages };
    } catch (error) {
      if (error.response?.status === 403) {
        return rejectWithValue('You can only view conversations with your friends');
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to load conversation');
    }
  }
);

// Send a message with optimized handling for better UX
export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ recipientId, recipientName, content, image, practicePhotoUrl }, { rejectWithValue, getState }) => {
    try {
      // Audit fix F16/F33: go through the shared API instance (token comes
      // from the interceptor) and let axios set the multipart boundary itself
      // for FormData - the manual 'Content-Type: multipart/form-data' header
      // omitted the boundary and could 400 depending on the adapter.
      const formData = new FormData();
      formData.append('recipientId', recipientId);
      
      // Only append content if it's not empty
      if (content && content.trim()) {
        formData.append('content', content);
      }
      
      if (image) {
        formData.append('image', image);
      } else if (practicePhotoUrl) {
        // If a practice photo URL is provided, send it as an existing image
        formData.append('practicePhotoUrl', practicePhotoUrl);
      }
      
      const response = await API.post('/messages', formData);
      
      // Get current user details for better message display
      const { user } = getState().auth;
      
      // Add recipient name and sender details to the response for UI display
      return {
        ...response.data.data,
        recipientName,
        sender: {
          ...response.data.data.sender,
          username: user.username || response.data.data.sender.username,
          avatar: user.avatar || response.data.data.sender.avatar
        }
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

// Upload an image for a message
export const uploadMessageImage = createAsyncThunk(
  'messages/uploadImage',
  async (image, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          // F16: never pin multipart Content-Type manually - axios adds the
          // boundary itself when the body is FormData.
        },
      };
      
      const formData = new FormData();
      formData.append('image', image);
      
      const response = await axios.post(`${API_URL}/messages/upload-image`, formData, config);
      return response.data.imageUrl;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Message request failed. Please try again.');
    }
  }
);

const initialState = {
  conversations: [],
  currentConversation: {
    userId: null,
    messages: [],
  },
  loading: false,
  error: null,
};

// R26: dispatched by App's socket subscription when a `message:new` event
// arrives - see socketService.js
export const socketMessageReceived = createAction('messages/socketMessageReceived');

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    clearMessagesError: (state) => {
      state.error = null;
    },
    setCurrentConversation: (state, action) => {
      state.currentConversation.userId = action.payload;
    },
    clearCurrentConversation: (state) => {
      // Completely reset the current conversation state
      state.currentConversation = {
        userId: null,
        messages: [],
      };
      // Also clear any errors that might be related to previous conversations
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get conversations
      .addCase(getConversations.pending, (state) => {
        // Don't set loading true for conversationss, only for individual chats
        // This prevents the UI from showing loading indicators when refreshing the conversation list
      })
      .addCase(getConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
      })
      .addCase(getConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get conversation
      .addCase(getConversation.pending, (state, action) => {
        // Set loading true when fetching a specific conversation
        state.loading = true;
        
        // Clear current messages to prevent showing previous chat while loading new one
        state.currentConversation.messages = [];
      })
      .addCase(getConversation.fulfilled, (state, action) => {
        state.loading = false;
        
        // Always update with the latest messages
        state.currentConversation = {
          userId: action.payload.userId,
          messages: action.payload.messages || [],
        };
        
        // Update unread count in conversations list
        const conversationIndex = state.conversations.findIndex(
          conv => conv._id === action.payload.userId
        );
        
        if (conversationIndex !== -1) {
          state.conversations[conversationIndex].unreadCount = 0;
        }
      })
      .addCase(getConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        
        // First update the conversation list to show the latest message
        const conversationIndex = state.conversations.findIndex(
          conv => conv._id.toString() === action.payload.recipient.toString()
        );
        
        if (conversationIndex !== -1) {
          // Update last message
          state.conversations[conversationIndex].lastMessage = action.payload;
        } else {
          // Create new conversation entry if it doesn't exist
          state.conversations.push({
            _id: action.payload.recipient,
            lastMessage: action.payload,
            unreadCount: 0,
            user: {
              _id: action.payload.recipient,
              username: action.payload.recipientName || 'User', 
              avatar: null,
            }
          });
        }
      })
      // R26: real-time push from the socket service (App wires it up).
      .addCase(socketMessageReceived, (state, action) => {
        const msg = action.payload;
        if (!msg) return;
        const senderId = msg.sender?._id || msg.sender;

        // 1. Open conversation: append when it belongs here (dedupe - the
        //    sender's own REST response may already have added it).
        if (
          state.currentConversation.userId &&
          String(senderId) === String(state.currentConversation.userId)
        ) {
          const exists = (state.currentConversation.messages || []).some((m) => m._id === msg._id);
          if (!exists) state.currentConversation.messages.push(msg);
        }

        // 2. Conversation list: bump unread / refresh lastMessage.
        const conv = state.conversations.find((c) => String(c._id) === String(senderId));
        if (conv) {
          conv.unreadCount = (conv.unreadCount || 0) + (msg.read ? 0 : 1);
          conv.lastMessage = msg;
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Upload image
      .addCase(uploadMessageImage.pending, (state) => {
        state.loading = true;
      })
      .addCase(uploadMessageImage.fulfilled, (state, action) => {
        state.loading = false;
        // ImageUrl might be used in UI to preview the uploaded image
      })
      .addCase(uploadMessageImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearMessagesError, 
  setCurrentConversation, 
  clearCurrentConversation,
} = messagesSlice.actions;

export default messagesSlice.reducer; 