import React, { useState } from 'react';
import { Alert, Modal, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card, Chip, Input, ListItem, Loading, Screen, SearchBar, confirm, s } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useFocusLoad } from '../../utils/hooks';
import api from '../../api';
import { errMsg } from '../../api/client';
import { colors } from '../../theme';
import { fmtDateTime } from '../../utils/format';

const TABS = [['overview', 'Tổng quan'], ['category', 'Danh mục'], ['unit', 'Đơn vị'], ['users', 'Người dùng'], ['logs', 'Nhật ký']];

export default function AdminScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState({});
  const [newName, setNewName] = useState('');
  const [rename, setRename] = useState(null); // { kind, oldName, value }
  const [q, setQ] = useState('');

  const { loading, reload } = useFocusLoad(async () => {
    if (tab === 'overview') setData({ overview: await api.adminOverview() });
    if (tab === 'category') setData({ list: (await api.adminCategories()).categories.map((c) => c.name) });
    if (tab === 'unit') setData({ list: (await api.adminUnits()).units.map((u) => u.name) });
    if (tab === 'users') setData({ users: (await api.adminUsers()).users });
    if (tab === 'logs') setData({ logs: (await api.adminLogs()).logs });
  }, [tab]);

  const act = async (fn) => {
    try { await fn(); await reload(); } catch (e) { Alert.alert('Lỗi', errMsg(e)); }
  };

  const isCat = tab === 'category';
  const create = () => {
    if (!newName.trim()) return;
    act(() => (isCat ? api.adminCreateCategory(newName.trim()) : api.adminCreateUnit(newName.trim()))).then(() => setNewName(''));
  };
  const doRename = () => {
    const { oldName, value } = rename;
    setRename(null);
    act(() => (isCat ? api.adminEditCategory(oldName, value.trim()) : api.adminEditUnit(oldName, value.trim())));
  };

  const renderBody = () => {
    if (loading) return <Loading />;
    if (tab === 'overview' && data.overview) {
      const o = data.overview;
      return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {[['Người dùng', o.users, 'people'], ['Nhóm', o.groups, 'home'], ['Thực phẩm', o.foods, 'nutrition'], ['Danh mục', o.categories, 'pricetags'], ['Đơn vị', o.units, 'speedometer']].map(([l, v, i]) => (
            <Card key={l} style={{ width: '48%', alignItems: 'center' }}>
              <Ionicons name={i} size={24} color="#4338CA" />
              <Text style={{ fontSize: 24, fontWeight: '800' }}>{v}</Text>
              <Text style={{ color: colors.textMuted }}>{l}</Text>
            </Card>
          ))}
        </View>
      );
    }
    if ((tab === 'category' || tab === 'unit') && data.list) {
      return (
        <>
          <View style={s.row}>
            <Input style={{ flex: 1, marginRight: 8 }} value={newName} onChangeText={setNewName} placeholder={isCat ? 'Tên danh mục mới' : 'Tên đơn vị mới'} />
            <Button title="Thêm" small onPress={create} style={{ marginBottom: 12 }} />
          </View>
          {data.list.map((n) => (
            <ListItem key={n} title={n} onPress={() => setRename({ oldName: n, value: n })}
              right={<Ionicons name="trash-outline" size={20} color={colors.danger} onPress={() => confirm('Xóa', `Xóa "${n}"?`, () => act(() => (isCat ? api.adminDeleteCategory(n) : api.adminDeleteUnit(n))))} />} />
          ))}
          <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center' }}>Bấm vào một mục để đổi tên</Text>
        </>
      );
    }
    if (tab === 'users' && data.users) {
      const list = data.users.filter((u) => !q || `${u.name} ${u.email} ${u.username}`.toLowerCase().includes(q.toLowerCase()));
      return (
        <>
          <SearchBar value={q} onChangeText={setQ} placeholder="Tìm theo tên, email, username" />
          {list.map((u) => (
            <Card key={u._id}>
              <View style={[s.row, { justifyContent: 'space-between' }]}>
                <Text style={{ fontWeight: '700', fontSize: 16, flex: 1 }}>{u.name}</Text>
                {u.role === 'admin' ? <Badge label="Admin" level="info" /> : null}
                {!u.isActivated ? <Badge label="Đã khóa" level="danger" /> : null}
              </View>
              <Text style={{ color: colors.textMuted }}>{u.email}{u.username ? ` · @${u.username}` : ''}</Text>
              {String(u._id) !== String(user._id) && (
                <View style={[s.row, { marginTop: 8 }]}>
                  <Button small variant="outline" title={u.isActivated ? 'Khóa' : 'Mở khóa'} style={{ marginRight: 8 }} onPress={() => act(() => api.adminUpdateUser({ userId: u._id, isActivated: !u.isActivated }))} />
                  <Button small variant="ghost" title={u.role === 'admin' ? 'Bỏ admin' : 'Cấp admin'} style={{ marginRight: 8 }} onPress={() => act(() => api.adminUpdateUser({ userId: u._id, role: u.role === 'admin' ? 'user' : 'admin' }))} />
                  <Button small variant="danger" title="Xóa" onPress={() => confirm('Xóa người dùng', `Xóa ${u.email}?`, () => act(() => api.adminDeleteUser(u._id)))} />
                </View>
              )}
            </Card>
          ))}
        </>
      );
    }
    if (tab === 'logs' && data.logs) {
      return data.logs.map((l) => (
        <View key={l._id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
            <Text style={{ fontWeight: '700', color: l.statusCode < 400 ? colors.primary : colors.danger }}>{l.method} {l.statusCode}</Text> {l.path}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>{fmtDateTime(l.createdAt)} · {l.user?.email || 'khách'} · {l.resultCode}</Text>
        </View>
      ));
    }
    return null;
  };

  return (
    <Screen>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        {TABS.map(([k, l]) => <Chip key={k} label={l} active={tab === k} onPress={() => { setData({}); setTab(k); }} />)}
      </ScrollView>
      {renderBody()}
      <Modal visible={!!rename} transparent animationType="fade" onRequestClose={() => setRename(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, width: '100%', maxWidth: 420, alignSelf: 'center' }}>
            <Text style={[s.section, { marginBottom: 12 }]}>Đổi tên "{rename?.oldName}"</Text>
            <Input value={rename?.value} onChangeText={(v) => setRename((r) => ({ ...r, value: v }))} autoFocus />
            <View style={s.row}>
              <Button title="Hủy" variant="outline" style={{ flex: 1, marginRight: 8 }} onPress={() => setRename(null)} />
              <Button title="Lưu" style={{ flex: 1 }} onPress={doRename} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
