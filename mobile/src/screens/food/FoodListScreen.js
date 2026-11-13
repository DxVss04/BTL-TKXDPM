import React, { useMemo, useState } from 'react';
import { FlatList, Image, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Chip, Empty, Fab, ListItem, Loading, Screen, SearchBar, useGrid } from '../../components/ui';
import { useFocusLoad } from '../../utils/hooks';
import api from '../../api';
import { imageUrl } from '../../config';
import { colors } from '../../theme';

export default function FoodListScreen({ navigation }) {
  const [foods, setFoods] = useState([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Tất cả');
  const grid = useGrid();

  const { loading, refreshing, onRefresh } = useFocusLoad(async () => {
    const r = await api.getFoods();
    setFoods(r.foods || []);
  }, []);

  const cats = useMemo(() => ['Tất cả', ...new Set(foods.map((f) => f.category?.name).filter(Boolean))], [foods]);
  const shown = foods.filter((f) => (!q || f.name.toLowerCase().includes(q.toLowerCase())) && (cat === 'Tất cả' || f.category?.name === cat));

  if (loading) return <Loading />;
  return (
    <Screen scroll={false}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <SearchBar value={q} onChangeText={setQ} placeholder="Tìm thực phẩm..." />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {cats.map((c) => <Chip key={c} label={c} active={cat === c} onPress={() => setCat(c)} />)}
        </ScrollView>
      </View>
      <FlatList
        key={grid.key}
        numColumns={grid.numColumns}
        columnWrapperStyle={grid.columnWrapperStyle}
        data={shown}
        keyExtractor={(f) => f._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={<Empty icon="nutrition-outline" text="Chưa có thực phẩm nào. Bấm + để thêm." />}
        renderItem={({ item }) => {
          const img = imageUrl(item.imageUrl);
          return grid.item(
            <ListItem
              title={item.name}
              subtitle={`${item.category?.name || ''} · đơn vị: ${item.unit?.name || ''}`}
              left={img ? <Image source={{ uri: img }} style={{ width: 44, height: 44, borderRadius: 8 }} /> : <Ionicons name="nutrition" size={32} color={colors.primary} />}
              right={<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
              onPress={() => navigation.navigate('FoodForm', { food: item })}
            />
          );
        }}
      />
      <Fab onPress={() => navigation.navigate('FoodForm')} />
    </Screen>
  );
}
