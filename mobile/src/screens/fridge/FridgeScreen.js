import React, { useLayoutEffect, useMemo, useState } from 'react';
import { ActionSheetIOS, Alert, FlatList, Image, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Chip, Empty, Fab, Loading, Screen, SearchBar, s, useGrid } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useAutoRead } from '../../context/NotificationContext';
import { useFocusLoad } from '../../utils/hooks';
import api from '../../api';
import { errMsg } from '../../api/client';
import { imageUrl } from '../../config';
import { colors } from '../../theme';
import { expiryInfo, fmtDate } from '../../utils/format';

export default function FridgeScreen({ navigation }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Tất cả');
  const grid = useGrid();
  useAutoRead((n) => n.data?.type === 'fridge');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('FoodList')} style={[s.row, { marginRight: 12 }]}>
          <Ionicons name="nutrition-outline" size={20} color={colors.primary} />
          <Text style={{ color: colors.primary, marginLeft: 4, fontWeight: '600' }}>Thực phẩm</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  const { loading, refreshing, onRefresh, reload } = useFocusLoad(async () => {
    if (!user?.group) return;
    const res = await api.getFridge();
    setItems(res.items || []);
  }, [user?.group]);

  const categories = useMemo(() => ['Tất cả', ...new Set(items.map((i) => i.food?.category?.name).filter(Boolean))], [items]);
  const shown = items.filter((i) =>
    (!q || i.food?.name.toLowerCase().includes(q.toLowerCase())) &&
    (cat === 'Tất cả' || i.food?.category?.name === cat));

  const remove = async (item, reason) => {
    try {
      await api.deleteFridge(item.food.name, reason);
      reload();
    } catch (e) { Alert.alert('Lỗi', errMsg(e)); }
  };

  const actions = (item) => {
    const opts = ['Sửa', 'Đã dùng hết', 'Bỏ đi (hỏng / hết hạn)', 'Xóa khỏi tủ', 'Hủy'];
    const handle = (i) => {
      if (i === 0) navigation.navigate('FridgeForm', { item });
      if (i === 1) remove(item, 'consume');
      if (i === 2) remove(item, 'waste');
      if (i === 3) remove(item);
    };
    if (Platform.OS === 'ios') ActionSheetIOS.showActionSheetWithOptions({ options: opts, cancelButtonIndex: 4, destructiveButtonIndex: 3 }, handle);
    else Alert.alert(item.food.name, 'Chọn thao tác', [
      { text: 'Đã dùng hết', onPress: () => handle(1) },
      { text: 'Bỏ đi', onPress: () => handle(2) },
      { text: 'Xóa', style: 'destructive', onPress: () => handle(3) },
    ], { cancelable: true });
  };

  if (!user?.group) return <Screen><Empty icon="people-outline" text="Hãy vào một nhóm gia đình để dùng tủ lạnh chung." /></Screen>;
  if (loading) return <Loading />;

  return (
    <Screen scroll={false}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <SearchBar value={q} onChangeText={setQ} placeholder="Tìm thực phẩm trong tủ..." />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((c) => <Chip key={c} label={c} active={cat === c} onPress={() => setCat(c)} />)}
        </ScrollView>
      </View>
      <FlatList
        key={grid.key}
        numColumns={grid.numColumns}
        columnWrapperStyle={grid.columnWrapperStyle}
        data={shown}
        keyExtractor={(i) => i._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={<Empty icon="snow-outline" text={items.length ? 'Không tìm thấy thực phẩm phù hợp' : 'Tủ lạnh đang trống. Bấm + để thêm.'} />}
        renderItem={({ item }) => {
          const e = expiryInfo(item.expiredDate);
          const img = imageUrl(item.food?.imageUrl);
          return grid.item(
            <Pressable onPress={() => navigation.navigate('FridgeForm', { item })} onLongPress={() => actions(item)} style={({ hovered }) => [s.card, s.row, hovered && s.cardHover]}>
              {img ? <Image source={{ uri: img }} style={{ width: 52, height: 52, borderRadius: 10, marginRight: 12 }} />
                : <View style={{ width: 52, height: 52, borderRadius: 10, marginRight: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="fast-food-outline" size={26} color={colors.primary} /></View>}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700' }}>{item.food?.name}</Text>
                <Text style={{ color: colors.textMuted }}>
                  {item.quantity} {item.food?.unit?.name}{item.location ? ` · ${item.location}` : ''} · HSD {fmtDate(item.expiredDate)}
                </Text>
                {item.note ? <Text style={{ color: colors.textMuted, fontStyle: 'italic' }} numberOfLines={1}>{item.note}</Text> : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Badge label={e.label} level={e.level} />
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} style={{ marginTop: 8 }} onPress={() => actions(item)} />
              </View>
            </Pressable>
          );
        }}
      />
      <Fab onPress={() => navigation.navigate('FridgeForm')} />
    </Screen>
  );
}
