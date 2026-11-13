import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Button, Chip, DateField, Loading, Screen, SelectField } from '../../components/ui';
import api from '../../api';
import { errMsg } from '../../api/client';
import { colors } from '../../theme';
import { MEALS, toYMD } from '../../utils/format';

const buildTimestamp = (ymd, meal) => {
  const [y, m, d] = ymd.split('-').map(Number);
  const hour = MEALS.find((x) => x.key === meal)?.hour || 12;
  return new Date(y, m - 1, d, hour, 0, 0).toISOString();
};

export default function MealFormScreen({ navigation, route }) {
  const plan = route.params?.plan;
  const editing = !!plan;
  const [foods, setFoods] = useState(null);
  const [fridgeNames, setFridgeNames] = useState([]);
  const [foodName, setFoodName] = useState(plan?.food?.name || '');
  const [meal, setMeal] = useState(plan?.name || route.params?.meal || 'trưa');
  const [date, setDate] = useState(plan ? toYMD(plan.timestamp) : route.params?.date || toYMD(new Date()));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: editing ? 'Sửa bữa ăn' : 'Thêm món vào bữa ăn' });
    Promise.all([api.getFoods(), api.getFridge().catch(() => ({ items: [] }))])
      .then(([f, fr]) => { setFoods(f.foods || []); setFridgeNames((fr.items || []).map((i) => i.food?.name)); })
      .catch(() => setFoods([]));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (!foodName) return Alert.alert('Thiếu thông tin', 'Vui lòng chọn món / thực phẩm');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return Alert.alert('Lỗi', 'Ngày phải có dạng YYYY-MM-DD');
    setSaving(true);
    try {
      const timestamp = buildTimestamp(date, meal);
      if (editing) {
        const body = { planId: plan._id };
        if (foodName !== plan.food?.name) body.newFoodName = foodName;
        if (meal !== plan.name) body.newName = meal;
        if (date !== toYMD(plan.timestamp) || meal !== plan.name) body.newTimestamp = timestamp;
        if (Object.keys(body).length === 1) return navigation.goBack();
        await api.updateMeal(body);
      } else {
        await api.createMeal({ foodName, timestamp, name: meal });
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Lỗi', errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  if (!foods) return <Loading />;
  return (
    <Screen narrow>
      <SelectField
        label="Món / thực phẩm"
        value={foodName}
        onChange={setFoodName}
        options={foods.map((f) => ({ value: f.name, label: fridgeNames.includes(f.name) ? `${f.name}  ✓ có trong tủ` : f.name }))}
      />
      <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 6 }}>Bữa</Text>
      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        {MEALS.map((m) => <Chip key={m.key} label={m.label} active={meal === m.key} onPress={() => setMeal(m.key)} />)}
      </View>
      <DateField label="Ngày" value={date} onChange={setDate} />
      <Text style={{ color: colors.textMuted, marginBottom: 12, fontSize: 12 }}>Mẹo: ưu tiên chọn thực phẩm có dấu ✓ (đang có trong tủ lạnh) để tránh lãng phí.</Text>
      <Button title={editing ? 'Lưu thay đổi' : 'Thêm vào kế hoạch'} onPress={save} loading={saving} />
    </Screen>
  );
}
