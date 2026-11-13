import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Card, ListItem, Screen, confirm } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { imageUrl } from '../../config';
import { colors } from '../../theme';

export default function ProfileScreen({ navigation }) {
  const { user, logout, clear } = useAuth();
  const chevron = <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />;
  const item = (icon, title, screen, color = colors.primary) => (
    <ListItem key={title} title={title} left={<Ionicons name={icon} size={22} color={color} />} right={chevron} onPress={() => navigation.navigate(screen)} />
  );

  return (
    <Screen edges={['bottom']} narrow>
      <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
        <Avatar uri={imageUrl(user.photoUrl)} name={user.name} size={84} />
        <Text style={{ fontSize: 20, fontWeight: '800', marginTop: 10 }}>{user.name}</Text>
        <Text style={{ color: colors.textMuted }}>{user.email}</Text>
        {user.username ? <Text style={{ color: colors.primary, marginTop: 2 }}>@{user.username}</Text> : null}
        {user.role === 'admin' && <Text style={{ marginTop: 6, color: '#4338CA', fontWeight: '700' }}>Quản trị hệ thống</Text>}
      </Card>
      {item('person-outline', 'Sửa hồ sơ', 'EditProfile')}
      {item('key-outline', 'Đổi mật khẩu', 'ChangePassword')}
      {item('people-outline', 'Nhóm gia đình', 'Group')}
      {item('nutrition-outline', 'Danh mục thực phẩm của nhóm', 'FoodList')}
      {item('bar-chart-outline', 'Thống kê mua sắm & tiêu thụ', 'Stats')}
      {user.role === 'admin' && item('shield-checkmark-outline', 'Quản trị hệ thống', 'Admin', '#4338CA')}
      <View style={{ height: 12 }} />
      <ListItem title="Đăng xuất" left={<Ionicons name="log-out-outline" size={22} color={colors.danger} />} onPress={() => confirm('Đăng xuất', 'Bạn muốn đăng xuất?', logout, 'Đăng xuất')} />
      <ListItem
        title="Xóa tài khoản"
        subtitle="Xóa vĩnh viễn tài khoản của bạn"
        left={<Ionicons name="trash-outline" size={22} color={colors.danger} />}
        onPress={() => confirm('Xóa tài khoản', 'Hành động này không thể hoàn tác. Tiếp tục?', async () => { await api.deleteAccount(); await clear(); })}
      />
    </Screen>
  );
}
