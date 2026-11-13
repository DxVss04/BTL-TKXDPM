import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

// react-native-web để Alert.alert là hàm rỗng, nên phải tự hiển thị hộp thoại
// thì thông báo lỗi và các nút xác nhận mới hoạt động trên web.
const queue = [];
let notify = () => {};

Alert.alert = (title, message, buttons, options) => {
  queue.push({ title, message, buttons, options });
  notify();
};

// Pressable của react-native-web là div có tabindex="0" nhưng không đổi con trỏ chuột,
// nên trên máy tính người dùng không biết thẻ nào bấm được.
const WEB_CSS = '[tabindex="0"]:not(input):not(textarea) { cursor: pointer; }';
if (typeof document !== 'undefined' && !document.getElementById('app-web-css')) {
  const style = document.createElement('style');
  style.id = 'app-web-css';
  style.textContent = WEB_CSS;
  document.head.appendChild(style);
}

export default function WebShell({ children }) {
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    notify = () => setCurrent((c) => c || queue.shift() || null);
    notify();
    return () => { notify = () => {}; };
  }, []);

  const close = (button) => {
    setCurrent(queue.shift() || null);
    button?.onPress?.();
  };

  const cancelable = !!current?.options?.cancelable;
  let buttons = current?.buttons?.length ? current.buttons : [{ text: 'OK' }];
  if (cancelable && !buttons.some((b) => b.style === 'cancel')) buttons = [...buttons, { text: 'Hủy', style: 'cancel' }];
  const stacked = buttons.length > 2;

  return (
    <View style={styles.page}>
      <View style={styles.app}>{children}</View>
      {current && (
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={cancelable ? () => close() : undefined} />
          <View style={styles.dialog} accessibilityRole="alert">
            <Text style={styles.title}>{current.title}</Text>
            {current.message ? <Text style={styles.message}>{current.message}</Text> : null}
            <View style={stacked ? styles.column : styles.row}>
              {buttons.map((b, i) => (
                <Pressable key={`${b.text}-${i}`} onPress={() => close(b)} style={[styles.button, stacked ? styles.buttonStacked : styles.buttonInline]}>
                  <Text style={[styles.buttonText, b.style === 'cancel' && { color: colors.textMuted }, b.style === 'destructive' && { color: colors.danger }]}>{b.text}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  app: { flex: 1, width: '100%' },
  overlay: { position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, zIndex: 100000, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: 24 },
  dialog: { width: '100%', maxWidth: 340, backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  message: { fontSize: 15, color: colors.textMuted, marginTop: 8, lineHeight: 21 },
  row: { flexDirection: 'row-reverse', marginTop: 16 },
  column: { marginTop: 12 },
  button: { paddingVertical: 10, paddingHorizontal: 12, cursor: 'pointer' },
  buttonInline: { marginLeft: 8 },
  buttonStacked: { alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600', color: colors.primary },
});
