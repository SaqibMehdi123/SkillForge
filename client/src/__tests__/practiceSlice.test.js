/**
 * Practice slice contract tests (audit fixes: duration unit chain + getHistory wipe).
 */
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import API from '../api';
import reducer, {
  savePracticeSession,
  getHistory,
  addTask,
  startTask,
} from '../features/practice/practiceSlice';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

let http;
let store;

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('token', 'test-token');
  http = new MockAdapter(API);
  store = mockStore({
    practice: {
      tasks: [],
      completedTasks: [],
      currentTask: null,
      photos: [],
      practicePhotos: [],
      loading: false,
      error: null,
    },
    auth: { user: { id: 'u1' } },
  });
});

afterEach(() => {
  http.restore();
});

describe('duration unit chain: tasks are measured in MINUTES end to end', () => {
  test('savePracticeSession sends duration in minutes (30 min must not become 0.5)', async () => {
    http.onPost('/practice/sessions').reply(201, { success: true, session: { _id: 's1' } });
    http.onGet('/practice/history').reply(200, []);

    await store.dispatch(
      savePracticeSession({
        name: 'Guitar',
        label: 'Guitar',
        category: 'music',
        priority: 'high',
        duration: 30, // minutes, exactly what AddTaskModal emits
        startTime: Date.now(),
        image: null,
      })
    );

    expect(http.history.post).toHaveLength(1);
    const body = JSON.parse(http.history.post[0].data);
    expect(body.duration).toBe(30);
    // Rewards are computed from minutes with the server formula
    expect(body.xpEarned).toBe(6);
    expect(body.coinsEarned).toBe(3);
  });

  test('startTask converts minutes to seconds for the timer', () => {
    const state = reducer(
      { tasks: [{ id: 7, duration: 30 }], completedTasks: [], currentTask: null },
      startTask(7)
    );
    expect(state.currentTask.remaining).toBe(1800);
  });

  test('addTask keeps the duration in minutes', () => {
    const state = reducer(
      { tasks: [], completedTasks: [], currentTask: null },
      addTask({ name: 'Read', duration: 25 })
    );
    expect(state.tasks[0].duration).toBe(25);
  });
});

describe('getHistory must not wipe unsaved local tasks', () => {
  test('local tasks that the server does not know about survive a history refresh', async () => {
    // A user has one in-progress LOCAL task (numeric id, never saved to DB)
    // and the server returns one unfinished + one finished session.
    const prev = {
      tasks: [{ id: 1699999, name: 'Local draft', duration: 20, progress: 40, completed: false }],
      completedTasks: [],
      currentTask: null,
    };

    http.onGet('/practice/history').reply(200, [
      { _id: 'srv-unfinished', skill: 'Piano', duration: 600, completed: false },
      { _id: 'srv-done', skill: 'Guitar', duration: 1800, completed: true },
    ]);

    const store2 = mockStore({ practice: prev });
    await store2.dispatch(getHistory());

    const actions = store2.getActions();
    const fulfilled = actions.find((a) => a.type === getHistory.fulfilled.type);
    expect(fulfilled).toBeTruthy();

    const state = reducer(prev, fulfilled);

    // Server history is reflected...
    expect(state.completedTasks.map((t) => t._id)).toContain('srv-done');
    // ...and the local draft task is NOT deleted (it used to be wiped).
    expect(state.tasks.map((t) => t.name)).toContain('Local draft');
    expect(state.tasks.map((t) => t._id)).toContain('srv-unfinished');
  });
});
