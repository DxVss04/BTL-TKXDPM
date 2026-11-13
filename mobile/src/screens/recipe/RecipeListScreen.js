import React, { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Empty, Fab, Loading, Screen, SearchBar, s, useGrid } from '../../components/ui';
import { useFocusLoad } from '../../utils/hooks';
import api from '../../api';
import { colors } from '../../theme';
import { stripHtml } from '../../utils/format';

export default function RecipeListScreen({ navigation, route }) {
  const foodId = route.params?.foodId;
  const foodName = route.params?.foodName;
  const [recipes, setRecipes] = useState([]);
  const [q, setQ] = useState('');
  const grid = useGrid();

  const { loading, refreshing, onRefresh } = useFocusLoad(async () => {
    navigation.setOptions({ title: foodName ? `Công thức: ${foodName}` : 'Công thức nấu ăn' });
    const r = await api.getRecipes(foodId ? { foodId } : undefined);
    setRecipes(r.recipes || []);
  }, [foodId]);

  const shown = recipes.filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase()) || r.food?.name.toLowerCase().includes(q.toLowerCase()));
  if (loading) return <Loading />;

  return (
    <Screen scroll={false}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <SearchBar value={q} onChangeText={setQ} placeholder="Tìm công thức hoặc nguyên liệu..." />
      </View>
      <FlatList
        key={grid.key}
        numColumns={grid.numColumns}
        columnWrapperStyle={grid.columnWrapperStyle}
        data={shown}
        keyExtractor={(r) => r._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={<Empty icon="book-outline" text={foodName ? `Chưa có công thức cho "${foodName}". Bấm + để thêm.` : 'Chưa có công thức nào. Bấm + để thêm.'} />}
        renderItem={({ item }) => grid.item(
          <Card onPress={() => navigation.navigate('RecipeDetail', { recipe: item })}>
            <View style={[s.row, { justifyContent: 'space-between' }]}>
              <Text style={{ fontSize: 17, fontWeight: '700', flex: 1 }}>{item.name}</Text>
              {item.favorite && <Ionicons name="heart" size={20} color={colors.danger} />}
            </View>
            <Text style={{ color: colors.primary, marginTop: 2 }}>🥕 {item.food?.name}</Text>
            <Text style={{ color: colors.textMuted, marginTop: 4 }} numberOfLines={2}>{item.description || stripHtml(item.htmlContent)}</Text>
          </Card>
        )}
      />
      <Fab onPress={() => navigation.navigate('RecipeForm', { foodName })} />
    </Screen>
  );
}
