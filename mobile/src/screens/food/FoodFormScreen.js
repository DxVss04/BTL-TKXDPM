import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Loading, Screen, SelectField, confirm } from '../../components/ui';
import api from '../../api';
import { errMsg } from '../../api/client';
import { imageUrl } from '../../config';
import { colors } from '../../theme';

export default function FoodFormScreen({ navigation, route }) {
  const food = route.params?.food;
  const editing = !!food;
  const [name, setName] = useState(food?.name || '');
  const [category, setCategory] = useState(food?.category?.name || '');
  const [unit, setUnit] = useState(food?.unit?.name || '');
  const [image, setImage] = useState(null);
  const [opts, setOpts] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: editing ? 'Sửa thực phẩm' : 'Thêm thực phẩm' });
    Promise.all([api.getCategories(), api.getUnits()])
      .then(([c, u]) => setOpts({ categories: c.categories || [], units: u.units || [] }))
      .catch((e) => { Alert.alert('Lỗi', errMsg(e)); setOpts({ categories: [], units: [] }); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6, allowsEditing: true, aspect: [1, 1] });
    if (!res.canceled) setImage(res.assets[0]);
  };

  const save = async () => {
    if (!name.trim()) return Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên thực phẩm');
    if (!category) return Alert.alert('Thiếu thông tin', 'Vui lòng chọn danh mục');
    if (!unit) return Alert.alert('Thiếu thông tin', 'Vui lòng chọn đơn vị đo');
    setSaving(true);
    try {
      if (editing) {
        const body = { name: food.name };
        if (name.trim() !== food.name) body.newName = name.trim();
        if (category !== food.category?.name) body.newCategory = category;
        if (unit !== food.unit?.name) body.newUnit = unit;
        if (image) body.image = image;
        if (Object.keys(body).length === 1) return navigation.goBack();
        await api.updateFood(body);
      } else {
        await api.createFood({ name: name.trim(), foodCategoryName: category, unitName: unit, image });
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Lỗi', errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = () => confirm('Xóa thực phẩm', `Xóa "${food.name}"? Các mục tủ lạnh, nhiệm vụ mua sắm, bữa ăn và công thức liên quan cũng sẽ bị xóa.`, async () => {
    try { await api.deleteFood(food.name); navigation.goBack(); } catch (e) { Alert.alert('Lỗi', errMsg(e)); }
  });

  if (!opts) return <Loading />;
  const preview = image?.uri || imageUrl(food?.imageUrl);

  return (
    <Screen narrow>
      <Pressable onPress={pick} style={{ alignSelf: 'center', marginBottom: 16 }}>
        {preview ? <Image source={{ uri: preview }} style={{ width: 120, height: 120, borderRadius: 16 }} /> : (
          <View style={{ width: 120, height: 120, borderRadius: 16, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="camera-outline" size={36} color={colors.primary} />
            <Text style={{ color: colors.primary, marginTop: 4 }}>Chọn ảnh</Text>
          </View>
        )}
      </Pressable>
      <Input label="Tên thực phẩm" value={name} onChangeText={setName} placeholder="VD: Thịt ba chỉ" />
      <SelectField label="Danh mục" value={category} onChange={setCategory} options={opts.categories.map((c) => ({ value: c.name, label: c.name }))} />
      <SelectField label="Đơn vị đo" value={unit} onChange={setUnit} options={opts.units.map((u) => ({ value: u.name, label: u.name }))} />
      <Button title={editing ? 'Lưu thay đổi' : 'Thêm thực phẩm'} onPress={save} loading={saving} style={{ marginTop: 8 }} />
      {editing && <Button title="Xóa thực phẩm" variant="outline" onPress={remove} style={{ marginTop: 12, borderColor: colors.danger }} />}
      {editing && (
        <Button title="Cho vào tủ lạnh" variant="ghost" icon="snow-outline" style={{ marginTop: 12 }}
          onPress={() => navigation.navigate('FridgeForm', { foodName: food.name })} />
      )}
    </Screen>
  );
}
