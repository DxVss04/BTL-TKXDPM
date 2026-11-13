import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card, Loading, Screen, SectionTitle, s } from '../../components/ui';
import NotificationBell from '../../components/NotificationBell';
import { useLayout } from '../../utils/layout';
import { useAuth } from '../../context/AuthContext';
import { useFocusLoad } from '../../utils/hooks';
import api from '../../api';
import { colors } from '../../theme';
import { expiryInfo, fmtDate, isListPending, MEALS, toYMD } from '../../utils/format';
import { scheduleExpiryReminders } from '../../utils/notifications';

const shortcuts = [
  { icon: 'nutrition-outline', label: 'Thực phẩm', screen: 'FoodList' },
  { icon: 'book-outline', label: 'Công thức', screen: 'RecipeList' },
  { icon: 'bulb-outline', label: 'Gợi ý món', screen: 'Suggest' },
  { icon: 'bar-chart-outline', label: 'Thống kê', screen: 'Stats' },
  { icon: 'people-outline', label: 'Nhóm', screen: 'Group' },
];

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { isWide } = useLayout();
  const [data, setData] = useState({ fridge: [], expiring: [], meals: [], myLists: [] });

  const { loading, refreshing, onRefresh } = useFocusLoad(async () => {
    if (!user?.group) return;
    const [fridge, meals, shopping] = await Promise.all([
      api.getFridge().catch(() => ({ items: [] })),
      api.getMeals({ date: toYMD(new Date()) }).catch(() => ({ plans: [] })),
      api.getShopping({ mine: 'true' }).catch(() => ({ lists: [] })),
    ]);
    const items = fridge.items || [];
    scheduleExpiryReminders(items);
    setData({
      fridge: items,
      expiring: items.filter((i) => expiryInfo(i.expiredDate).level !== 'ok'),
      meals: meals.plans || [],
      myLists: (shopping.lists || []).filter(isListPending),
    });
  }, [user?.group], { liveEvent: ['shopping:changed', 'meal:changed'] });

  if (loading) return <Loading />;

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <View style={[s.row, { justifyContent: 'space-between', marginBottom: 16 }]}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>Xin chào, {user?.name} 👋</Text>
          <Text style={{ color: colors.textMuted }}>Hôm nay là {fmtDate(new Date())}</Text>
        </View>
        <NotificationBell onPress={() => navigation.navigate('Notifications')} />
      </View>

      {!user?.group ? (
        <Card style={{ backgroundColor: colors.warningLight }}>
          <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 4 }}>Bạn chưa thuộc nhóm gia đình nào</Text>
          <Text style={{ color: colors.textMuted, marginBottom: 12 }}>Tạo nhóm mới hoặc nhờ trưởng nhóm thêm bạn bằng username để bắt đầu dùng tủ lạnh, danh sách mua sắm, bữa ăn.</Text>
          <Button title="Đi tới Nhóm gia đình" icon="people" onPress={() => navigation.navigate('Group')} />
        </Card>
      ) : (
        <>
          <View style={[s.row, { gap: 10, marginBottom: 6 }]}>
            <Stat icon="cube-outline" value={data.fridge.length} label="Trong tủ" onPress={() => navigation.navigate('Tabs', { screen: 'Fridge' })} />
            <Stat icon="alarm-outline" value={data.expiring.length} label="Sắp hết hạn" color={data.expiring.length ? colors.danger : colors.primary} onPress={() => navigation.navigate('Tabs', { screen: 'Fridge' })} />
            <Stat icon="cart-outline" value={data.myLists.length} label="Việc đi chợ" onPress={() => navigation.navigate('Tabs', { screen: 'Shopping' })} />
          </View>

          <View style={[s.row, { flexWrap: 'wrap', justifyContent: 'space-between', marginVertical: 8 }]}>
            {shortcuts.map((x) => (
              <Pressable key={x.screen} onPress={() => navigation.navigate(x.screen)} style={{ width: '19%', alignItems: 'center', paddingVertical: 8 }}>
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={x.icon} size={24} color={colors.primaryDark} />
                </View>
                <Text style={{ fontSize: 12, marginTop: 4, textAlign: 'center' }}>{x.label}</Text>
              </Pressable>
            ))}
          </View>

          <Button title="Hỏi trợ lý AI: hôm nay nấu gì?" variant="ghost" icon="sparkles-outline" onPress={() => navigation.navigate('Chat')} style={{ marginBottom: 8 }} />

          <Columns isWide={isWide} left={<>
          {data.expiring.length > 0 && (
            <>
              <SectionTitle title="⏰ Cần dùng sớm" />
              {data.expiring.slice(0, 5).map((i) => {
                const e = expiryInfo(i.expiredDate);
                return (
                  <Card key={i._id} style={[s.row, { justifyContent: 'space-between' }]}>
                    <Text style={{ fontSize: 16, fontWeight: '600' }}>{i.food?.name}</Text>
                    <Badge label={e.label} level={e.level} />
                  </Card>
                );
              })}
              <Button title="Gợi ý món từ đồ sắp hết hạn" variant="ghost" icon="bulb-outline" onPress={() => navigation.navigate('Suggest')} style={{ marginBottom: 8 }} />
            </>
          )}

          <SectionTitle title="🛒 Việc đi chợ của tôi" />
          {data.myLists.length === 0 ? (
            <Text style={{ color: colors.textMuted, marginBottom: 12 }}>Không có việc nào đang chờ.</Text>
          ) : data.myLists.map((l) => (
            <Card key={l._id} onPress={() => navigation.navigate('ShoppingDetail', { listId: l._id })}>
              <Text style={{ fontWeight: '700', fontSize: 16 }}>{l.name}</Text>
              <Text style={{ color: colors.textMuted }}>{fmtDate(l.date)} · {l.tasks.length ? `Còn ${l.tasks.filter((t) => !t.done).length}/${l.tasks.length} món` : 'Chưa có món'}</Text>
            </Card>
          ))}
          </>} right={<>
          <SectionTitle title="🍽️ Bữa ăn hôm nay" right={<Text style={{ color: colors.primary }} onPress={() => navigation.navigate('Tabs', { screen: 'Meal' })}>Xem lịch</Text>} />
          {MEALS.map((m) => {
            const list = data.meals.filter((p) => p.name === m.key);
            return (
              <Card key={m.key} style={s.row}>
                <Ionicons name={m.icon} size={22} color={colors.accent} style={{ marginRight: 10 }} />
                <Text style={{ fontWeight: '600', width: 80 }}>{m.label}</Text>
                <Text style={{ flex: 1, color: list.length ? colors.text : colors.textMuted }}>
                  {list.length ? list.map((p) => p.food?.name).join(', ') : 'Chưa lên kế hoạch'}
                </Text>
              </Card>
            );
          })}
          </>} />
        </>
      )}
    </Screen>
  );
}

// Hai cột trên màn hình rộng; trên điện thoại xếp chồng theo thứ tự trái rồi phải
function Columns({ isWide, left, right }) {
  if (!isWide) return <>{left}{right}</>;
  return (
    <View style={[s.row, { alignItems: 'flex-start', gap: 24, marginTop: 8 }]}>
      <View style={{ flex: 1 }}>{left}</View>
      <View style={{ flex: 1 }}>{right}</View>
    </View>
  );
}

function Stat({ icon, value, label, color = colors.primary, onPress }) {
  return (
    <Card onPress={onPress} style={{ flex: 1, alignItems: 'center', marginBottom: 0 }}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={{ fontSize: 22, fontWeight: '800', color }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 12 }}>{label}</Text>
    </Card>
  );
}
