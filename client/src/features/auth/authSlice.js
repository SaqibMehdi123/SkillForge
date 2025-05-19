import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Helper function to check if the stored token is valid
export const isTokenValid = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return false;
  }
  
  try {
    // JWT tokens are in format: header.payload.signature
    // We can decode the payload to check the expiration
    const payload = token.split('.')[1];
    if (!payload) return false;
    
    // Decode base64
    const decodedPayload = JSON.parse(atob(payload));
    
    // Check if token is expired
    if (decodedPayload.exp && decodedPayload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token'); // Remove expired token
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

// Register user
export const register = createAsyncThunk(
  'auth/register',
  async ({ username, email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password,
      });
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Registration failed. Please try again.';
      return rejectWithValue(message);
    }
  }
);

// Login user
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Login failed. Please try again.';
      return rejectWithValue(message);
    }
  }
);

// Load user
export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get(`${API_URL}/users/me`, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Update user streak when uploading a photo
export const updateUserStreak = createAsyncThunk(
  'auth/updateUserStreak',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      // Get current user state
      const { user } = getState().auth;
      
      // Make sure streaks object exists with proper default values
      const userStreaks = user.streaks || { current: 0, best: 0 };
      const currentStreak = userStreaks.current || 0;
      
      // Check last streak update time
      const lastStreakUpdate = localStorage.getItem('lastStreakUpdate');
      const currentTime = Date.now();
      const THIRTY_HOURS_MS = 30 * 60 * 60 * 1000; // 30 hours in milliseconds
      
      let newStreak = 1; // Default is 1 for a new streak day
      let xpToAdd = 10; // Base XP for daily activity
      let streakBroken = false;
      let shouldUpdateStreak = true; // Flag to determine if server update is needed
      
      console.log(`Checking streak. Current streak: ${currentStreak}`);
      
      if (lastStreakUpdate) {
        const lastUpdateTime = parseInt(lastStreakUpdate);
        const timeDiff = currentTime - lastUpdateTime;
        
        if (timeDiff < 24 * 60 * 60 * 1000) {
          // Less than 24 hours - same day, no streak change
          newStreak = currentStreak || 1; // Ensure at least 1
          xpToAdd = 5; // Grant small XP for additional activity in same day
          console.log(`Same day activity. Keeping streak at ${newStreak}`);
          shouldUpdateStreak = false; // Don't update streak on server for same-day activities
        } else if (timeDiff <= THIRTY_HOURS_MS) {
          // Between 24 and 30 hours - consecutive day, streak increases
          newStreak = (currentStreak || 0) + 1;
          console.log(`New day activity. Increasing streak to ${newStreak}`);
          
          // Bonus XP for maintaining streak
          if (newStreak >= 7) {
            xpToAdd = 50; // One week streak
          } else if (newStreak >= 3) {
            xpToAdd = 25; // Three day streak
          } else {
            xpToAdd = 15; // Starting streak
          }
        } else {
          // More than 30 hours - streak broken
          newStreak = 1;
          xpToAdd = 10; // Back to base XP
          streakBroken = true;
          console.log(`Streak broken. Resetting to ${newStreak}`);
        }
      } else {
        // First time activity - start with streak of 1
        console.log(`First activity. Starting streak at ${newStreak}`);
      }
      
      // Update local storage with current time
      localStorage.setItem('lastStreakUpdate', currentTime.toString());
      
      // Update streak in database only if needed
      let streakResult;
      if (shouldUpdateStreak) {
        streakResult = await dispatch(updateStreak({ current: newStreak })).unwrap();
        console.log("Streak update successful:", streakResult);
      } else {
        console.log("Skipping server streak update for same-day activity");
        streakResult = userStreaks; // Use existing streak data
      }
      
      // Always add some XP to encourage activity
      if (xpToAdd > 0) {
        const xpResult = await dispatch(addXP(xpToAdd)).unwrap();
        console.log("XP added:", xpToAdd, xpResult);
      }
      
      return {
        current: newStreak,
        xpAdded: xpToAdd,
        streakBroken
      };
    } catch (error) {
      console.error("Error in updateUserStreak:", error);
      return rejectWithValue("Failed to update streak");
    }
  }
);

