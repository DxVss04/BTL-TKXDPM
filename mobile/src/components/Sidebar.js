import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './ui';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { imageUrl } from '../config';
import { colors } from '../theme';
import { SIDEBAR_WIDTH } from '../utils/layout';

// Các tab chính (trùng tên với Tab.Screen) và các màn hình phụ hay dùng
const TABS = [
  { name: 'Home', label: 'Trang chủ', icon: 'home' },
  { name: 'Fridge', label: 'Tủ lạnh', icon: 'snow', type: 'fridge' },
  { name: 'Shopping', label: 'Đi chợ', icon: 'cart', type: 'shopping' },
  { name: 'Meal', label: 'Bữa ăn', icon: 'restaurant', type: 'meal' },
];
const SHORTCUTS = [
  { name: 'Chat', label: 'Trợ lý AI', icon: 'sparkles' },
  { name: 'Notifications', label: 'Thông báo', icon: 'notifications' },
  { name: 'RecipeList', label: 'Công thức', icon: 'book' },
  { name: 'Suggest', label: 'Gợi ý món', icon: 'bulb' },
  { name: 'Stats', label: 'Thống kê', icon: 'bar-chart' },
  { name: 'Group', label: 'Nhóm gia đình', icon: 'people' },
];

function NavItem({ label, icon, active, badge, onPress }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }}
      style={({ hovered, pressed }) => [styles.item, (hovered || pressed) && !active && styles.itemHover, active && styles.itemActive]}>
      <Ionicons name={active ? icon : `${icon}-outline`} size={20} color={active ? colors.primaryDark : colors.textMuted} />
      <Text style={[styles.itemText, active && styles.itemTextActive]} numberOfLines={1}>{label}</Text>
      {badge ? <View style={styles.badge}><Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text></View> : null}
    </Pressable>
  );
}

// Thanh điều hướng bên trái cho màn hình rộng. Nằm ngoài bộ điều hướng nên vẫn hiện khi mở trang chi tiết.
export default function Sidebar({ active, onSelectTab, onOpenScreen }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { unread } = useNotifications();
  const count = (type) => unread.filter((n) => n.data?.type === type).length;
  const shortcuts = user.role === 'admin' ? [...SHORTCUTS, { name: 'Admin', label: 'Quản trị', icon: 'shield-checkmark' }] : SHORTCUTS;

  return (
    <View style={[styles.side, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 12, paddingLeft: insets.left + 12 }]}>
      <View style={styles.brand}>
        <View style={styles.logo}><Ionicons name="basket" size={22} color="#fff" /></View>
        <Text style={styles.brandText}>Đi chợ tiện lợi</Text>
      </View>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {TABS.map((t) => (
          <NavItem key={t.name} {...t} active={active === t.name} badge={t.type && count(t.type)} onPress={() => onSelectTab(t.name)} />
        ))}
        <Text style={styles.group}>Tiện ích</Text>
        {shortcuts.map((t) => (
          <NavItem key={t.name} {...t} active={active === t.name} badge={t.name === 'Notifications' && unread.length} onPress={() => onOpenScreen(t.name)} />
        ))}
      </ScrollView>
      <Pressable onPress={() => onSelectTab('Profile')} accessibilityRole="button" accessibilityLabel="Trang cá nhân"
        style={({ hovered }) => [styles.user, (hovered || active === 'Profile') && styles.itemHover]}>
        <Avatar uri={imageUrl(user.photoUrl)} name={user.name} size={38} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
          <Text style={styles.userMail} numberOfLines={1}>{user.email}</Text>
        </View>
        <Ionicons name="settings-outline" size={18} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  side: { width: SIDEBAR_WIDTH, backgroundColor: '#fff', borderRightWidth: 1, borderColor: colors.border, paddingRight: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, marginBottom: 24 },
  logo: { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  brandText: { fontSize: 18, fontWeight: '800', color: colors.text },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginBottom: 2 },
  itemHover: { backgroundColor: colors.bg },
  itemActive: { backgroundColor: colors.primaryLight },
  itemText: { flex: 1, marginLeft: 12, fontSize: 15, color: colors.text },
  itemTextActive: { fontWeight: '700', color: colors.primaryDark },
  badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  group: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', marginTop: 20, marginBottom: 6, paddingHorizontal: 12 },
  user: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 12, borderTopWidth: 1, borderColor: colors.border, marginTop: 8 },
  userName: { fontWeight: '700', color: colors.text },
  userMail: { fontSize: 12, color: colors.textMuted },
});
