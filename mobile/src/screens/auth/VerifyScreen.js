import React, { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { Button, Input, Screen } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { errMsg } from '../../api/client';
import { colors } from '../../theme';

export default function VerifyScreen({ route }) {
  const { email } = route.params;
  const { verify } = useAuth();
  const [token, setToken] = useState(route.params.token);
  const [devCode, setDevCode] = useState(route.params.devCode);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const resend = async () => {
    setSending(true);
    try {
      const res = await api.sendCode(email);
      setToken(res.confirmToken);
      setDevCode(res.devCode);
      Alert.alert('Đã gửi', res.resultMessage.vn);
    } catch (e) {
      Alert.alert('Lỗi', errMsg(e));
    } finally {
      setSending(false);
    }
  };

  useEffect(() => { if (route.params.resend) resend(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    if (!/^\d{6}$/.test(code.trim())) return Alert.alert('Lỗi', 'Mã xác thực gồm 6 chữ số');
    setLoading(true);
    try {
      await verify(code, token);
    } catch (e) {
      Alert.alert('Xác minh thất bại', errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen narrow>
      <Text style={{ fontSize: 16, color: colors.text, marginBottom: 16 }}>
        Nhập mã 6 số đã được gửi tới <Text style={{ fontWeight: '700' }}>{email}</Text>
      </Text>
      {devCode ? (
        <Text style={{ backgroundColor: colors.warningLight, padding: 10, borderRadius: 8, marginBottom: 12 }}>
          Chế độ dev (server chưa cấu hình email): mã của bạn là <Text style={{ fontWeight: '700' }}>{devCode}</Text>
        </Text>
      ) : null}
      <Input label="Mã xác thực" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} placeholder="______" />
      <Button title="Xác minh" onPress={submit} loading={loading} />
      <Button title="Gửi lại mã" variant="outline" onPress={resend} loading={sending} style={{ marginTop: 12 }} />
    </Screen>
  );
}
