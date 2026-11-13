import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import api from '../api';
import { useAuth } from './AuthContext';
import { subscribe } from '../utils/realtime';
import { toYMD } from '../utils/format';

const NotificationContext = createContext(null);
export const useNotifications = () => useContext(NotificationContext);

// Giữ lại thông báo socket vừa tới nhưng phản hồi API (gửi trước đó) chưa có
function mergeFromServer(server, previous) {
  const newest = server[0]?.createdAt || '';
  return [...previous.filter((n) => n.createdAt > newest), ...server];
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const userId = user?._id;
  const [items, setItems] = useState([]);

  const refresh = useCallback(async () => {
    try {
      const r = await api.getNotifications();
      setItems((prev) => mergeFromServer(r.notifications || [], prev));
    } catch (_) { /* giữ dữ liệu cũ, sẽ tải lại khi có sự kiện tiếp theo */ }
  }, []);

  useEffect(() => {
    if (!userId) { setItems([]); return undefined; }
    refresh();
    const offNew = subscribe('notification', (n) => setItems((prev) => [n, ...prev.filter((x) => x.id !== n.id)]));
    const offChanged = subscribe('notifications:changed', refresh);
    return () => { offNew(); offChanged(); };
  }, [userId, refresh]);

  const markRead = useCallback((ids) => {
    if (!ids.length) return;
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, readAt: n.readAt || now } : n)));
    api.markNotificationsRead({ ids }).catch(refresh);
  }, [refresh]);

  const markAllRead = useCallback(() => {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || now })));
    api.markNotificationsRead({ all: true }).catch(refresh);
  }, [refresh]);

  const value = useMemo(() => ({
    items, unread: items.filter((n) => !n.readAt), refresh, markRead, markAllRead,
  }), [items, refresh, markRead, markAllRead]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

// Đánh dấu đã đọc các thông báo khớp điều kiện khi người dùng đang xem màn hình này
export function useAutoRead(match, onSeen) {
  const { unread, markRead } = useNotifications();
  const focused = useIsFocused();
  useEffect(() => {
    if (!focused) return;
    const seen = unread.filter(match);
    if (!seen.length) return;
    onSeen?.(seen);
    markRead(seen.map((n) => n.id));
  }, [focused, unread]); // eslint-disable-line react-hooks/exhaustive-deps
}

// Màn hình cần mở khi bấm vào thông báo: [tên màn hình, tham số]
export function notificationTarget(data) {
  if (data?.listId) return ['ShoppingDetail', { listId: data.listId }];
  if (data?.screen === 'Fridge') return ['Tabs', { screen: 'Fridge' }];
  if (data?.screen === 'Meal') return ['Tabs', { screen: 'Meal', params: { date: toYMD(data.date) } }];
  return null;
}

export const NOTIFICATION_ICONS = { shopping: 'cart', meal: 'restaurant', fridge: 'alarm' };
