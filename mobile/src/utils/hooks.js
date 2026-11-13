import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { subscribe } from './realtime';

// Thông tin nhóm của người dùng hiện tại (tự tải lại khi màn hình được focus)
export function useGroup() {
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const load = useCallback(async () => {
    if (!user?.group) { setGroup(null); return null; }
    try {
      const r = await api.getMembers();
      const g = {
        id: r.groupId,
        admin: r.groupAdmin,
        members: r.members || [],
        isAdmin: String(r.groupAdmin?._id) === String(user._id),
      };
      setGroup(g);
      return g;
    } catch (_) {
      setGroup(null);
      return null;
    }
  }, [user]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  return { group, reloadGroup: load, hasGroup: !!user?.group };
}

// Tải dữ liệu khi màn hình focus + trạng thái loading/refreshing.
// liveEvent: tên (hoặc mảng tên) sự kiện realtime khiến màn hình đang mở tự tải lại.
export function useFocusLoad(fn, deps = [], { liveEvent } = {}) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);
  useFocusEffect(useCallback(() => {
    let alive = true;
    (async () => { try { await run(); } finally { if (alive) setLoading(false); } })();
    return () => { alive = false; };
  }, [run]));
  useFocusEffect(useCallback(() => {
    if (!liveEvent) return undefined;
    const reload = () => { run().catch(() => {}); };
    const offs = [].concat(liveEvent).map((event) => subscribe(event, reload));
    return () => offs.forEach((off) => off());
  }, [run, String(liveEvent)]));
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await run(); } finally { setRefreshing(false); }
  }, [run]);
  return { loading, refreshing, onRefresh, reload: run };
}
