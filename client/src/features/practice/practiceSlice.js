import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api';
import { updateUserStreak } from '../auth/authSlice';
import { SERVER_URL } from '../../config';

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

// New async thunk to save practice session data
export const savePracticeSession = createAsyncThunk(
  'practice/savePracticeSession',
  async (taskData, { rejectWithValue, dispatch }) => {
    try {
      const { name, label, category, priority, duration, startTime, image } = taskData;
      
      // Calculate actual duration and end time
      const endTime = new Date();
      // Audit fix (duration unit chain): task.duration is ALREADY in minutes
      // (AddTaskModal emits minutes and startTask multiplies by 60 for the
      // timer). The old code divided by 60 again, storing a 30-minute session
      // as 0.5 minutes and rendering it as 0 minutes everywhere.
      const actualDurationMinutes = Math.max(1, Math.round(Number(duration) || 0));
      
      // Create the session data (server recomputes XP/coins; these mirror the
      // published formula)
      const sessionData = {
        skill: label || name,
        category,
        priority,
        duration: actualDurationMinutes,
        startedAt: new Date(startTime).toISOString(),
        endedAt: endTime.toISOString(),
        completed: true,
        xpEarned: Math.round(actualDurationMinutes / 5), // 1 XP per 5 minutes of practice
        coinsEarned: Math.round(actualDurationMinutes / 10), // 1 coin per 10 minutes of practice
        image: image // Pass the image to be linked to the practice session
      };
      
      // Log the data being sent
      console.log('Saving practice session:', sessionData);
      
      const response = await API.post('/practice/sessions', sessionData);
      
      console.log('Practice session saved:', response.data);
      
      // Fetch updated practice history to refresh dashboards and stats
      try {
        await dispatch(getHistory());
      } catch (historyError) {
        console.error('Error fetching updated practice history:', historyError);
        // Continue even if history fetch fails
      }
      
      return response.data;
    } catch (error) {
      console.error('Error saving practice session:', error);
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to save practice session. Please try again.';
      return rejectWithValue(message);
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
  async ({ imageData, taskName, taskCategory, taskPriority, timestamp, sessionId }, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };
      
      console.log('Saving task photo with data:', { 
        taskName,
        taskCategory,
        taskPriority,
        hasSessionId: !!sessionId 
      });
      
      const response = await axios.post(
        `${API_URL}/photos`, 
        { 
          imageData, 
          taskName,
          taskCategory,
          taskPriority, 
          timestamp,
          sessionId // Include sessionId if available
        },
        config
      );
      
      console.log('Photo saved successfully:', response.data);
      
      // Update user streak whenever a photo is uploaded
      try {
        const streakResult = await dispatch(updateUserStreak()).unwrap();
        console.log('Streak updated successfully after saving photo:', streakResult);
        
        // Show visual feedback
        if (streakResult.xpAdded > 0) {
          console.log(`XP earned: ${streakResult.xpAdded}`);
          // Could dispatch a notification action here
        }
        
      } catch (error) {
        console.error("Error updating streak:", error);
        // Continue even if streak update fails - at least the photo was saved
      }
      
      return response.data.photo;
    } catch (error) {
      console.error('Error saving photo:', error);
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

// Get user's practice photos
export const getUserPracticePhotos = createAsyncThunk(
  'practice/getUserPracticePhotos',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      console.log('Fetching practice photos...');
      
      // First, fetch the user's practice photos
      const response = await axios.get(`${API_URL}/practice/photos`, config);
      console.log('Practice photos response:', response.data);
      
      // Also fetch general photos which might be in a different endpoint
      const generalPhotosResponse = await axios.get(`${API_URL}/photos`, config);
      console.log('General photos response:', generalPhotosResponse.data);
      
      // Combine both sets of photos
      let combinedPhotos = [];
      
      // Process practice photos if they exist
      if (response.data && response.data.data) {
        const practicePhotos = response.data.data.map(photo => ({
          ...photo,
          url: photo.url && !photo.url.startsWith('http') ? 
            `${SERVER_URL}${photo.url}` : photo.url,
          source: 'practice'
        }));
        combinedPhotos = [...combinedPhotos, ...practicePhotos];
      }
      
      // Add general photos if they exist
      if (generalPhotosResponse.data && generalPhotosResponse.data.photos) {
        const generalPhotos = generalPhotosResponse.data.photos.map(photo => ({
          ...photo,
          url: photo.path && !photo.path.startsWith('http') ? 
            `${SERVER_URL}${photo.path}` : photo.path || photo.url,
          source: 'general'
        }));
        combinedPhotos = [...combinedPhotos, ...generalPhotos];
      }
      
      // For testing - if no photos were found, add mock photo data
      if (combinedPhotos.length === 0) {
        console.log('No real photos found, attempting to generate mock data');
        
        // Try to fetch any images from the server's public directory
        try {
          const mockResponse = await axios.get(`${API_URL}/public/images`, config);
          if (mockResponse.data && mockResponse.data.images) {
            const mockPhotos = mockResponse.data.images.map((path, index) => ({
              id: `mock-${index}`,
              url: `${SERVER_URL}${path}`,
              date: new Date().toISOString(),
              source: 'mock'
            }));
            combinedPhotos = [...combinedPhotos, ...mockPhotos];
          }
        } catch (mockError) {
          console.log('Could not load mock images:', mockError);
          // Create hardcoded placeholder photos if everything else fails
          combinedPhotos = [
            {
              id: 'sample-1',
              url: 'https://via.placeholder.com/300x200?text=Practice+Photo+1',
              date: new Date().toISOString(),
              source: 'placeholder'
            },
            {
              id: 'sample-2',
              url: 'https://via.placeholder.com/300x200?text=Practice+Photo+2',
              date: new Date(Date.now() - 86400000).toISOString(),
              source: 'placeholder'
            }
          ];
        }
      }
      
      console.log('Final photos to display:', combinedPhotos);
      
      // Sort by date if available
      combinedPhotos.sort((a, b) => {
        const dateA = a.date || a.createdAt || a.timestamp || 0;
        const dateB = b.date || b.createdAt || b.timestamp || 0;
        return new Date(dateB) - new Date(dateA); // Sort newest first
      });
      
      return combinedPhotos;
    } catch (error) {
      console.error('Error fetching practice photos:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to load practice photos');
    }
  }
);

// Load saved practice state from localStorage
const loadPracticeState = () => {
  try {
    const savedState = localStorage.getItem('practiceState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      
      // Check if the timer is still valid (hasn't expired)
      if (parsedState.currentTask && parsedState.currentTask.startTime) {
        const startTime = parsedState.currentTask.startTime;
        const duration = parsedState.currentTask.duration * 60; // convert to seconds
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        
        // If the timer hasn't expired, adjust the remaining time
        if (elapsedSeconds < duration) {
          const remaining = duration - elapsedSeconds;
          parsedState.currentTask.remaining = remaining;
          return parsedState;
        }
      }
    }
  } catch (error) {
    console.error('Error loading practice state:', error);
  }
  return null;
};

// Saved practice state or initial state
const savedState = loadPracticeState();

const initialState = savedState || {
  tasks: [], // all tasks (active sessions)
  completedTasks: [],
  currentTask: null, // { ...task, startTime, remaining, isRunning }
  photos: [], // Store user photos
  practicePhotos: [],
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
      savePracticeState(state);
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
        savePracticeState(state);
      }
    },
    pauseTask: (state) => {
      if (state.currentTask) {
        state.currentTask.isRunning = false;
        savePracticeState(state);
      }
    },
    resumeTask: (state) => {
      if (state.currentTask) {
        state.currentTask.isRunning = true;
        savePracticeState(state);
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
        
        savePracticeState(state);
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
        savePracticeState(state);
      }
    },
    stopTask: (state) => {
      state.currentTask = null;
      savePracticeState(state);
    },
    setTaskImage: (state, action) => {
      if (state.currentTask) {
        state.currentTask.image = action.payload;
        savePracticeState(state);
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
      
      savePracticeState(state);
    },
    clearPracticeError: (state) => {
      state.error = null;
      savePracticeState(state);
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
        // Make sure we handle cases where the backend returns empty arrays or non-array data
        if (Array.isArray(action.payload)) {
          state.loading = false;
          const serverTasks = action.payload.filter((s) => !s.completed);
          const serverCompleted = action.payload.filter((s) => s.completed);
          // Audit fix (getHistory wipe): tasks that exist only locally (numeric
          // id, no _id - i.e. created in this browser but not yet saved to the
          // server) used to be deleted by this handler. Keep them.
          const localOnlyTasks = state.tasks.filter(
            (t) => t.id !== undefined && t.id !== null && !t._id &&
              !serverTasks.some((s) => String(s.id) === String(t.id))
          );
          const localOnlyCompleted = state.completedTasks.filter((t) => !t._id);
          state.tasks = [...localOnlyTasks, ...serverTasks];
          state.completedTasks = [...localOnlyCompleted, ...serverCompleted];
          // Sort completed tasks by date, most recent first
          state.completedTasks.sort((a, b) => {
            const dateA = new Date(a.endedAt || a.completedAt || a.updatedAt || a.createdAt);
            const dateB = new Date(b.endedAt || b.completedAt || b.updatedAt || b.createdAt);
            return dateB - dateA;
          });
        } else {
          console.error('Practice history data is not an array:', action.payload);
          state.loading = false;
          // Keep whatever the user had locally instead of dropping it
          state.tasks = state.tasks.filter((t) => !t._id);
          state.completedTasks = state.completedTasks.filter((t) => !t._id);
        }
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
      })
      .addCase(getUserPracticePhotos.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUserPracticePhotos.fulfilled, (state, action) => {
        state.loading = false;
        state.practicePhotos = action.payload;
      })
      .addCase(getUserPracticePhotos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Helper function to save practice state to localStorage
function savePracticeState(state) {
  try {
    // Only save necessary data for timer persistence
    const stateToSave = {
      tasks: state.tasks,
      completedTasks: state.completedTasks,
      currentTask: state.currentTask,
    };
    localStorage.setItem('practiceState', JSON.stringify(stateToSave));
  } catch (error) {
    console.error('Error saving practice state:', error);
  }
}

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
  clearPracticeError,
} = practiceSlice.actions;

export default practiceSlice.reducer; 