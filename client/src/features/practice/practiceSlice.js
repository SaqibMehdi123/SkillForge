import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api';
import axios from 'axios';

// Async thunks for backend integration
export const startSession = createAsyncThunk(
  'practice/startSession',
  async ({ skill, duration }, { rejectWithValue }) => {
    try {
      const res = await API.post('/practice/start', { skill, duration });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to start session');
    }
  }
);

export const completeSession = createAsyncThunk(
  'practice/completeSession',
  async ({ sessionId, photo, xpEarned, coinsEarned }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      if (photo) formData.append('photo', photo);
      if (xpEarned) formData.append('xpEarned', xpEarned);
      if (coinsEarned) formData.append('coinsEarned', coinsEarned);
      const res = await API.post(`/practice/complete/${sessionId}`, formData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to complete session');
    }
  }
);

export const getHistory = createAsyncThunk(
  'practice/getHistory',
  async (_, { rejectWithValue }) => {
    try {
      const res = await API.get('/practice/history');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch history');
    }
  }
);

// Add these new async thunks for photo handling
export const saveTaskPhoto = createAsyncThunk(
  'practice/saveTaskPhoto',
  async ({ imageData, taskName, taskCategory, taskPriority, timestamp }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };
      
      const response = await axios.post(
        `${API_URL}/photos`, 
        { 
          imageData, 
          taskName,
          taskCategory,
          taskPriority, 
          timestamp 
        },
        config
      );
      
      return response.data.photo;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to save photo. Please try again.';
      return rejectWithValue(message);
    }
  }
);

export const getUserPhotos = createAsyncThunk(
  'practice/getUserPhotos',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      const response = await axios.get(`${API_URL}/photos`, config);
      return response.data.photos;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch photos. Please try again.';
      return rejectWithValue(message);
    }
  }
);

const API_URL = 'http://localhost:5000/api';

const initialState = {
  tasks: [], // all tasks (active sessions)
  completedTasks: [],
  currentTask: null, // { ...task, startTime, remaining, isRunning }
  photos: [], // Store user photos
  loading: false,
  error: null,
};

const practiceSlice = createSlice({
  name: 'practice',
  initialState,
  reducers: {
    addTask: (state, action) => {
      state.tasks.push({
        ...action.payload,
        id: Date.now(),
        progress: 0,
        completed: false,
        name: action.payload.name,
        label: action.payload.label || action.payload.name,
      });
    },
    startTask: (state, action) => {
      const task = state.tasks.find((t) => t.id === action.payload);
      if (task) {
        // Initialize with 0 progress
        const duration = task.duration || 30;
        state.currentTask = {
          ...task,
          startTime: Date.now(),
          remaining: duration * 60, // seconds
          isRunning: true,
          progress: 0, // Initialize progress at 0
        };
      }
    },
    pauseTask: (state) => {
      if (state.currentTask) {
        state.currentTask.isRunning = false;
      }
    },
    resumeTask: (state) => {
      if (state.currentTask) {
        state.currentTask.isRunning = true;
      }
    },
    updateTaskTime: (state, action) => {
      if (state.currentTask) {
        const remaining = action.payload;
        state.currentTask.remaining = remaining;
        
        // Calculate and update progress percentage based on time remaining
        const totalDuration = (state.currentTask.duration || 30) * 60;
        const elapsed = totalDuration - remaining;
        const progressPercent = Math.round((elapsed / totalDuration) * 100);
        
        state.currentTask.progress = progressPercent;
        
        // Also update the task in the tasks array
        const taskIndex = state.tasks.findIndex(t => t.id === state.currentTask.id);
        if (taskIndex !== -1) {
          state.tasks[taskIndex].progress = progressPercent;
        }
      }
    },
    completeTask: (state) => {
      if (state.currentTask) {
        const completed = {
          ...state.currentTask,
          completed: true,
          progress: 100,
        };
        state.completedTasks.push(completed);
        state.tasks = state.tasks.filter((t) => t.id !== completed.id);
        state.currentTask = null;
      }
    },
    stopTask: (state) => {
      state.currentTask = null;
    },
    setTaskImage: (state, action) => {
      if (state.currentTask) {
        state.currentTask.image = action.payload;
      }
    },
    updateTaskProgress: (state, action) => {
      const { taskId, progress } = action.payload;
      // Update in tasks array
      const taskIndex = state.tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        state.tasks[taskIndex].progress = progress;
      }
      
      // Update in current task if it's the active one
      if (state.currentTask && state.currentTask.id === taskId) {
        state.currentTask.progress = progress;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(startSession.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTask = action.payload;
        state.tasks.push(action.payload);
      })
      .addCase(startSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(completeSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(completeSession.fulfilled, (state, action) => {
        state.loading = false;
        state.completedTasks.push(action.payload);
        state.tasks = state.tasks.filter((t) => t._id !== action.payload._id);
        state.currentTask = null;
      })
      .addCase(completeSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getHistory.fulfilled, (state, action) => {
        state.tasks = action.payload.filter((s) => !s.completed);
        state.completedTasks = action.payload.filter((s) => s.completed);
      })
      .addCase(saveTaskPhoto.pending, (state) => {
        state.loading = true;
      })
      .addCase(saveTaskPhoto.fulfilled, (state, action) => {
        state.loading = false;
        state.photos.push(action.payload);
      })
      .addCase(saveTaskPhoto.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getUserPhotos.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUserPhotos.fulfilled, (state, action) => {
        state.loading = false;
        state.photos = action.payload;
      })
      .addCase(getUserPhotos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  addTask,
  startTask,
  pauseTask,
  resumeTask,
  updateTaskTime,
  completeTask,
  stopTask,
  setTaskImage,
  updateTaskProgress,
} = practiceSlice.actions;

export default practiceSlice.reducer; 