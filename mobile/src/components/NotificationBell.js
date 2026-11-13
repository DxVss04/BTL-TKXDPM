import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../context/NotificationContext';
import { colors } from '../theme';

const MAX_SHOWN = 99;

// Chuông sáng lên và có số đỏ khi còn thông báo chưa đọc
export default function NotificationBell({ onPress }) {
  const { unread } = useNotifications();
  const count = unread.length;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Thông báo, ${count} chưa đọc`}
      style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: count ? colors.warningLight : colors.primaryLight }}>
      <Ionicons name={count ? 'notifications' : 'notifications-outline'} size={24} color={count ? colors.warning : colors.primaryDark} />
      {count > 0 && (
        <View style={{ position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, borderWidth: 2, borderColor: colors.bg, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', lineHeight: 13 }}>{count > MAX_SHOWN ? `${MAX_SHOWN}+` : count}</Text>
        </View>
      )}
    </Pressable>
  );
}
