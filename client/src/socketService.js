/**
 * R26: Socket.IO client service.
 *
 * The audit found the client had socket.io-client installed but NEVER
 * imported - messaging was three concurrent 15-second pollers. This service
 * owns the single connection:
 *   - connects only while authenticated (JWT via the handshake auth payload),
 *   - reconnects automatically (socket.io default),
 *   - exposes onMessageNew for the store to subscribe to.
 *
 * The 60-second conversation poll remains as a reconnect fallback.
 */
import { io } from 'socket.io-client';
import { SERVER_URL } from './config';

let socket = null;

export function connectSocket(token, handlers = {}) {
  disconnectSocket();
  socket = io(SERVER_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 2000,
  });

  if (handlers.onMessageNew) {
    socket.on('message:new', handlers.onMessageNew);
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function isSocketConnected() {
  return Boolean(socket && socket.connected);
}
