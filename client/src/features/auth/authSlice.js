import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

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
      longest: 0,
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
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    addXP: (state, action) => {
      state.user.xp += action.payload;
      // Level up for every 100 XP
      while (state.user.xp >= state.user.level * 100) {
        state.user.xp -= state.user.level * 100;
        state.user.level += 1;
        state.user.coins += 10; // Reward coins on level up
      }
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
    addBadge: (state, action) => {
      if (!state.user.badges.includes(action.payload)) {
        state.user.badges.push(action.payload);
      }
    },
    updateStreak: (state, action) => {
      state.user.streaks.current = action.payload.current;
      if (action.payload.current > state.user.streaks.longest) {
        state.user.streaks.longest = action.payload.current;
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
      });
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  addXP,
  addCoins,
  spendCoins,
  setAvatar,
  addBadge,
  updateStreak,
} = authSlice.actions;
export default authSlice.reducer; 