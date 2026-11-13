import React, { useState } from 'react';
import { Alert, Text } from 'react-native';
import { Button, Input, Screen } from '../../components/ui';
import api from '../../api';
import { errMsg } from '../../api/client';
import { colors } from '../../theme';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    const e = {};
    if (form.name.trim().length < 3 || form.name.trim().length > 30) e.name = 'Tên phải từ 3 đến 30 ký tự';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Email không đúng định dạng';
    if (form.password.length < 6 || form.password.length > 20) e.password = 'Mật khẩu phải từ 6 đến 20 ký tự';
    if (form.password !== form.confirm) e.confirm = 'Mật khẩu nhập lại không khớp';
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      const res = await api.register({ name: form.name.trim(), email: form.email.trim(), password: form.password, language: 'vn', timezone: 'Asia/Ho_Chi_Minh' });
      navigation.replace('Verify', { email: form.email.trim(), token: res.confirmToken, devCode: res.devCode });
    } catch (err) {
      Alert.alert('Đăng ký thất bại', errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen narrow>
      <Text style={{ color: colors.textMuted, marginBottom: 16 }}>Tạo tài khoản để bắt đầu quản lý đi chợ cùng gia đình.</Text>
      <Input label="Họ tên" value={form.name} onChangeText={set('name')} placeholder="Nguyễn Văn A" error={errors.name} />
      <Input label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" error={errors.email} />
      <Input label="Mật khẩu" value={form.password} onChangeText={set('password')} secureTextEntry error={errors.password} />
      <Input label="Nhập lại mật khẩu" value={form.confirm} onChangeText={set('confirm')} secureTextEntry error={errors.confirm} />
      <Button title="Đăng ký" onPress={submit} loading={loading} style={{ marginTop: 8 }} />
    </Screen>
  );
}
