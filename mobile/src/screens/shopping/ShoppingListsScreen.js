import React, { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Chip, Empty, Fab, Loading, RedDot, Screen, s, useGrid } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useAutoRead, useNotifications } from '../../context/NotificationContext';
import { useFocusLoad, useGroup } from '../../utils/hooks';
import api from '../../api';
import { colors } from '../../theme';
import { daysLeft, fmtDate, isListPending } from '../../utils/format';

export default function ShoppingListsScreen({ navigation }) {
  const { user } = useAuth();
  const { group } = useGroup();
  const [lists, setLists] = useState([]);
  const [tab, setTab] = useState('all');
  const grid = useGrid();
  const { unread } = useNotifications();
  const newListIds = new Set(unread.map((n) => n.data?.listId).filter(Boolean));
  // Thông báo không gắn với danh sách nào (đã bị xóa) không có chỗ để mở, xem tab là tính đã đọc
  useAutoRead((n) => n.data?.type === 'shopping' && !n.data?.listId);

  const { loading, refreshing, onRefresh } = useFocusLoad(async () => {
    if (!user?.group) return;
    const r = await api.getShopping();
    setLists(r.lists || []);
  }, [user?.group], { liveEvent: 'shopping:changed' });

  if (!user?.group) return <Screen><Empty icon="people-outline" text="Hãy vào một nhóm gia đình để dùng danh sách mua sắm chung." /></Screen>;
  if (loading) return <Loading />;

  const shown = lists.filter((l) => {
    if (tab === 'mine') return String(l.assignedTo?._id) === String(user._id);
    if (tab === 'todo') return isListPending(l);
    return true;
  });

  return (
    <Screen scroll={false}>
      <View style={[s.row, { paddingHorizontal: 16, paddingTop: 12 }]}>
        <Chip label="Tất cả" active={tab === 'all'} onPress={() => setTab('all')} />
        <Chip label="Giao cho tôi" active={tab === 'mine'} onPress={() => setTab('mine')} />
        <Chip label="Chưa xong" active={tab === 'todo'} onPress={() => setTab('todo')} />
      </View>
      <FlatList
        key={grid.key}
        numColumns={grid.numColumns}
        columnWrapperStyle={grid.columnWrapperStyle}
        data={shown}
        keyExtractor={(l) => l._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={<Empty icon="cart-outline" text={group?.isAdmin ? 'Chưa có danh sách nào. Bấm + để tạo và phân công.' : 'Chưa có danh sách mua sắm nào.'} />}
        renderItem={({ item }) => {
          const done = item.tasks.filter((t) => t.done).length;
          const total = item.tasks.length;
          const pct = total ? done / total : 0;
          const n = daysLeft(item.date);
          const isNew = newListIds.has(item._id);
          return grid.item(
            <Card onPress={() => navigation.navigate('ShoppingDetail', { listId: item._id })} style={isNew && { backgroundColor: colors.primaryLight, borderWidth: 1.5, borderColor: colors.primary }}>
              <View style={[s.row, { justifyContent: 'space-between' }]}>
                {isNew && <RedDot style={{ marginRight: 8 }} />}
                <Text style={{ fontSize: 17, fontWeight: '700', flex: 1 }}>{item.name}</Text>
                {total > 0 && done === total ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
              </View>
              <Text style={{ color: colors.textMuted, marginTop: 2 }}>
                <Ionicons name="calendar-outline" size={13} /> {fmtDate(item.date)}{n === 0 ? ' (hôm nay)' : n === 1 ? ' (ngày mai)' : ''}  ·  <Ionicons name="person-outline" size={13} /> {item.assignedTo?.name || '?'}
              </Text>
              <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, marginTop: 10, overflow: 'hidden' }}>
                <View style={{ width: `${pct * 100}%`, height: 6, backgroundColor: colors.primary }} />
              </View>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>Đã mua {done}/{total} món</Text>
            </Card>
          );
        }}
      />
      {group?.isAdmin && <Fab onPress={() => navigation.navigate('ShoppingForm')} />}
    </Screen>
  );
}
