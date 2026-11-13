import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Avatar, Button, Chip, Input, Screen } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { errMsg } from '../../api/client';
import { imageUrl } from '../../config';
import { colors } from '../../theme';

const GENDERS = [['male', 'Nam'], ['female', 'Nữ'], ['other', 'Khác']];

export default function EditProfileScreen({ navigation }) {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username || '');
  const [gender, setGender] = useState(user.gender || null);
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);

  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6, allowsEditing: true, aspect: [1, 1] });
    if (!r.canceled) setImage(r.assets[0]);
  };

  const save = async () => {
    if (name.trim().length < 3 || name.trim().length > 30) return Alert.alert('Lỗi', 'Tên phải từ 3 đến 30 ký tự');
    if (username && (username.length < 3 || username.length > 15 || !/^[a-zA-Z0-9_.]+$/.test(username))) {
      return Alert.alert('Lỗi', 'Username 3-15 ký tự, chỉ gồm chữ, số, dấu _ và .');
    }
    setSaving(true);
    try {
      const body = {};
      if (name.trim() !== user.name) body.name = name.trim();
      if (username !== (user.username || '')) body.username = username;
      if (gender && gender !== user.gender) body.gender = gender;
      if (image) body.image = image;
      if (!Object.keys(body).length) return navigation.goBack();
      const r = await api.editUser(body);
      setUser(r.user);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Lỗi', errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen narrow>
      <Pressable onPress={pick} style={{ alignItems: 'center', marginBottom: 16 }}>
        <Avatar uri={image?.uri || imageUrl(user.photoUrl)} name={name} size={96} />
        <Text style={{ color: colors.primary, marginTop: 6 }}>Đổi ảnh đại diện</Text>
      </Pressable>
      <Input label="Họ tên" value={name} onChangeText={setName} />
      <Input label="Username (để được thêm vào nhóm)" value={username} onChangeText={setUsername} autoCapitalize="none" placeholder="VD: vinh2004" />
      <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 6 }}>Giới tính</Text>
      <View style={{ flexDirection: 'row', marginBottom: 16 }}>
        {GENDERS.map(([k, l]) => <Chip key={k} label={l} active={gender === k} onPress={() => setGender(k)} />)}
      </View>
      <Button title="Lưu" onPress={save} loading={saving} />
    </Screen>
  );
}
