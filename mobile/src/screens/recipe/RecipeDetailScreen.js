import React, { useLayoutEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { confirm, s } from '../../components/ui';
import RecipeHtml from '../../components/RecipeHtml';
import api from '../../api';
import { errMsg } from '../../api/client';
import { colors } from '../../theme';

export default function RecipeDetailScreen({ navigation, route }) {
  const [recipe, setRecipe] = useState(route.params.recipe);

  const toggleFav = async () => {
    try {
      const r = await api.updateRecipe({ recipeId: recipe._id, favorite: !recipe.favorite });
      setRecipe(r.recipe);
    } catch (e) { Alert.alert('Lỗi', errMsg(e)); }
  };

  const remove = () => confirm('Xóa công thức', `Xóa "${recipe.name}"?`, async () => {
    try { await api.deleteRecipe(recipe._id); navigation.goBack(); } catch (e) { Alert.alert('Lỗi', errMsg(e)); }
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      title: recipe.name,
      headerRight: () => (
        <View style={s.row}>
          <Ionicons name={recipe.favorite ? 'heart' : 'heart-outline'} size={22} color={colors.danger} style={{ marginRight: 16 }} onPress={toggleFav} />
          <Ionicons name="create-outline" size={22} color={colors.primary} style={{ marginRight: 16 }} onPress={() => navigation.navigate('RecipeForm', { recipe })} />
          <Ionicons name="trash-outline" size={22} color={colors.danger} style={{ marginRight: 8 }} onPress={remove} />
        </View>
      ),
    });
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', width: '100%', maxWidth: 820, alignSelf: 'center' }}>
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <Text style={{ fontSize: 22, fontWeight: '800' }}>{recipe.name}</Text>
        <Text style={{ color: colors.primary, marginTop: 4 }}>Nguyên liệu chính: {recipe.food?.name}</Text>
        {recipe.description ? <Text style={{ color: colors.textMuted, marginTop: 6 }}>{recipe.description}</Text> : null}
      </View>
      <RecipeHtml html={recipe.htmlContent} />
    </View>
  );
}
