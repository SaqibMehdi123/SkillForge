import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import practiceReducer from '../features/practice/practiceSlice';
import themeReducer from '../features/theme/themeSlice';
import friendsReducer from '../features/friends/friendsSlice';
import messagesReducer from '../features/messages/messagesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    practice: practiceReducer,
    theme: themeReducer,
    friends: friendsReducer,
    messages: messagesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
}); 