import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Badge, Button, Card, Input, ListItem, Loading, Screen, SectionTitle, confirm } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useGroup } from '../../utils/hooks';
import api from '../../api';
import { errMsg } from '../../api/client';
import { imageUrl } from '../../config';
import { colors } from '../../theme';

export default function GroupScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const { group, reloadGroup } = useGroup();
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn, okMsg) => {
    setBusy(true);
    try {
      const r = await fn();
      await refreshUser();
      await reloadGroup();
      if (okMsg !== false) Alert.alert('Thành công', okMsg || r?.resultMessage?.vn);
    } catch (e) {
      Alert.alert('Lỗi', errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const UsernameHint = (
    <Card style={{ backgroundColor: colors.primaryLight }}>
      <Text>Username của bạn: <Text style={{ fontWeight: '800' }}>{user.username ? `@${user.username}` : '(chưa đặt)'}</Text></Text>
      <Text style={{ color: colors.textMuted, marginTop: 4 }}>
        Trưởng nhóm dùng username để thêm thành viên và giao việc đi chợ.
      </Text>
      {!user.username && <Button title="Đặt username" small style={{ marginTop: 8, alignSelf: 'flex-start' }} onPress={() => navigation.navigate('EditProfile')} />}
    </Card>
  );

  if (!user.group) {
    return (
      <Screen narrow>
        <View style={{ alignItems: 'center', marginVertical: 24 }}>
          <Ionicons name="home-outline" size={64} color={colors.primary} />
          <Text style={{ fontSize: 20, fontWeight: '800', marginTop: 8 }}>Nhóm gia đình</Text>
          <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 4 }}>
            Tạo nhóm để chia sẻ tủ lạnh, danh sách đi chợ và kế hoạch bữa ăn với cả nhà. Người tạo nhóm sẽ là trưởng nhóm.
          </Text>
        </View>
        <Button title="Tạo nhóm mới" icon="add-circle-outline" loading={busy} onPress={() => run(api.createGroup)} />
        <Text style={{ textAlign: 'center', color: colors.textMuted, marginVertical: 16 }}>— hoặc —</Text>
        {UsernameHint}
        <Text style={{ color: colors.textMuted }}>Gửi username cho trưởng nhóm để được thêm vào nhóm, sau đó kéo xuống để tải lại.</Text>
        <Button title="Tải lại" variant="outline" style={{ marginTop: 12 }} onPress={() => run(async () => {}, false)} />
      </Screen>
    );
  }

  if (!group) return <Loading />;

  const add = () => {
    if (!username.trim()) return Alert.alert('Thiếu thông tin', 'Nhập username của thành viên');
    run(() => api.addMember(username.trim().replace(/^@/, ''))).then(() => setUsername(''));
  };

  return (
    <Screen narrow>
      {UsernameHint}
      {group.isAdmin && (
        <>
          <SectionTitle title="Thêm thành viên" />
          <Input value={username} onChangeText={setUsername} placeholder="Nhập username, VD: bohung" autoCapitalize="none" />
          <Button title="Thêm vào nhóm" icon="person-add-outline" onPress={add} loading={busy} />
        </>
      )}
      <SectionTitle title={`Thành viên (${group.members.length})`} />
      {group.members.map((m) => {
        const isOwner = String(m._id) === String(group.admin?._id);
        const isMe = String(m._id) === String(user._id);
        return (
          <ListItem
            key={m._id}
            left={<Avatar uri={imageUrl(m.photoUrl)} name={m.name} />}
            title={`${m.name}${isMe ? ' (bạn)' : ''}`}
            subtitle={m.username ? `@${m.username}` : m.email}
            right={isOwner ? <Badge label="Trưởng nhóm" level="info" /> : group.isAdmin && m.username ? (
              <Ionicons name="person-remove-outline" size={22} color={colors.danger}
                onPress={() => confirm('Xóa thành viên', `Xóa ${m.name} khỏi nhóm?`, () => run(() => api.removeMember(m.username)))} />
            ) : null}
          />
        );
      })}
      <Button
        title="Rời nhóm"
        variant="outline"
        style={{ marginTop: 16, borderColor: colors.danger }}
        onPress={() => confirm('Rời nhóm', group.isAdmin && group.members.length > 1 ? 'Trưởng nhóm cần xóa hết thành viên khác trước khi rời nhóm.' : 'Bạn chắc chắn muốn rời nhóm?', () => run(api.leaveGroup), 'Rời nhóm')}
      />
    </Screen>
  );
}
