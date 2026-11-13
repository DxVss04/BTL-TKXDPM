const { ok, send, bad } = require('../utils/response');
const { emitToUsers } = require('../realtime');
const chatbot = require('../services/chatbot');

const MAX_HISTORY = 20;        // số tin nhắn gần nhất gửi cho model
const MAX_CONTENT = 4000;      // độ dài tối đa mỗi tin nhắn
const LIMIT_WINDOW_MS = 10 * 60 * 1000;
const LIMIT_PER_WINDOW = 30;   // mỗi người dùng, chống lạm dụng chi phí API

const usage = new Map();
setInterval(() => usage.clear(), LIMIT_WINDOW_MS).unref();

function overLimit(userId) {
  const n = (usage.get(userId) || 0) + 1;
  usage.set(userId, n);
  return n > LIMIT_PER_WINDOW;
}

// Lịch sử phải xen kẽ user/assistant, bắt đầu và kết thúc bằng user
function cleanMessages(raw) {
  if (!Array.isArray(raw) || !raw.length || raw.length > 200) return null;
  const msgs = raw.map((m) => ({ role: m && m.role, content: typeof m?.content === 'string' ? m.content.trim() : '' }));
  const valid = msgs.every((m, i) =>
    (m.role === 'user' || m.role === 'assistant') && m.content.length > 0 && m.content.length <= MAX_CONTENT
    && m.role === (i % 2 === 0 ? 'user' : 'assistant'));
  if (!valid || msgs[msgs.length - 1].role !== 'user') return null;
  let recent = msgs.slice(-MAX_HISTORY);
  if (recent[0].role !== 'user') recent = recent.slice(1);
  return recent;
}

// POST /chat   (mở rộng) { messages: [{ role, content }], requestId }
// Chữ được đẩy dần qua socket (sự kiện chat:delta), câu trả lời đầy đủ trả về trong response.
exports.chat = async (req, res) => {
  const messages = cleanMessages(req.body.messages);
  if (!messages) return bad(res, '00917');
  const requestId = typeof req.body.requestId === 'string' ? req.body.requestId.slice(0, 64) : '';
  if (!chatbot.isConfigured()) return send(res, 503, '00918');
  if (overLimit(String(req.user._id))) return send(res, 429, '00919');

  const controller = new AbortController();
  res.on('close', () => { if (!res.writableEnded) controller.abort(); });

  try {
    const result = await chatbot.reply(req.user, messages, {
      signal: controller.signal,
      onText: requestId ? (text) => emitToUsers([req.user._id], 'chat:delta', { requestId, text }) : undefined,
    });
    if (result.refused) return ok(res, '00921', { reply: 'Xin lỗi, mình không thể trả lời câu này. Bạn thử hỏi về món ăn hoặc thực phẩm khác nhé.', refused: true });
    return ok(res, '00916', { reply: result.text, truncated: !!result.truncated });
  } catch (e) {
    const { Anthropic } = chatbot;
    if (e instanceof Anthropic.APIUserAbortError) return undefined; // người dùng đã rời đi
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
      console.warn('[CHAT] Khóa API không hợp lệ:', e.message);
      return send(res, 503, '00918');
    }
    if (e instanceof Anthropic.RateLimitError) return send(res, 429, '00919');
    if (e instanceof Anthropic.APIError) {
      console.warn('[CHAT] Lỗi API', e.status, e.message);
      return send(res, 502, '00920');
    }
    throw e;
  }
};
