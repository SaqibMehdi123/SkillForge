import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  navbarTitle: 'SkillTracker',
  sidebarOpen: false,
  darkMode: false,
  notifications: [],
  loading: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setNavbarTitle: (state, action) => {
      state.navbarTitle = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    setDarkMode: (state, action) => {
      state.darkMode = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.push(action.payload);
    },
    clearNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setNavbarTitle,
  toggleSidebar,
  setSidebarOpen,
  setDarkMode,
  addNotification,
  clearNotification,
  clearAllNotifications,
  setLoading,
} = uiSlice.actions;

export default uiSlice.reducer; 