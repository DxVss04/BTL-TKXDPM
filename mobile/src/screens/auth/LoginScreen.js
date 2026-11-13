import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Screen } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { errMsg, errCode } from '../../api/client';
import { colors } from '../../theme';

const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const submit = async () => {
    // Kiểm tra ngay phía client, kể cả khi không có mạng
    const e = {};
    if (!emailOk(email)) e.email = 'Email không đúng định dạng';
    if (password.length < 6 || password.length > 20) e.password = 'Mật khẩu phải từ 6 đến 20 ký tự';
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      if (errCode(err) === '00044') {
        Alert.alert('Chưa xác minh email', errMsg(err), [
          { text: 'Để sau' },
          { text: 'Xác minh ngay', onPress: () => navigation.navigate('Verify', { email: email.trim(), token: err.response.data.confirmToken, resend: true }) },
        ]);
      } else Alert.alert('Đăng nhập thất bại', errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Screen edges={['top', 'bottom']} style={{ paddingTop: 48, maxWidth: 440 }}>
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View style={{ width: 88, height: 88, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="basket" size={48} color="#fff" />
          </View>
          <Text style={{ fontSize: 26, fontWeight: '800', marginTop: 16, color: colors.text }}>Đi chợ tiện lợi</Text>
          <Text style={{ color: colors.textMuted, marginTop: 4 }}>Quản lý mua sắm & tủ lạnh cho cả nhà</Text>
        </View>
        <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="email@vidu.com" error={errors.email} />
        <Input label="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry={!showPw} placeholder="6 - 20 ký tự" error={errors.password} onSubmitEditing={submit} returnKeyType="go" />
        <Text onPress={() => setShowPw(!showPw)} style={{ color: colors.primary, textAlign: 'right', marginTop: -6, marginBottom: 16 }}>
          {showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        </Text>
        <Button title="Đăng nhập" onPress={submit} loading={loading} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
          <Text style={{ color: colors.textMuted }}>Chưa có tài khoản? </Text>
          <Text style={{ color: colors.primary, fontWeight: '700' }} onPress={() => navigation.navigate('Register')}>Đăng ký</Text>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
