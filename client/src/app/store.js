import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import practiceReducer from '../features/practice/practiceSlice';
import themeReducer from '../features/theme/themeSlice';
import friendsReducer from '../features/friends/friendsSlice';
import messagesReducer from '../features/messages/messagesSlice';
import uiReducer from '../features/ui/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    practice: practiceReducer,
    theme: themeReducer,
    friends: friendsReducer,
    messages: messagesReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
}); 