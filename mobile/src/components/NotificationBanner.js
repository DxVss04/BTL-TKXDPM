import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { subscribe } from '../utils/realtime';
import { NOTIFICATION_ICONS } from '../context/NotificationContext';
import { colors } from '../theme';
import { useLayout } from '../utils/layout';

const VISIBLE_MS = 5000;

// Hiện lần lượt các thông báo realtime ở đầu màn hình
export default function NotificationBanner({ onOpen }) {
  const insets = useSafeAreaInsets();
  const { isWide } = useLayout();
  const [queue, setQueue] = useState([]);
  const current = queue[0];
  const dismiss = () => setQueue((q) => q.slice(1));

  useEffect(() => subscribe('notification', (n) => setQueue((q) => [...q, n])), []);

  useEffect(() => {
    if (!current) return undefined;
    const timer = setTimeout(dismiss, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [current?.id]);

  if (!current) return null;

  return (
    <View style={[styles.wrap, { top: insets.top + 8 }, isWide && styles.wrapWide]} accessibilityRole="alert">
      <Pressable style={styles.banner} onPress={() => { dismiss(); onOpen(current.data); }}>
        <View style={styles.icon}>
          <Ionicons name={NOTIFICATION_ICONS[current.data?.type] || 'notifications'} size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.body} numberOfLines={2}>{current.body}</Text>
        </View>
        <Pressable onPress={dismiss} hitSlop={10} accessibilityLabel="Đóng thông báo">
          <Ionicons name="close" size={20} color={colors.textMuted} />
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, zIndex: 1000, elevation: 10 },
  wrapWide: { left: 'auto', right: 24, width: 380 },
  banner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 12, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 10 },
  icon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  body: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
});
