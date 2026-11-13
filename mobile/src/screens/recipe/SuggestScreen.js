import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Badge, Button, Card, Chip, Empty, Loading, Screen, SectionTitle } from '../../components/ui';
import { useFocusLoad } from '../../utils/hooks';
import api from '../../api';
import { colors } from '../../theme';

export default function SuggestScreen({ navigation }) {
  const [data, setData] = useState({ suggestions: [], foodsWithoutRecipe: [] });
  const { loading, refreshing, onRefresh } = useFocusLoad(async () => {
    const r = await api.suggest();
    setData({ suggestions: r.suggestions || [], foodsWithoutRecipe: r.foodsWithoutRecipe || [] });
  }, []);

  if (loading) return <Loading />;
  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Text style={{ color: colors.textMuted, marginBottom: 12 }}>
        Gợi ý dựa trên thực phẩm đang có trong tủ lạnh, ưu tiên món dùng nguyên liệu sắp hết hạn.
      </Text>
      <Button title="Hỏi trợ lý AI để có thêm ý tưởng" variant="ghost" icon="sparkles-outline" onPress={() => navigation.navigate('Chat')} style={{ marginBottom: 12 }} />
      {data.suggestions.length === 0 ? (
        <Empty icon="bulb-outline" text="Chưa có gợi ý. Hãy thêm công thức cho các thực phẩm trong tủ lạnh." />
      ) : data.suggestions.map(({ recipe, daysLeft, reason }) => (
        <Card key={recipe._id} onPress={() => navigation.navigate('RecipeDetail', { recipe })}>
          <Text style={{ fontSize: 17, fontWeight: '700' }}>{recipe.name}</Text>
          <Text style={{ color: colors.textMuted, marginVertical: 4 }}>{recipe.description}</Text>
          <Badge label={reason} level={daysLeft <= 0 ? 'danger' : daysLeft <= 3 ? 'warning' : 'ok'} />
        </Card>
      ))}
      {data.foodsWithoutRecipe.length > 0 && (
        <>
          <SectionTitle title="Có trong tủ nhưng chưa có công thức" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {data.foodsWithoutRecipe.map((n) => <Chip key={n} label={`+ ${n}`} onPress={() => navigation.navigate('RecipeForm', { foodName: n })} />)}
          </View>
        </>
      )}
    </Screen>
  );
}
