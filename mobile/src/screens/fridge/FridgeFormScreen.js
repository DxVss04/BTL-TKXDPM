import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Button, Chip, Input, Loading, Screen, SelectField, confirm } from '../../components/ui';
import api from '../../api';
import { errMsg } from '../../api/client';
import { colors } from '../../theme';
import { addDays, fmtDate } from '../../utils/format';

const DAYS = [1, 3, 5, 7, 14, 30];
const LOCATIONS = ['Ngăn mát', 'Ngăn đá', 'Cánh tủ', 'Ngăn rau'];

export default function FridgeFormScreen({ navigation, route }) {
  const item = route.params?.item;
  const editing = !!item;
  const [foods, setFoods] = useState(null);
  const [foodName, setFoodName] = useState(item?.food?.name || route.params?.foodName || '');
  const [quantity, setQuantity] = useState(item ? String(item.quantity) : '1');
  const [useWithin, setUseWithin] = useState(item ? String(item.useWithin) : '7');
  const [location, setLocation] = useState(item?.location || 'Ngăn mát');
  const [note, setNote] = useState(item?.note || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: editing ? `Sửa: ${item.food?.name}` : 'Thêm vào tủ lạnh' });
    // Tải ngay khi mở và tải lại khi quay về (sau khi tạo thực phẩm mới)
    const load = () => api.getFoods().then((r) => setFoods(r.foods || [])).catch(() => setFoods((f) => f || []));
    load();
    return navigation.addListener('focus', load);
  }, [navigation]); // eslint-disable-line react-hooks/exhaustive-deps

  const unit = foods?.find((f) => f.name === foodName)?.unit?.name || '';
  const start = editing ? new Date(item.startDate) : new Date();
  const expiry = Number(useWithin) > 0 ? addDays(start, Number(useWithin)) : null;

  const save = async () => {
    if (!foodName) return Alert.alert('Thiếu thông tin', 'Vui lòng chọn thực phẩm');
    if (!(Number(quantity) >= 0) || quantity === '') return Alert.alert('Thiếu thông tin', 'Số lượng không hợp lệ');
    if (!(Number(useWithin) > 0)) return Alert.alert('Thiếu thông tin', 'Số ngày sử dụng phải lớn hơn 0');
    setSaving(true);
    try {
      if (editing) {
        const body = { itemId: item._id };
        if (foodName !== item.food?.name) body.newFoodName = foodName;
        if (Number(quantity) !== item.quantity) body.newQuantity = quantity;
        if (Number(useWithin) !== item.useWithin) body.newUseWithin = useWithin;
        if (note !== (item.note || '')) body.newNote = note;
        if (location !== (item.location || '')) body.newLocation = location;
        if (Object.keys(body).length === 1) return navigation.goBack();
        await api.updateFridge(body);
      } else {
        await api.createFridge({ foodName, quantity, useWithin, note, location });
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Lỗi', errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = () => confirm('Xóa khỏi tủ lạnh', `Xóa "${item.food.name}" khỏi tủ lạnh?`, async () => {
    try { await api.deleteFridge(item.food.name); navigation.goBack(); } catch (e) { Alert.alert('Lỗi', errMsg(e)); }
  });

  if (!foods) return <Loading />;

  return (
    <Screen narrow>
      <SelectField
        label="Thực phẩm"
        value={foodName}
        onChange={setFoodName}
        options={foods.map((f) => ({ value: f.name, label: `${f.name} (${f.unit?.name || ''})` }))}
        placeholder={foods.length ? 'Chọn thực phẩm' : 'Chưa có thực phẩm nào'}
      />
      <Text style={{ color: colors.primary, marginTop: -6, marginBottom: 12 }} onPress={() => navigation.navigate('FoodForm')}>+ Thêm thực phẩm mới vào danh mục của nhóm</Text>

      <Input label={`Số lượng${unit ? ` (${unit})` : ''}`} value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" />

      <Input label="Sử dụng trong (ngày)" value={useWithin} onChangeText={setUseWithin} keyboardType="number-pad" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: -4, marginBottom: 4 }}>
        {DAYS.map((d) => <Chip key={d} label={`${d} ngày`} active={useWithin === String(d)} onPress={() => setUseWithin(String(d))} />)}
      </View>
      {expiry && <Text style={{ color: colors.textMuted, marginBottom: 12 }}>Hạn sử dụng dự kiến: <Text style={{ fontWeight: '700', color: colors.text }}>{fmtDate(expiry)}</Text></Text>}

      <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 6 }}>Vị trí lưu trữ</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
        {LOCATIONS.map((l) => <Chip key={l} label={l} active={location === l} onPress={() => setLocation(l)} />)}
      </View>

      <Input label="Ghi chú" value={note} onChangeText={setNote} multiline placeholder="VD: đã sơ chế, dùng cho bữa tối thứ 7..." />
      <Button title={editing ? 'Lưu thay đổi' : 'Thêm vào tủ'} onPress={save} loading={saving} />
      {editing && <Button title="Xóa khỏi tủ lạnh" variant="outline" onPress={remove} style={{ marginTop: 12, borderColor: colors.danger }} />}
    </Screen>
  );
}
