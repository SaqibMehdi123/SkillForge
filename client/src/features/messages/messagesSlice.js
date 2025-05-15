import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Get all conversations
export const getConversations = createAsyncThunk(
  'messages/getConversations',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get(`${API_URL}/messages/conversations`, config);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Get conversation with a specific user
export const getConversation = createAsyncThunk(
  'messages/getConversation',
  async (userId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get(`${API_URL}/messages/conversations/${userId}`, config);
      return { userId, messages: response.data.data };
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Send a message
export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ recipientId, content, image }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      };
      
      // Create form data for potential image upload
      const formData = new FormData();
      formData.append('recipientId', recipientId);
      formData.append('content', content);
      
      if (image) {
        formData.append('image', image);
      }
      
      const response = await axios.post(`${API_URL}/messages`, formData, config);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
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
          'Content-Type': 'multipart/form-data',
        },
      };
      
      const formData = new FormData();
      formData.append('image', image);
      
      const response = await axios.post(`${API_URL}/messages/upload-image`, formData, config);
      return response.data.imageUrl;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
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
      state.currentConversation = {
        userId: null,
        messages: [],
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Get conversations
      .addCase(getConversations.pending, (state) => {
        state.loading = true;
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
      .addCase(getConversation.pending, (state) => {
        state.loading = true;
      })
      .addCase(getConversation.fulfilled, (state, action) => {
        state.loading = false;
        state.currentConversation = {
          userId: action.payload.userId,
          messages: action.payload.messages,
        };
        
        // Update unread count in conversations list
        const conversationIndex = state.conversations.findIndex(
          conv => conv._id.toString() === action.payload.userId.toString()
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
        
        // Add message to current conversation
        if (state.currentConversation.userId && 
            state.currentConversation.userId.toString() === action.payload.recipient.toString()) {
          state.currentConversation.messages.push(action.payload);
        }
        
        // Update conversation list
        const conversationIndex = state.conversations.findIndex(
          conv => conv._id.toString() === action.payload.recipient.toString()
        );
        
        if (conversationIndex !== -1) {
          // Update last message
          state.conversations[conversationIndex].lastMessage = action.payload;
        } else {
          // Create new conversation entry if it doesn't exist
          // Note: This is a simplified approach, in a real app we'd fetch the full user details
          state.conversations.push({
            _id: action.payload.recipient,
            lastMessage: action.payload,
            unreadCount: 0,
            user: {
              _id: action.payload.recipient,
              // These fields would typically come from the API
              username: 'User', 
              avatar: null,
            }
          });
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
  clearCurrentConversation 
} = messagesSlice.actions;

export default messagesSlice.reducer; 