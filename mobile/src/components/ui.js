import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Image, Modal, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import { addDays, fmtDate, toYMD } from '../utils/format';
import { CONTENT_MAX_WIDTH, FORM_MAX_WIDTH, useLayout } from '../utils/layout';

// narrow: biểu mẫu, chi tiết — giữ cột hẹp cho dễ đọc trên màn hình rộng
export function Screen({ children, scroll = true, refreshing, onRefresh, style, edges = ['bottom'], narrow }) {
  const { isWide } = useLayout();
  const frame = { width: '100%', maxWidth: narrow ? FORM_MAX_WIDTH : CONTENT_MAX_WIDTH, alignSelf: 'center' };
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[{ padding: isWide ? 24 : 16, paddingBottom: 100 }, frame, style]}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} colors={[colors.primary]} /> : undefined}
    >
      {children}
    </ScrollView>
  ) : <View style={[{ flex: 1 }, frame, style]}>{children}</View>;
  return <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.bg }}>{content}</SafeAreaView>;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, icon, style, small }) {
  const v = {
    primary: { bg: colors.primary, fg: colors.white, border: colors.primary },
    outline: { bg: 'transparent', fg: colors.primary, border: colors.primary },
    danger: { bg: colors.danger, fg: colors.white, border: colors.danger },
    ghost: { bg: colors.primaryLight, fg: colors.primaryDark, border: colors.primaryLight },
  }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.btn, small && s.btnSmall,
        { backgroundColor: v.bg, borderColor: v.border, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={v.fg} /> : (
        <View style={s.row}>
          {icon && <Ionicons name={icon} size={small ? 16 : 18} color={v.fg} style={{ marginRight: 6 }} />}
          <Text style={[s.btnText, small && { fontSize: 14 }, { color: v.fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Input({ label, error, style, ...props }) {
  return (
    <View style={[{ marginBottom: 12 }, style]}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor="#9CA3AF"
        style={[s.input, props.multiline && { minHeight: 90, textAlignVertical: 'top' }, error && { borderColor: colors.danger }]}
        {...props}
      />
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}

export function Card({ children, style, onPress }) {
  if (!onPress) return <View style={[s.card, style]}>{children}</View>;
  return <Pressable onPress={onPress} style={({ pressed, hovered }) => [s.card, hovered && s.cardHover, pressed && { opacity: 0.9 }, style]}>{children}</Pressable>;
}

// Danh sách dạng lưới trên màn hình rộng, một cột trên điện thoại
export function useGrid() {
  const { columns } = useLayout();
  return {
    key: `grid-${columns}`,
    numColumns: columns,
    columnWrapperStyle: columns > 1 ? { marginHorizontal: -6 } : undefined,
    item: (node) => (columns > 1 ? <View style={{ width: `${100 / columns}%`, paddingHorizontal: 6 }}>{node}</View> : node),
  };
}

// Bảng chọn: trượt từ dưới lên trên điện thoại, hộp thoại giữa màn hình trên máy tính
export function Sheet({ visible, onClose, title, children }) {
  const { isWide } = useLayout();
  return (
    <Modal visible={visible} transparent animationType={isWide ? 'fade' : 'slide'} onRequestClose={onClose}>
      <View style={[s.modalBg, isWide && { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Đóng" />
        <View style={[s.modal, isWide && { width: '100%', maxWidth: 480, borderRadius: 20, paddingBottom: 20 }]}>
          <View style={[s.row, { justifyContent: 'space-between', marginBottom: 12 }]}>
            <Text style={s.section}>{title}</Text>
            <Ionicons name="close" size={24} onPress={onClose} accessibilityLabel="Đóng" />
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

export function Badge({ label, level = 'ok' }) {
  const c = { ok: [colors.primaryLight, colors.primaryDark], warning: [colors.warningLight, '#9A6200'], danger: [colors.dangerLight, colors.danger], info: ['#EEF2FF', '#4338CA'] }[level];
  return <View style={[s.badge, { backgroundColor: c[0] }]}><Text style={{ color: c[1], fontSize: 12, fontWeight: '600' }}>{label}</Text></View>;
}

export function RedDot({ style }) {
  return <View style={[{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger }, style]} />;
}

export function Empty({ icon = 'leaf-outline', text, action }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
      <Ionicons name={icon} size={48} color="#C5CCD3" />
      <Text style={{ color: colors.textMuted, marginTop: 8, textAlign: 'center' }}>{text}</Text>
      {action ? <View style={{ marginTop: 12 }}>{action}</View> : null}
    </View>
  );
}

export function Loading() {
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}><ActivityIndicator size="large" color={colors.primary} /></View>;
}

export function SectionTitle({ title, right }) {
  return (
    <View style={[s.row, { justifyContent: 'space-between', marginTop: 8, marginBottom: 8 }]}>
      <Text style={s.section}>{title}</Text>
      {right}
    </View>
  );
}

export function Fab({ onPress, icon = 'add' }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.fab, pressed && { opacity: 0.85 }]}>
      <Ionicons name={icon} size={28} color="#fff" />
    </Pressable>
  );
}

export function Chip({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
      <Text style={{ color: active ? '#fff' : colors.text, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function SearchBar({ value, onChangeText, placeholder = 'Tìm kiếm...' }) {
  return (
    <View style={s.search}>
      <Ionicons name="search" size={18} color={colors.textMuted} />
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9CA3AF" style={{ flex: 1, marginLeft: 8, paddingVertical: 8 }} />
      {value ? <Ionicons name="close-circle" size={18} color={colors.textMuted} onPress={() => onChangeText('')} /> : null}
    </View>
  );
}

// Ô chọn giá trị từ danh sách (mở modal)
export function SelectField({ label, value, options, onChange, placeholder = 'Chọn...', error }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const list = options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));
  const current = options.find((o) => o.value === value);
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <Pressable onPress={() => setOpen(true)} style={[s.input, s.row, { justifyContent: 'space-between' }, error && { borderColor: colors.danger }]}>
        <Text style={{ color: current ? colors.text : '#9CA3AF' }}>{current ? current.label : placeholder}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
      {error ? <Text style={s.error}>{error}</Text> : null}
      <Sheet visible={open} onClose={() => setOpen(false)} title={label || 'Chọn'}>
            {options.length > 6 && <SearchBar value={q} onChangeText={setQ} />}
            <FlatList
              data={list}
              keyExtractor={(o) => String(o.value)}
              style={{ maxHeight: 400 }}
              ListEmptyComponent={<Text style={{ color: colors.textMuted, padding: 16 }}>Không có lựa chọn nào</Text>}
              renderItem={({ item }) => (
                <Pressable onPress={() => { onChange(item.value); setOpen(false); setQ(''); }} style={[s.option, item.value === value && { backgroundColor: colors.primaryLight }]}>
                  <Text style={{ fontSize: 16 }}>{item.label}</Text>
                  {item.value === value && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                </Pressable>
              )}
            />
      </Sheet>
    </View>
  );
}

// Chọn ngày đơn giản (không cần thư viện ngoài): nhập YYYY-MM-DD hoặc bấm nút nhanh
export function DateField({ label, value, onChange }) {
  const quick = [['Hôm nay', 0], ['Ngày mai', 1], ['+3 ngày', 3], ['+7 ngày', 7]];
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <View style={s.row}>
        <Pressable onPress={() => onChange(toYMD(addDays(value || new Date(), -1)))} style={s.iconBtn}><Ionicons name="chevron-back" size={20} color={colors.primary} /></Pressable>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="YYYY-MM-DD"
          style={[s.input, { flex: 1, textAlign: 'center', marginHorizontal: 8 }]}
        />
        <Pressable onPress={() => onChange(toYMD(addDays(value || new Date(), 1)))} style={s.iconBtn}><Ionicons name="chevron-forward" size={20} color={colors.primary} /></Pressable>
      </View>
      <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' }}>{value ? fmtDate(value) : ''}</Text>
      <View style={[s.row, { flexWrap: 'wrap', marginTop: 4 }]}>
        {quick.map(([l, n]) => <Chip key={l} label={l} active={value === toYMD(addDays(new Date(), n))} onPress={() => onChange(toYMD(addDays(new Date(), n)))} />)}
      </View>
    </View>
  );
}

export function Avatar({ uri, name = '?', size = 44 }) {
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.border }} />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.primaryDark, fontWeight: '700', fontSize: size / 2.4 }}>{name.trim().charAt(0).toUpperCase()}</Text>
    </View>
  );
}

export function ListItem({ title, subtitle, left, right, onPress, onLongPress }) {
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={({ pressed, hovered }) => [s.card, s.row, { paddingVertical: 12 }, hovered && onPress && s.cardHover, pressed && onPress && { opacity: 0.9 }]}>
      {left ? <View style={{ marginRight: 12 }}>{left}</View> : null}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{title}</Text>
        {subtitle ? <Text style={{ color: colors.textMuted, marginTop: 2 }}>{subtitle}</Text> : null}
      </View>
      {right}
    </Pressable>
  );
}

export const confirm = (title, message, onOk, okText = 'Xóa') =>
  Alert.alert(title, message, [{ text: 'Hủy', style: 'cancel' }, { text: okText, style: 'destructive', onPress: onOk }]);

export const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  btn: { borderRadius: radius, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', borderWidth: 1.5 },
  btnSmall: { paddingVertical: 8, paddingHorizontal: 12 },
  btnText: { fontSize: 16, fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.text },
  error: { color: colors.danger, fontSize: 13, marginTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: radius, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  cardHover: { shadowOpacity: 0.12, shadowRadius: 12, borderColor: colors.primaryLight },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' },
  section: { fontSize: 18, fontWeight: '700', color: colors.text },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 58, height: 58, borderRadius: 29, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 8 },
  search: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: radius, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 32 },
  option: { paddingVertical: 14, paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between' },
  iconBtn: { width: 44, height: 44, borderRadius: radius, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
});
