import React, { useLayoutEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Empty, Input, Loading, Screen, SectionTitle, SelectField, Sheet, confirm, s } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useAutoRead } from '../../context/NotificationContext';
import { useFocusLoad, useGroup } from '../../utils/hooks';
import api from '../../api';
import { errMsg } from '../../api/client';
import { colors } from '../../theme';
import { fmtDate } from '../../utils/format';

export default function ShoppingDetailScreen({ navigation, route }) {
  const { listId } = route.params;
  const { user } = useAuth();
  const { group } = useGroup();
  const [list, setList] = useState(null);
  const [foods, setFoods] = useState([]);
  const [adding, setAdding] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState({ foodName: '', quantity: '' });
  const [saving, setSaving] = useState(false);
  const isAdmin = !!group?.isAdmin;
  useAutoRead((n) => n.data?.listId === listId);

  const { loading, reload, refreshing, onRefresh } = useFocusLoad(async () => {
    const [r, f] = await Promise.all([api.getShopping(), api.getFoods().catch(() => ({ foods: [] }))]);
    setList((r.lists || []).find((l) => l._id === listId) || null);
    setFoods(f.foods || []);
  }, [listId], { liveEvent: 'shopping:changed' });

  useLayoutEffect(() => {
    navigation.setOptions({
      title: list?.name || 'Danh sách',
      headerRight: () => isAdmin && list ? (
        <View style={s.row}>
          <Ionicons name="create-outline" size={22} color={colors.primary} style={{ marginRight: 16 }} onPress={() => navigation.navigate('ShoppingForm', { list })} />
          <Ionicons name="trash-outline" size={22} color={colors.danger} style={{ marginRight: 8 }} onPress={removeList} />
        </View>
      ) : null,
    });
  }); // cập nhật mỗi lần render

  const removeList = () => confirm('Xóa danh sách', `Xóa "${list.name}" và toàn bộ nhiệm vụ?`, async () => {
    try { await api.deleteList(list._id); navigation.goBack(); } catch (e) { Alert.alert('Lỗi', errMsg(e)); }
  });

  const canMark = list && (isAdmin || String(list.assignedTo?._id) === String(user._id));

  const toggle = async (t) => {
    if (!canMark) return Alert.alert('Không có quyền', 'Chỉ người được giao hoặc trưởng nhóm mới đánh dấu được.');
    try {
      await api.markTask(t._id, !t.done);
      await reload();
      if (!t.done && t.food) {
        Alert.alert('Đã mua ✅', `Cho "${t.food.name}" vào tủ lạnh luôn?`, [
          { text: 'Để sau' },
          { text: 'Cho vào tủ', onPress: () => navigation.navigate('FridgeForm', { foodName: t.food.name }) },
        ]);
      }
    } catch (e) { Alert.alert('Lỗi', errMsg(e)); }
  };

  const openAdd = () => { setForm({ foodName: '', quantity: '' }); setEditTask(null); setAdding(true); };
  const openEdit = (t) => { if (!isAdmin) return; setForm({ foodName: t.food?.name || '', quantity: t.quantity }); setEditTask(t); setAdding(true); };

  const submitTask = async () => {
    if (!form.foodName || !form.quantity.trim()) return Alert.alert('Thiếu thông tin', 'Chọn thực phẩm và nhập số lượng');
    setSaving(true);
    try {
      if (editTask) {
        const body = { taskId: editTask._id };
        if (form.foodName !== editTask.food?.name) body.newFoodName = form.foodName;
        if (form.quantity !== editTask.quantity) body.newQuantity = form.quantity;
        if (Object.keys(body).length > 1) await api.updateTask(body);
      } else {
        await api.createTasks(list._id, [{ foodName: form.foodName, quantity: form.quantity.trim() }]);
      }
      setAdding(false);
      reload();
    } catch (e) { Alert.alert('Lỗi', errMsg(e)); } finally { setSaving(false); }
  };

  const removeTask = (t) => confirm('Xóa nhiệm vụ', `Bỏ "${t.food?.name}" khỏi danh sách?`, async () => {
    try { await api.deleteTask(t._id); reload(); } catch (e) { Alert.alert('Lỗi', errMsg(e)); }
  });

  if (loading) return <Loading />;
  if (!list) return <Screen><Empty icon="alert-circle-outline" text="Không tìm thấy danh sách (có thể đã bị xóa)." /></Screen>;

  const done = list.tasks.filter((t) => t.done).length;
  const unitOf = (name) => foods.find((f) => f.name === name)?.unit?.name || '';

  return (
    <Screen narrow refreshing={refreshing} onRefresh={onRefresh}>
      <Card>
        <Text style={{ color: colors.textMuted }}><Ionicons name="calendar-outline" /> {fmtDate(list.date)}</Text>
        <Text style={{ marginTop: 4 }}><Ionicons name="person-outline" /> Người đi chợ: <Text style={{ fontWeight: '700' }}>{list.assignedTo?.name}</Text></Text>
        <Text style={{ marginTop: 4, color: colors.textMuted }}>Người tạo: {list.belongsTo?.name}</Text>
        {list.note ? <Text style={{ marginTop: 8, fontStyle: 'italic' }}>📝 {list.note}</Text> : null}
        <Text style={{ marginTop: 8, fontWeight: '600', color: colors.primary }}>Đã mua {done}/{list.tasks.length} món</Text>
      </Card>

      <SectionTitle title="Cần mua" right={isAdmin ? <Button title="Thêm món" icon="add" small onPress={openAdd} /> : null} />
      {list.tasks.length === 0 ? <Empty icon="list-outline" text={isAdmin ? 'Chưa có món nào. Bấm "Thêm món".' : 'Trưởng nhóm chưa thêm món nào.'} /> : null}
      {[...list.tasks].sort((a, b) => a.done - b.done).map((t) => (
        <Pressable key={t._id} onPress={() => toggle(t)} onLongPress={() => openEdit(t)} style={[s.card, s.row, t.done && { opacity: 0.6 }]}>
          <Ionicons name={t.done ? 'checkbox' : 'square-outline'} size={26} color={t.done ? colors.primary : colors.textMuted} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', textDecorationLine: t.done ? 'line-through' : 'none' }}>{t.food?.name}</Text>
            <Text style={{ color: colors.textMuted }}>{t.quantity} {t.food?.unit?.name || ''}</Text>
          </View>
          {isAdmin && <Ionicons name="trash-outline" size={20} color={colors.danger} onPress={() => removeTask(t)} />}
        </Pressable>
      ))}
      {isAdmin && list.tasks.length > 0 && <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center' }}>Nhấn giữ một món để sửa</Text>}

      <Sheet visible={adding} onClose={() => setAdding(false)} title={editTask ? 'Sửa món' : 'Thêm món cần mua'}>
            <SelectField label="Thực phẩm" value={form.foodName} onChange={(v) => setForm((f) => ({ ...f, foodName: v }))} options={foods.map((f) => ({ value: f.name, label: f.name }))} />
            {foods.length === 0 && <Text style={{ color: colors.primary, marginBottom: 8 }} onPress={() => { setAdding(false); navigation.navigate('FoodForm'); }}>+ Chưa có thực phẩm, tạo mới</Text>}
            <Input label={`Số lượng ${form.foodName ? `(${unitOf(form.foodName)})` : ''}`} value={form.quantity} onChangeText={(v) => setForm((f) => ({ ...f, quantity: v }))} placeholder="VD: 2" />
            <Button title={editTask ? 'Lưu' : 'Thêm'} onPress={submitTask} loading={saving} />
      </Sheet>
    </Screen>
  );
}