// Update addXP action to save to database
export const addXP = createAsyncThunk(
  'auth/addXP',
  async (amount, { getState, rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      const response = await axios.post(
        `${API_URL}/users/xp`, 
        { xp: amount },
        config
      );

      return { xpAdded: amount, userData: response.data.user };
    } catch (error) {
      console.error('Error updating XP:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Update addBadge action to save to database
export const addBadge = createAsyncThunk(
  'auth/addBadge',
  async (badgeId, { getState, rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      const response = await axios.post(
        `${API_URL}/users/badge`, 
        { badgeId },
        config
      );

      return { badgeId, badges: response.data.badges };
    } catch (error) {
      console.error('Error adding badge:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Update updateStreak action to save to database
export const updateStreak = createAsyncThunk(
  'auth/updateStreak',
  async ({ current, best }, { getState, rejectWithValue }) => {
    try {
      console.log(`updateStreak called with current=${current}, best=${best}`);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      const payload = { streak: current };
      if (best) payload.bestStreak = best;

      console.log(`Sending streak update to server:`, payload);
      
      const response = await axios.post(
        `${API_URL}/users/streak`, 
        payload,
        config
      );

      console.log(`Streak update response:`, response.data);
      
      // Also check for streak achievements
      try {
        await axios.post(
          `${API_URL}/achievements/check-streak`,
          { streak: current },
          config
        );
      } catch (achievementError) {
        console.error('Error checking streak achievements:', achievementError);
        // Continue even if achievement checking fails
      }

      return response.data.streaks;
    } catch (error) {
      console.error('Error updating streak:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Update user profile
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };
      
      const response = await axios.put(
        `${API_URL}/users/me`, 
        profileData,
        config
      );
      
      return response.data.user;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Profile update failed. Please try again.';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  isAuthenticated: false,
  user: {
    id: null,
    username: '',
    email: '',
    avatar: null,
    xp: 0,
    coins: 0,
    level: 1,
    streaks: {
      current: 0,
      best: 0, // Renamed from longest to best for consistency
      lastUpdate: null
    },
    badges: [],
  },
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = { ...state.user, ...action.payload };
      state.loading = false;
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = initialState.user;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('lastStreakUpdate');
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    addCoins: (state, action) => {
      state.user.coins += action.payload;
    },
    spendCoins: (state, action) => {
      state.user.coins = Math.max(0, state.user.coins - action.payload);
    },
    setAvatar: (state, action) => {
      state.user.avatar = action.payload;
    },
    setStreak: (state, action) => {
      state.user.streaks.current = action.payload.current;
      state.user.streaks.lastUpdate = Date.now();
      if (action.payload.current > state.user.streaks.best) {
        state.user.streaks.best = action.payload.current;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Load User
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Streak
      .addCase(updateUserStreak.fulfilled, (state, action) => {
        state.user.streaks.current = action.payload.current;
        state.user.streaks.lastUpdate = Date.now();
        if (action.payload.current > state.user.streaks.best) {
          state.user.streaks.best = action.payload.current;
        }
      })
      // Add XP
      .addCase(addXP.fulfilled, (state, action) => {
        const { xpAdded, userData } = action.payload;
        
        if (userData) {
          // If server response has user data, use it
          state.user.xp = userData.xp;
          state.user.level = userData.level;
          state.user.coins = userData.coins;
        } else {
          // Fallback to local calculation if no server data
          state.user.xp += xpAdded;
          // Level up for every 100 XP
          while (state.user.xp >= state.user.level * 100) {
            state.user.xp -= state.user.level * 100;
            state.user.level += 1;
            state.user.coins += 10; // Reward coins on level up
          }
        }
      })
      .addCase(addXP.rejected, (state, action) => {
        console.error('XP update failed:', action.payload);
        // Still update locally as fallback
        state.user.xp += action.meta.arg;
      })
      // Add Badge
      .addCase(addBadge.fulfilled, (state, action) => {
        if (!state.user.badges.includes(action.payload.badgeId)) {
          state.user.badges.push(action.payload.badgeId);
        }
      })
      .addCase(addBadge.rejected, (state, action) => {
        console.error('Badge update failed:', action.payload);
        // Still update locally as fallback
        if (!state.user.badges.includes(action.meta.arg)) {
          state.user.badges.push(action.meta.arg);
        }
      })
      // Update Streak
      .addCase(updateStreak.fulfilled, (state, action) => {
        state.user.streaks = action.payload;
      })
      .addCase(updateStreak.rejected, (state, action) => {
        console.error('Streak update failed:', action.payload);
        // Still update locally as fallback
        if (action.meta.arg.current) {
          state.user.streaks.current = action.meta.arg.current;
          
          // Update best streak if needed
          if (action.meta.arg.current > state.user.streaks.best) {
            state.user.streaks.best = action.meta.arg.current;
          }
        }
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  addCoins,
  spendCoins,
  setAvatar,
  setStreak,
} = authSlice.actions;

export default authSlice.reducer;