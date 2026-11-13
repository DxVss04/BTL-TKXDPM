import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Chip, confirm } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { errMsg } from '../../api/client';
import { subscribe } from '../../utils/realtime';
import { colors } from '../../theme';

const KEPT_MESSAGES = 40;
const SUGGESTIONS = [
  'Hôm nay nấu gì với đồ trong tủ?',
  'Món nào giúp dùng hết đồ sắp hết hạn?',
  'Lên thực đơn 3 bữa cho ngày mai',
  'Cuối tuần nên đi chợ mua gì?',
];

const storageKey = (userId) => `chat:${userId}`;
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
// Phòng khi model vẫn dùng chữ đậm kiểu markdown
const plain = (text) => text.replace(/\*\*(.+?)\*\*/g, '$1');

export default function ChatScreen({ navigation }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);
  const loaded = useRef(false);

  // Lịch sử trò chuyện lưu trên máy, riêng từng tài khoản
  useEffect(() => {
    AsyncStorage.getItem(storageKey(user._id))
      .then((raw) => { if (raw) setMessages(JSON.parse(raw).filter((m) => !m.pending)); })
      .catch(() => {})
      .finally(() => { loaded.current = true; });
  }, [user._id]);

  useEffect(() => {
    if (!loaded.current) return;
    const done = messages.filter((m) => !m.pending).slice(-KEPT_MESSAGES);
    AsyncStorage.setItem(storageKey(user._id), JSON.stringify(done)).catch(() => {});
  }, [messages, user._id]);

  // Chữ chạy dần: backend đẩy từng đoạn qua socket
  useEffect(() => subscribe('chat:delta', ({ requestId, text }) => {
    setMessages((prev) => prev.map((m) => (m.id === requestId && m.pending ? { ...m, content: m.content + text } : m)));
  }), []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (messages.length ? (
        <Ionicons name="trash-outline" size={22} color={colors.danger} style={{ marginRight: 12 }} accessibilityLabel="Xóa cuộc trò chuyện"
          onPress={() => confirm('Xóa cuộc trò chuyện', 'Xóa toàn bộ tin nhắn với trợ lý?', () => setMessages([]))} />
      ) : null),
    });
  }, [navigation, messages.length]);

  const send = async (raw) => {
    const text = (raw ?? input).trim();
    if (!text || busy) return;
    const requestId = newId();
    // Chỉ gửi các lượt hỏi - đáp hoàn chỉnh, bỏ lượt bị lỗi
    const history = messages.filter((m) => !m.error && m.content).map(({ role, content }) => ({ role, content }));
    const sequence = [];
    history.forEach((m) => {
      if (sequence.length && sequence[sequence.length - 1].role === m.role) sequence[sequence.length - 1] = m;
      else sequence.push(m);
    });
    if (sequence.length && sequence[sequence.length - 1].role === 'user') sequence.pop();
    while (sequence.length && sequence[0].role !== 'user') sequence.shift();

    setInput('');
    setBusy(true);
    setMessages((prev) => [...prev, { id: newId(), role: 'user', content: text }, { id: requestId, role: 'assistant', content: '', pending: true }]);
    try {
      const r = await api.chat([...sequence, { role: 'user', content: text }], requestId);
      setMessages((prev) => prev.map((m) => (m.id === requestId ? { id: m.id, role: 'assistant', content: r.reply } : m)));
    } catch (e) {
      setMessages((prev) => prev.map((m) => (m.id === requestId ? { id: m.id, role: 'assistant', content: errMsg(e), error: true } : m)));
    } finally {
      setBusy(false);
    }
  };

  // Web: Enter để gửi, Shift + Enter để xuống dòng
  const onKeyPress = (e) => {
    if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={styles.frame}>
        <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          {messages.length === 0 ? (
            <View style={styles.welcome}>
              <View style={styles.bigIcon}><Ionicons name="sparkles" size={30} color="#fff" /></View>
              <Text style={styles.welcomeTitle}>Xin chào, mình là Bếp Nhỏ</Text>
              <Text style={styles.welcomeText}>Mình xem tủ lạnh và công thức của nhà bạn để gợi ý món ăn, thực đơn và đồ cần mua. Bạn muốn hỏi gì?</Text>
              <View style={styles.suggestions}>
                {SUGGESTIONS.map((q) => <Chip key={q} label={q} onPress={() => send(q)} />)}
              </View>
            </View>
          ) : messages.map((m) => <Bubble key={m.id} message={m} onRetry={m.error ? () => send(lastQuestion(messages, m.id)) : undefined} />)}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onKeyPress={onKeyPress}
            placeholder="Hỏi về món ăn, thực phẩm..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={2000}
            style={styles.input}
            accessibilityLabel="Nội dung câu hỏi"
          />
          <Pressable onPress={() => send()} disabled={busy || !input.trim()} accessibilityRole="button" accessibilityLabel="Gửi"
            style={[styles.sendBtn, (busy || !input.trim()) && { opacity: 0.4 }]}>
            {busy ? <ActivityIndicator color="#fff" /> : <Ionicons name="send" size={20} color="#fff" />}
          </Pressable>
        </View>
        <Text style={styles.disclaimer}>Trợ lý AI có thể nhầm lẫn. Hãy kiểm tra lại hạn dùng thực phẩm trước khi nấu.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

function lastQuestion(messages, assistantId) {
  const i = messages.findIndex((m) => m.id === assistantId);
  for (let j = i - 1; j >= 0; j--) if (messages[j].role === 'user') return messages[j].content;
  return '';
}

function Bubble({ message, onRetry }) {
  const mine = message.role === 'user';
  if (mine) {
    return (
      <View style={[styles.row, { justifyContent: 'flex-end' }]}>
        <View style={[styles.bubble, styles.mine]}><Text style={styles.mineText} selectable>{message.content}</Text></View>
      </View>
    );
  }
  return (
    <View style={styles.row}>
      <View style={styles.avatar}><Ionicons name="sparkles" size={16} color="#fff" /></View>
      <View style={[styles.bubble, styles.theirs, message.error && styles.errorBubble]}>
        {message.pending && !message.content ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.theirsText, { color: colors.textMuted, marginLeft: 8 }]}>Bếp Nhỏ đang nghĩ...</Text>
          </View>
        ) : (
          <Text style={[styles.theirsText, message.error && { color: colors.danger }]} selectable>{plain(message.content)}</Text>
        )}
        {onRetry ? <Text onPress={onRetry} style={styles.retry}>Thử lại</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, width: '100%', maxWidth: 820, alignSelf: 'center' },
  welcome: { alignItems: 'center', paddingTop: 32, paddingHorizontal: 8 },
  bigIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  welcomeTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 14 },
  welcomeText: { color: colors.textMuted, textAlign: 'center', marginTop: 6, marginBottom: 18, lineHeight: 21, maxWidth: 460 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  bubble: { maxWidth: '82%', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14 },
  mine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  mineText: { color: '#fff', fontSize: 15, lineHeight: 21 },
  theirs: { backgroundColor: '#fff', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  theirsText: { color: colors.text, fontSize: 15, lineHeight: 22 },
  errorBubble: { backgroundColor: colors.dangerLight },
  retry: { color: colors.primary, fontWeight: '700', marginTop: 6 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingTop: 8 },
  input: { flex: 1, minHeight: 46, maxHeight: 140, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, fontSize: 15, color: colors.text },
  sendBtn: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  disclaimer: { fontSize: 11, color: colors.textMuted, textAlign: 'center', paddingVertical: 8, paddingHorizontal: 16 },
});
