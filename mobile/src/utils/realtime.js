import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import { TOKEN_KEY } from '../api/client';
import { SERVER_URL } from '../config';

const AUTH_RETRY_MS = 5000;
// Sự kiện báo "dữ liệu đã đổi": khi nối lại sau lúc mất mạng thì phát lại để màn hình tự tải lại
const RELOAD_EVENTS = ['notifications:changed', 'shopping:changed', 'meal:changed'];
const FORWARDED_EVENTS = ['notification', 'chat:delta', ...RELOAD_EVENTS];

let socket = null;
let retryTimer = null;
const listeners = new Map();

const dispatch = (event, payload) => listeners.get(event)?.forEach((fn) => fn(payload));

export function subscribe(event, fn) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
  return () => listeners.get(event).delete(fn);
}

export const isRealtimeConnected = () => !!socket?.connected;

// Socket bị từ chối khi access token hết hạn. Gọi API để axios tự làm mới token rồi kết nối lại.
function retryAfterAuthFailure() {
  clearTimeout(retryTimer);
  retryTimer = setTimeout(async () => {
    try {
      await api.getUser();
      socket?.connect();
    } catch (_) {
      if (socket) retryAfterAuthFailure();
    }
  }, AUTH_RETRY_MS);
}

export function connectRealtime() {
  if (socket) return;
  let connectedBefore = false;
  socket = io(SERVER_URL, {
    transports: ['websocket'],
    auth: (cb) => AsyncStorage.getItem(TOKEN_KEY).then((token) => cb({ token })),
  });
  socket.on('connect', () => {
    // Có thể đã lỡ thay đổi trong lúc mất kết nối
    if (connectedBefore) RELOAD_EVENTS.forEach((event) => dispatch(event));
    connectedBefore = true;
  });
  socket.on('connect_error', () => {
    if (!socket?.active) retryAfterAuthFailure();
  });
  FORWARDED_EVENTS.forEach((event) => socket.on(event, (payload) => dispatch(event, payload)));
}

export function disconnectRealtime() {
  clearTimeout(retryTimer);
  socket?.disconnect();
  socket = null;
}
