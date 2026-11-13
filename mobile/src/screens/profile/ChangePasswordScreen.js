import React, { useState } from 'react';
import { Alert } from 'react-native';
import { Button, Input, Screen } from '../../components/ui';
import api from '../../api';
import { errMsg } from '../../api/client';

export default function ChangePasswordScreen({ navigation }) {
  const [oldPw, setOld] = useState('');
  const [newPw, setNew] = useState('');
  const [confirmPw, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (oldPw.length < 6 || oldPw.length > 20 || newPw.length < 6 || newPw.length > 20) return Alert.alert('Lỗi', 'Mật khẩu phải từ 6 đến 20 ký tự');
    if (newPw === oldPw) return Alert.alert('Lỗi', 'Mật khẩu mới không được trùng mật khẩu cũ');
    if (newPw !== confirmPw) return Alert.alert('Lỗi', 'Nhập lại mật khẩu mới không khớp');
    setSaving(true);
    try {
      const r = await api.changePassword(oldPw, newPw);
      Alert.alert('Thành công', r.resultMessage.vn);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Lỗi', errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen narrow>
      <Input label="Mật khẩu hiện tại" value={oldPw} onChangeText={setOld} secureTextEntry />
      <Input label="Mật khẩu mới" value={newPw} onChangeText={setNew} secureTextEntry />
      <Input label="Nhập lại mật khẩu mới" value={confirmPw} onChangeText={setConfirm} secureTextEntry />
      <Button title="Đổi mật khẩu" onPress={save} loading={saving} />
    </Screen>
  );
}
