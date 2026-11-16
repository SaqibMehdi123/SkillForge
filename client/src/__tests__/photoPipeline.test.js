/**
 * F1: saveTaskPhoto / getUserPhotos / getUserPracticePhotos called
 *     `axios.post(...)` and `${API_URL}` WITHOUT importing axios or API_URL -
 *     every dispatch threw ReferenceError, which the catch swallowed, so the
 *     whole photo pipeline (capture, galleries, upload stats) was silently
 *     dead and practice.error filled with "API_URL is not defined".
 *
 * The fix routes all three thunks through the shared API instance (token
 * interceptor included) - these tests pin that they actually reach the API.
 */
import MockAdapter from 'axios-mock-adapter';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import API from '../api';
import {
  saveTaskPhoto,
  getUserPhotos,
  getUserPracticePhotos,
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
    practice: { tasks: [], completedTasks: [], currentTask: null, photos: [], practicePhotos: [] },
    auth: { user: { id: 'u1' } },
  });
});

afterEach(() => {
  http.restore();
});

describe('F1: photo thunks reach the API (were dead: axios/API_URL never imported)', () => {
  test('saveTaskPhoto POSTs to /photos and fulfills with the photo', async () => {
    http.onPost('/photos').reply(201, {
      photo: { id: 'p1', path: '/uploads/photos/p1.png', fullPath: 'http://x/uploads/photos/p1.png' },
    });
    http.onPut('/users/streak').reply(200, { streaks: { current: 1, best: 1 } });

    const action = await store.dispatch(
      saveTaskPhoto({
        imageData: 'data:image/png;base64,AAAA',
        taskName: 'Guitar',
        taskCategory: 'music',
        taskPriority: 'high',
        timestamp: new Date().toISOString(),
        sessionId: 's1',
      })
    );

    expect(action.type).toBe(saveTaskPhoto.fulfilled.type);
    expect(action.payload.id).toBe('p1');
    // saveTaskPhoto also fires the fire-and-forget streak check, so find
    // THE photo call specifically.
    const photoPost = http.history.post.find((r) => r.url === '/photos');
    expect(photoPost).toBeTruthy();
    const body = JSON.parse(photoPost.data);
    expect(body.taskName).toBe('Guitar');
    expect(body.sessionId).toBe('s1');
  });

  test('getUserPhotos GETs /photos and fulfills with the list', async () => {
    http.onGet('/photos').reply(200, { photos: [{ _id: 'a1', path: '/uploads/photos/a1.png' }] });

    const action = await store.dispatch(getUserPhotos());

    expect(action.type).toBe(getUserPhotos.fulfilled.type);
    expect(action.payload).toHaveLength(1);
    expect(http.history.get[0].url).toBe('/photos');
  });

  test('getUserPracticePhotos combines practice and general photos', async () => {
    http.onGet('/practice/photos').reply(200, {
      data: [{ id: 'pp1', url: '/uploads/photos/practice1.png' }],
    });
    http.onGet('/photos').reply(200, {
      photos: [{ _id: 'g1', path: '/uploads/photos/general1.png' }],
    });

    const action = await store.dispatch(getUserPracticePhotos());

    expect(action.type).toBe(getUserPracticePhotos.fulfilled.type);
    const urls = action.payload.map((p) => p.url);
    // Relative server paths are prefixed with SERVER_URL
    expect(urls.some((u) => u.endsWith('/uploads/photos/practice1.png'))).toBe(true);
    expect(urls.some((u) => u.endsWith('/uploads/photos/general1.png'))).toBe(true);
  });

  test('an empty gallery stays empty - no fake placeholder photos', async () => {
    http.onGet('/practice/photos').reply(200, { data: [] });
    http.onGet('/photos').reply(200, { photos: [] });

    const action = await store.dispatch(getUserPracticePhotos());

    expect(action.type).toBe(getUserPracticePhotos.fulfilled.type);
    // The dead via.placeholder.com fallback used to inject fake photos
    expect(action.payload).toEqual([]);
  });
});
