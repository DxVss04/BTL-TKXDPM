import React, { useLayoutEffect } from 'react';
import { FlatList, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Empty, Loading, RedDot, Screen, s, useGrid } from '../../components/ui';
import { NOTIFICATION_ICONS, notificationTarget, useNotifications } from '../../context/NotificationContext';
import { useFocusLoad } from '../../utils/hooks';
import { colors } from '../../theme';
import { timeAgo } from '../../utils/format';

export default function NotificationsScreen({ navigation }) {
  const { items, unread, refresh, markRead, markAllRead } = useNotifications();
  const { loading, refreshing, onRefresh } = useFocusLoad(refresh, [refresh]);
  const hasUnread = unread.length > 0;
  const grid = useGrid();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (hasUnread ? (
        <Text onPress={markAllRead} style={{ color: colors.primary, fontWeight: '600', marginRight: 12 }}>Đọc tất cả</Text>
      ) : null),
    });
  }, [navigation, hasUnread, markAllRead]);

  if (loading) return <Loading />;

  const open = (n) => {
    if (!n.readAt) markRead([n.id]);
    const target = notificationTarget(n.data);
    if (target) navigation.navigate(...target);
  };

  return (
    <Screen scroll={false}>
      <FlatList
        key={grid.key}
        numColumns={grid.numColumns}
        columnWrapperStyle={grid.columnWrapperStyle}
        data={items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={<Empty icon="notifications-outline" text="Chưa có thông báo nào." />}
        renderItem={({ item }) => grid.item(
          <Card onPress={() => open(item)} style={!item.readAt && { backgroundColor: colors.primaryLight }}>
            <View style={s.row}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name={NOTIFICATION_ICONS[item.data?.type] || 'notifications'} size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: item.readAt ? '500' : '700', color: colors.text }}>{item.title}</Text>
                <Text style={{ color: colors.textMuted, marginTop: 2 }}>{item.body}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>{timeAgo(item.createdAt)}</Text>
              </View>
              {!item.readAt && <RedDot style={{ marginLeft: 8 }} />}
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}
