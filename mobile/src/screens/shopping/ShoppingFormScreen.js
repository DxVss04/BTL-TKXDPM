import React, { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { Button, DateField, Input, Loading, Screen, SelectField } from '../../components/ui';
import { useGroup } from '../../utils/hooks';
import api from '../../api';
import { errMsg } from '../../api/client';
import { colors } from '../../theme';
import { toYMD } from '../../utils/format';

export default function ShoppingFormScreen({ navigation, route }) {
  const list = route.params?.list;
  const editing = !!list;
  const { group } = useGroup();
  const [name, setName] = useState(list?.name || '');
  const [assignee, setAssignee] = useState(list?.assignedTo?.username || '');
  const [date, setDate] = useState(toYMD(list?.date || new Date()));
  const [note, setNote] = useState(list?.note || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => { navigation.setOptions({ title: editing ? 'Sửa danh sách' : 'Danh sách mua sắm mới' }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!group) return <Loading />;
  const members = group.members.filter((m) => m.username);

  const save = async () => {
    if (!name.trim()) return Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên danh sách');
    if (!assignee) return Alert.alert('Thiếu thông tin', 'Vui lòng chọn người đi chợ');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return Alert.alert('Lỗi', 'Ngày phải có dạng YYYY-MM-DD');
    setSaving(true);
    try {
      if (editing) {
        const body = { listId: list._id };
        if (name.trim() !== list.name) body.newName = name.trim();
        if (assignee !== list.assignedTo?.username) body.newAssignToUsername = assignee;
        if (date !== toYMD(list.date)) body.newDate = date;
        if (note !== (list.note || '')) body.newNote = note;
        if (Object.keys(body).length === 1) return navigation.goBack();
        await api.updateList(body);
        navigation.goBack();
      } else {
        const r = await api.createList({ name: name.trim(), assignToUsername: assignee, date, note });
        navigation.replace('ShoppingDetail', { listId: r.list._id });
      }
    } catch (e) {
      Alert.alert('Lỗi', errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen narrow>
      <Input label="Tên danh sách" value={name} onChangeText={setName} placeholder="VD: Đi chợ cuối tuần" />
      <SelectField
        label="Giao cho"
        value={assignee}
        onChange={setAssignee}
        options={members.map((m) => ({ value: m.username, label: `${m.name} (@${m.username})` }))}
      />
      {members.length < group.members.length && (
        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: -6, marginBottom: 12 }}>
          * Thành viên chưa đặt username sẽ không hiện ở đây (đặt trong mục Cá nhân → Sửa hồ sơ).
        </Text>
      )}
      <DateField label="Ngày đi chợ" value={date} onChange={setDate} />
      <Input label="Ghi chú" value={note} onChangeText={setNote} multiline placeholder="VD: mua ở siêu thị gần nhà" />
      <Button title={editing ? 'Lưu thay đổi' : 'Tạo danh sách'} onPress={save} loading={saving} />
    </Screen>
  );
}
