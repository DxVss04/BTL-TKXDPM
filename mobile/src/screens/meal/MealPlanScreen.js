import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Empty, Loading, RedDot, Screen, confirm, s } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useAutoRead } from '../../context/NotificationContext';
import { useFocusLoad, useGroup } from '../../utils/hooks';
import api from '../../api';
import { errMsg } from '../../api/client';
import { colors } from '../../theme';
import { addDays, fmtDate, MEALS, toYMD, WEEKDAYS } from '../../utils/format';

export default function MealPlanScreen({ navigation, route }) {
  const { user } = useAuth();
  const { group } = useGroup();
  const [date, setDate] = useState(toYMD(new Date()));
  const [plans, setPlans] = useState([]);
  const isAdmin = !!group?.isAdmin;
  const [newDates, setNewDates] = useState(() => new Set());

  // Bấm thông báo sẽ nhảy tới đúng ngày có lịch
  useEffect(() => { if (route.params?.date) setDate(route.params.date); }, [route.params?.date]);

  // Mở tab là tính đã đọc, nhưng vẫn giữ chấm đỏ trên từng ngày cho tới khi xem ngày đó
  useAutoRead((n) => n.data?.type === 'meal', (seen) => {
    setNewDates((prev) => new Set([...prev, ...seen.map((n) => toYMD(n.data.date)).filter((x) => x !== date)]));
  });
  useEffect(() => {
    setNewDates((prev) => {
      if (!prev.has(date)) return prev;
      const next = new Set(prev);
      next.delete(date);
      return next;
    });
  }, [date]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('RecipeList')} style={[s.row, { marginRight: 12 }]}>
          <Ionicons name="book-outline" size={20} color={colors.primary} />
          <Text style={{ color: colors.primary, marginLeft: 4, fontWeight: '600' }}>Công thức</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  const { loading, refreshing, onRefresh, reload } = useFocusLoad(async () => {
    if (!user?.group) return;
    const r = await api.getMeals({ date });
    setPlans(r.plans || []);
  }, [user?.group, date], { liveEvent: 'meal:changed' });

  if (!user?.group) return <Screen><Empty icon="people-outline" text="Hãy vào một nhóm gia đình để lên kế hoạch bữa ăn." /></Screen>;

  // Dải 7 ngày bắt đầu từ thứ Hai của tuần đang chọn
  const d = new Date(date);
  const monday = addDays(d, -((d.getDay() + 6) % 7));
  const week = [...Array(7)].map((_, i) => addDays(monday, i));

  const remove = (p) => confirm('Xóa món', `Xóa "${p.food?.name}" khỏi ${p.name}?`, async () => {
    try { await api.deleteMeal(p._id); reload(); } catch (e) { Alert.alert('Lỗi', errMsg(e)); }
  });

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <View style={[s.row, { justifyContent: 'space-between', marginBottom: 8 }]}>
        <Ionicons name="chevron-back" size={24} color={colors.primary} onPress={() => setDate(toYMD(addDays(d, -7)))} />
        <Text style={{ fontWeight: '700', fontSize: 16 }}>Tuần {fmtDate(week[0])} - {fmtDate(week[6])}</Text>
        <Ionicons name="chevron-forward" size={24} color={colors.primary} onPress={() => setDate(toYMD(addDays(d, 7)))} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {week.map((w) => {
          const active = toYMD(w) === date;
          const today = toYMD(w) === toYMD(new Date());
          return (
            <Pressable key={toYMD(w)} onPress={() => setDate(toYMD(w))}
              style={{ width: 48, paddingVertical: 10, marginRight: 6, borderRadius: 12, alignItems: 'center', backgroundColor: active ? colors.primary : '#fff', borderWidth: today && !active ? 1.5 : 0, borderColor: colors.primary }}>
              <Text style={{ color: active ? '#fff' : colors.textMuted, fontSize: 12 }}>{WEEKDAYS[w.getDay()]}</Text>
              <Text style={{ color: active ? '#fff' : colors.text, fontWeight: '700', fontSize: 17 }}>{w.getDate()}</Text>
              {newDates.has(toYMD(w)) && <RedDot style={{ position: 'absolute', top: 5, right: 5 }} />}
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? <Loading /> : MEALS.map((m) => {
        const list = plans.filter((p) => p.name === m.key);
        return (
          <Card key={m.key}>
            <View style={[s.row, { justifyContent: 'space-between', marginBottom: list.length ? 8 : 0 }]}>
              <View style={s.row}>
                <Ionicons name={m.icon} size={22} color={colors.accent} />
                <Text style={{ fontSize: 17, fontWeight: '700', marginLeft: 8 }}>{m.label}</Text>
              </View>
              {isAdmin && <Ionicons name="add-circle" size={28} color={colors.primary} onPress={() => navigation.navigate('MealForm', { date, meal: m.key })} />}
            </View>
            {list.length === 0 ? <Text style={{ color: colors.textMuted, marginTop: 6 }}>Chưa có món</Text> : list.map((p) => (
              <Pressable key={p._id} onPress={() => navigation.navigate('RecipeList', { foodId: p.food?._id, foodName: p.food?.name })}
                onLongPress={() => isAdmin && navigation.navigate('MealForm', { plan: p })}
                style={[s.row, { paddingVertical: 8, borderTopWidth: 1, borderColor: colors.border }]}>
                <Ionicons name="restaurant-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
                <Text style={{ flex: 1, fontSize: 16 }}>{p.food?.name}</Text>
                <Text style={{ color: colors.primary, fontSize: 12, marginRight: 12 }}>Công thức</Text>
                {isAdmin && <Ionicons name="trash-outline" size={18} color={colors.danger} onPress={() => remove(p)} />}
              </Pressable>
            ))}
          </Card>
        );
      })}
      <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center' }}>
        {isAdmin ? 'Nhấn giữ một món để sửa · Bấm vào món để xem công thức' : 'Chỉ trưởng nhóm có thể lên kế hoạch bữa ăn'}
      </Text>
    </Screen>
  );
}
