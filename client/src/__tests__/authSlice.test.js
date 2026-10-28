/**
 * Frontend contract tests for authSlice (audit fixes C4, C5, C8).
 * axios-mock-adapter asserts the exact HTTP contract the backend exposes
 * (after the C3/C4 server fixes): PUT /users/xp, PUT /users/streak,
 * POST /users/badges.
 */
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import API from '../api';
import reducer, {
  login,
  register,
  loadUser,
  addXP,
  addBadge,
  updateStreak,
  logout,
} from '../features/auth/authSlice';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

let http;
let store;

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('token', 'test-token');
  // The app talks through the shared API instance (api.js) - mock that,
  // not the axios default instance.
  http = new MockAdapter(API);
  store = mockStore({
    auth: {
      isAuthenticated: true,
      user: {
        id: 'u1',
        _id: 'u1',
        username: 'alice',
        email: 'a@x.com',
        xp: 0,
        level: 1,
        coins: 0,
        badges: [],
        streaks: { current: 0, best: 0, lastUpdate: null },
      },
      loading: false,
      error: null,
    },
  });
});

afterEach(() => {
  http.restore();
});

describe('C5: the stored user object must expose an `id` field', () => {
  test('login.fulfilled normalizes _id into id', () => {
    const state = reducer(undefined, {
      type: login.fulfilled.type,
      payload: { user: { _id: 'abc123', username: 'bob', email: 'b@x.com' }, token: 't' },
    });

    expect(state.isAuthenticated).toBe(true);
    expect(state.user._id).toBe('abc123');
    // Messages.js compares msg.sender._id === user.id - without this
    // normalization every own message renders as the other person's bubble.
    expect(state.user.id).toBe('abc123');
  });

  test('register.fulfilled normalizes _id into id', () => {
    const state = reducer(undefined, {
      type: register.fulfilled.type,
      payload: { user: { _id: 'reg42', username: 'carol' }, token: 't' },
    });
    expect(state.user.id).toBe('reg42');
  });

  test('loadUser.fulfilled normalizes _id into id', () => {
    const state = reducer(undefined, {
      type: loadUser.fulfilled.type,
      payload: { _id: 'load9', username: 'dave' },
    });
    expect(state.user.id).toBe('load9');
  });
});

describe('C8: logout must clear the persisted JWT', () => {
  test('logout removes the token from localStorage', () => {
    localStorage.setItem('token', 'jwt-that-must-die');
    localStorage.setItem('lastStreakUpdate', '123');

    reducer(undefined, logout());

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('lastStreakUpdate')).toBeNull();
  });

  test('logout resets auth state', () => {
    localStorage.setItem('token', 'jwt-that-must-die');
    const prev = store.getState().auth;
    const state = reducer(prev, logout());
    expect(state.isAuthenticated).toBe(false);
    expect(state.user.username).toBe('');
  });
});

describe('C4: XP / streak / badge calls must match the backend contract', () => {
  test('addXP sends PUT /api/users/xp (it used to POST /users/xp -> silent 404)', async () => {
    http.onPut('/users/xp').reply(200, { success: true, user: { xp: 10, level: 1, coins: 0 } });

    const result = await store.dispatch(addXP(10)).unwrap();

    expect(http.history.put).toHaveLength(1);
    expect(http.history.put[0].url).toBe('/users/xp');
    expect(JSON.parse(http.history.put[0].data)).toEqual({ xp: 10 });
    expect(result.userData.xp).toBe(10);
  });

  test('updateStreak sends PUT /api/users/streak (it used to POST /users/streak -> silent 404)', async () => {
    http.onPut('/users/streak').reply(200, {
      success: true,
      streaks: { current: 5, best: 5, lastUpdate: new Date().toISOString() },
    });
    http.onPost('/achievements/check-streak').reply(200, {});

    const result = await store.dispatch(updateStreak({ current: 5 })).unwrap();

    expect(http.history.put).toHaveLength(1);
    expect(http.history.put[0].url).toBe('/users/streak');
    expect(JSON.parse(http.history.put[0].data)).toEqual({ streak: 5 });
    expect(result.current).toBe(5);
  });

  test('addBadge sends POST /api/users/badges (it used to POST /users/badge -> silent 404)', async () => {
    http.onPost('/users/badges').reply(200, { success: true, badges: ['first_steps'] });

    await store.dispatch(addBadge('first_steps')).unwrap();

    expect(http.history.post).toHaveLength(1);
    expect(http.history.post[0].url).toBe('/users/badges');
    expect(JSON.parse(http.history.post[0].data)).toEqual({ badgeId: 'first_steps' });
  });
});

describe('token persistence on login/register', () => {
  test('login stores the token for the axios interceptor', async () => {
    http.onPost('/auth/login').reply(200, {
      user: { _id: 'u9', username: 'erin', email: 'e@x.com' },
      token: 'tok-123',
    });

    await store.dispatch(login({ email: 'e@x.com', password: 'pw' })).unwrap();
    expect(localStorage.getItem('token')).toBe('tok-123');
  });
});
