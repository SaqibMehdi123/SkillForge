/**
 * F15: friendsSlice/messagesSlice catches read error.response.data.message
 *     WITHOUT optional chaining - a network failure (no response) threw a
 *     TypeError INSIDE the catch, and the thunk rejected with a serialized
 *     error; the UI rendered "undefined" alerts.
 *
 * F16: sendMessage pinned `Content-Type: multipart/form-data` manually,
 *     which omits the boundary - axios must be left alone with FormData.
 *
 * F20: after an achievement POST succeeds, the client never syncs the
 *     server-computed user { xp, level, coins, badges } into the store -
 *     the Navbar XP bar went stale until a reload.
 */
import MockAdapter from 'axios-mock-adapter';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import API from '../api';
import { getFriends, sendFriendRequest, acceptFriendRequest } from '../features/friends/friendsSlice';
import { sendMessage } from '../features/messages/messagesSlice';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

let http;
let store;

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('token', 'test-token');
  http = new MockAdapter(API);
  store = mockStore({
    friends: { friends: [], requests: [], pendingRequests: [], sentRequests: [], loading: false, error: null },
    messages: { conversations: [], currentConversation: [], loading: false, error: null },
    auth: { user: { id: 'u1', _id: 'u1' } },
  });
});

afterEach(() => {
  http.restore();
});

describe('F15: network failures produce friendly messages, not "undefined"', () => {
  test('getFriends rejects with a usable message when the network is down', async () => {
    http.onGet('/friends').networkError();

    const action = await store.dispatch(getFriends());

    expect(action.type).toBe(getFriends.rejected.type);
    expect(typeof action.payload).toBe('string');
    expect(action.payload).toMatch(/fail|try again|network/i);
    expect(action.payload.toLowerCase()).not.toContain('undefined');
  });

  test('sendFriendRequest rejects with a usable message on network error', async () => {
    http.onPost('/friends/requests').networkError();

    const action = await store.dispatch(sendFriendRequest({ recipientId: 'u9' }));

    expect(action.type).toBe(sendFriendRequest.rejected.type);
    expect(typeof action.payload).toBe('string');
    expect(action.payload.toLowerCase()).not.toContain('undefined');
  });

  test('acceptFriendRequest rejects with a usable message on network error', async () => {
    http.onPut('/friends/requests/abc/accept').networkError();

    const action = await store.dispatch(acceptFriendRequest('abc'));

    expect(action.type).toBe(acceptFriendRequest.rejected.type);
    expect(typeof action.payload).toBe('string');
  });

  test('a 500 with an empty body still yields a friendly message', async () => {
    http.onGet('/friends').reply(500, null);

    const action = await store.dispatch(getFriends());

    expect(action.type).toBe(getFriends.rejected.type);
    expect(typeof action.payload).toBe('string');
    expect(action.payload.length).toBeGreaterThan(3);
  });
});

describe('F16: FormData uploads let axios set the multipart boundary', () => {
  test('sendMessage does not pin a boundary-less multipart Content-Type', async () => {
    http.onPost('/messages').reply(201, {
      data: { _id: 'm1', content: 'hi', sender: { _id: 'u1', username: 'alice' } },
    });

    const action = await store.dispatch(
      sendMessage({
        recipientId: 'u2',
        recipientName: 'bob',
        content: 'hello',
        image: new File([new Uint8Array([1, 2, 3])], 'shot.png', { type: 'image/png' }),
      })
    );

    expect(action.type).toBe(sendMessage.fulfilled.type);
    const sent = http.history.post[0];
    const ct = sent.headers['Content-Type'] || sent.headers['content-type'];
    // The broken value was exactly 'multipart/form-data' (no boundary)
    expect(ct).not.toBe('multipart/form-data');
  });
});
