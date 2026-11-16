/**
 * F6 + F30 + F10:
 *   - F6: every 1-second updateTaskTime serialized the ENTIRE practice state
 *     (including megabyte base64 webcam screenshots) to localStorage -
 *     the 5 MB quota blew within seconds and the timer restore broke.
 *   - F30: logout only removed token/lastStreakUpdate - the next user on a
 *     shared machine inherited the previous user's practiceState and timers.
 *   - F10: updateProfile.fulfilled replaced state.user WITHOUT re-normalizing
 *     `id`, silently re-breaking the C5 chat-bubble identity fix after any
 *     profile save or avatar upload.
 */
import MockAdapter from 'axios-mock-adapter';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import API from '../api';
import practiceReducer, {
  addTask,
  startTask,
  updateTaskTime,
  setTaskImage,
} from '../features/practice/practiceSlice';
import authReducer, { updateProfile, logout } from '../features/auth/authSlice';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

let http;
let store;

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('token', 'test-token');
  http = new MockAdapter(API);
  store = mockStore({
    practice: { tasks: [], completedTasks: [], currentTask: null, photos: [], practicePhotos: [] },
    auth: { isAuthenticated: true, user: { id: 'u1', _id: 'u1', username: 'alice' } },
  });
});

afterEach(() => {
  http.restore();
});

const DATA_URL = 'data:image/jpeg;base64,' + 'A'.repeat(5000);

describe('F6: base64 images must never reach localStorage', () => {
  const basePractice = { tasks: [], completedTasks: [], currentTask: null, photos: [], practicePhotos: [] };

  test('setTaskImage stores the image in Redux but strips it from persistence', () => {
    let state = practiceReducer(basePractice, addTask({ name: 'Guitar', duration: 30 }));
    state = practiceReducer(state, startTask(state.tasks[0].id));
    state = practiceReducer(state, setTaskImage(DATA_URL));

    // Redux keeps the data URL for the capture flow...
    expect(state.currentTask.image).toBe(DATA_URL);

    // ...but localStorage must not contain megabyte payloads
    const persisted = localStorage.getItem('practiceState');
    expect(persisted).toBeTruthy();
    expect(persisted).not.toContain('data:image');
  });

  test('updateTaskTime does not write practiceState on every tick', () => {
    let state = practiceReducer(basePractice, addTask({ name: 'Piano', duration: 25 }));
    state = practiceReducer(state, startTask(state.tasks[0].id));

    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
    const before = setItemSpy.mock.calls.filter(([k]) => k === 'practiceState').length;

    for (const remaining of [1499, 1498, 1497, 1496]) {
      state = practiceReducer(state, updateTaskTime(remaining));
    }

    const writesDuringTicks = setItemSpy.mock.calls.filter(([k]) => k === 'practiceState').length - before;
    // Transition-only policy: ticking must be persistence-free
    expect(writesDuringTicks).toBe(0);
    setItemSpy.mockRestore();
  });
});

describe('F30: logout wipes the practice workspace for the next user', () => {
  test('practiceState and timer_* keys are cleared on logout', () => {
    localStorage.setItem('practiceState', JSON.stringify({ currentTask: { id: 1 } }));
    localStorage.setItem('timer_42', JSON.stringify({ endTime: Date.now() + 60000, isRunning: true }));
    localStorage.setItem('timer_43', JSON.stringify({ remainingTime: 100, isRunning: false }));

    const state = authReducer(
      { isAuthenticated: true, user: { id: 'u1' }, loading: false, error: null },
      logout()
    );

    expect(state.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('practiceState')).toBeNull();
    expect(localStorage.getItem('timer_42')).toBeNull();
    expect(localStorage.getItem('timer_43')).toBeNull();
  });
});

describe('F10: updateProfile keeps the normalized user identity', () => {
  test('fulfilled re-normalizes id from the server payload (C5 stays fixed)', async () => {
    http.onPut('/users/me').reply(200, {
      success: true,
      user: { _id: 'u1', username: 'alice-updated', email: 'alice@example.com' },
      // note: no `id` field - the server sends Mongo `_id`
    });

    await store.dispatch(updateProfile({ bio: 'new bio' }));

    const actions = store.getActions();
    const fulfilled = actions.find((a) => a.type === updateProfile.fulfilled.type);
    expect(fulfilled).toBeTruthy();

    const state = authReducer(
      { isAuthenticated: true, loading: true, error: null, user: { id: 'u1', _id: 'u1' } },
      fulfilled
    );

    // Before the fix, user.id became undefined here and Messages.js rendered
    // every own message as the other person's bubble again.
    expect(state.user.id).toBe('u1');
    expect(state.user._id).toBe('u1');
    expect(state.user.username).toBe('alice-updated');
  });
});
