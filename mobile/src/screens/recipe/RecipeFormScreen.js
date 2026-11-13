import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { Button, Input, Loading, Screen, SelectField } from '../../components/ui';
import api from '../../api';
import { errMsg } from '../../api/client';
import { buildRecipeHtml, parseRecipeHtml } from '../../utils/recipeHtml';

export default function RecipeFormScreen({ navigation, route }) {
  const recipe = route.params?.recipe;
  const editing = !!recipe;
  const parsed = parseRecipeHtml(recipe?.htmlContent);
  const [foods, setFoods] = useState(null);
  const [foodName, setFoodName] = useState(recipe?.food?.name || route.params?.foodName || '');
  const [name, setName] = useState(recipe?.name || '');
  const [description, setDescription] = useState(recipe?.description || '');
  const [ingredients, setIngredients] = useState(parsed.ingredients);
  const [steps, setSteps] = useState(parsed.steps);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: editing ? 'Sửa công thức' : 'Thêm công thức' });
    api.getFoods().then((r) => setFoods(r.foods || [])).catch(() => setFoods([]));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (!foodName) return Alert.alert('Thiếu thông tin', 'Chọn nguyên liệu chính');
    if (!name.trim()) return Alert.alert('Thiếu thông tin', 'Nhập tên món');
    if (!description.trim()) return Alert.alert('Thiếu thông tin', 'Nhập mô tả ngắn');
    const html = buildRecipeHtml(ingredients, steps);
    if (!html) return Alert.alert('Thiếu thông tin', 'Nhập nguyên liệu hoặc cách làm');
    setSaving(true);
    try {
      if (editing) {
        const body = { recipeId: recipe._id };
        if (foodName !== recipe.food?.name) body.newFoodName = foodName;
        if (name.trim() !== recipe.name) body.newName = name.trim();
        if (description !== recipe.description) body.newDescription = description;
        if (html !== recipe.htmlContent) body.newHtmlContent = html;
        if (Object.keys(body).length === 1) return navigation.goBack();
        const r = await api.updateRecipe(body);
        navigation.navigate('RecipeDetail', { recipe: r.recipe });
      } else {
        await api.createRecipe({ foodName, name: name.trim(), description, htmlContent: html });
        navigation.goBack();
      }
    } catch (e) {
      Alert.alert('Lỗi', errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  if (!foods) return <Loading />;
  return (
    <Screen narrow>
      <Input label="Tên món" value={name} onChangeText={setName} placeholder="VD: Thịt kho tàu" />
      <SelectField label="Nguyên liệu chính" value={foodName} onChange={setFoodName} options={foods.map((f) => ({ value: f.name, label: f.name }))} />
      <Input label="Mô tả ngắn" value={description} onChangeText={setDescription} placeholder="VD: Món kho đậm đà ngày Tết" />
      <Input label="Nguyên liệu (mỗi dòng một thứ)" value={ingredients} onChangeText={setIngredients} multiline placeholder={'500g thịt ba chỉ\n5 quả trứng\nNước dừa'} />
      <Input label="Cách làm (mỗi dòng một bước)" value={steps} onChangeText={setSteps} multiline placeholder={'Thái thịt miếng vừa ăn\nƯớp gia vị 30 phút\nKho nhỏ lửa 1 tiếng'} />
      <Button title={editing ? 'Lưu thay đổi' : 'Lưu công thức'} onPress={save} loading={saving} />
    </Screen>
  );
}
