// Trợ lý AI gợi ý món ăn / thực phẩm, dùng Claude qua SDK chính thức của Anthropic.
// Khóa API chỉ nằm ở backend (biến ANTHROPIC_API_KEY trong .env), app không bao giờ thấy.
const Anthropic = require('@anthropic-ai/sdk').default;
const FridgeItem = require('../models/FridgeItem');
const Recipe = require('../models/Recipe');

const MODEL = process.env.CHATBOT_MODEL || 'claude-opus-5-5';
// Trò chuyện thường không cần suy nghĩ sâu; tăng lên "medium"/"high" nếu muốn câu trả lời kỹ hơn
const EFFORT = process.env.CHATBOT_EFFORT || 'low';
const MAX_TOKENS = 16000;
const TIME_ZONE = 'Asia/Ho_Chi_Minh';
const DAY_MS = 86400000;

const SYSTEM_PROMPT = `Bạn là "Bếp Nhỏ", trợ lý nấu ăn và đi chợ trong ứng dụng "Đi chợ tiện lợi" của một gia đình Việt Nam. Bạn giúp gợi ý món ăn, lên thực đơn, gợi ý thực phẩm nên mua, cách bảo quản và cách tận dụng đồ trong tủ lạnh.

- Trả lời bằng tiếng Việt, thân thiện và ngắn gọn; ưu tiên món ăn Việt quen thuộc, dễ nấu tại nhà.
- Ưu tiên món dùng thực phẩm đang có trong tủ lạnh, nhất là đồ sắp hết hạn, và nói rõ món đó giúp dùng hết đồ nào.
- Khi gợi ý món, nêu nguyên liệu chính và phân biệt cái đã có trong tủ với cái cần mua thêm. Chỉ viết các bước nấu khi người dùng hỏi cách làm.
- Thực phẩm đã quá hạn: nhắc kiểm tra kỹ hoặc bỏ đi, không gợi ý dùng đồ có thể đã hỏng.
- Dữ liệu tủ lạnh và công thức ở phần "Dữ liệu của gia đình" là nguồn duy nhất về những gì gia đình đang có; không tự thêm thực phẩm vào đó.
- Ứng dụng hiển thị văn bản thuần, nên không dùng bảng, tiêu đề hay chữ in đậm kiểu markdown; dùng gạch đầu dòng "-" và xuống dòng.
- Với câu hỏi ngoài chuyện ăn uống, nấu nướng, đi chợ, hãy trả lời ngắn gọn rồi gợi ý quay lại các chủ đề đó.`;

let client = null;
const isConfigured = () => !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

// Ngày theo giờ Việt Nam, để "còn mấy ngày" khớp với những gì người dùng thấy trong app
const ymd = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: TIME_ZONE });
const fmt = (d) => new Date(d).toLocaleDateString('vi-VN', { timeZone: TIME_ZONE });
const daysBetween = (from, to) => Math.round((Date.parse(ymd(to)) - Date.parse(ymd(from))) / DAY_MS);

function expiryText(expiredDate, now) {
  const n = daysBetween(now, expiredDate);
  if (n < 0) return `ĐÃ QUÁ HẠN ${-n} ngày`;
  if (n === 0) return 'hết hạn hôm nay';
  return `còn ${n} ngày`;
}

// Phần dữ liệu thay đổi theo từng gia đình và từng lúc hỏi
async function buildContext(user) {
  const now = new Date();
  const lines = [`Dữ liệu của gia đình (cập nhật lúc hỏi):`, `- Hôm nay: ${fmt(now)}`, `- Người đang hỏi: ${user.name}`];
  if (!user.group) {
    lines.push('- Người dùng chưa vào nhóm gia đình nào nên chưa có dữ liệu tủ lạnh.');
    return lines.join('\n');
  }

  const [items, recipes] = await Promise.all([
    FridgeItem.find({ group: user.group }).populate({ path: 'food', select: 'name unit category', populate: [{ path: 'unit', select: 'name' }, { path: 'category', select: 'name' }] }).sort({ expiredDate: 1 }).lean(),
    Recipe.find({ group: user.group }).populate('food', 'name').select('name food favorite').limit(50).lean(),
  ]);

  lines.push('', 'Tủ lạnh (sắp xếp theo hạn dùng):');
  const fridge = items.filter((i) => i.food);
  if (!fridge.length) lines.push('- Đang trống');
  fridge.forEach((i) => {
    const where = i.location ? `, ${i.location}` : '';
    const cat = i.food.category?.name ? ` [${i.food.category.name}]` : '';
    lines.push(`- ${i.food.name}${cat}: ${i.quantity} ${i.food.unit?.name || ''}${where}, hạn ${fmt(i.expiredDate)} (${expiryText(i.expiredDate, now)})`);
  });

  lines.push('', 'Công thức gia đình đã lưu trong app:');
  if (!recipes.length) lines.push('- Chưa có');
  recipes.forEach((r) => lines.push(`- ${r.name}${r.food ? ` (nguyên liệu chính: ${r.food.name})` : ''}${r.favorite ? ' - yêu thích' : ''}`));
  return lines.join('\n');
}

/**
 * Trả lời một lượt hội thoại, đẩy từng đoạn chữ qua onText khi model đang viết.
 * messages: [{ role: 'user' | 'assistant', content: string }] - đã kiểm tra hợp lệ.
 */
async function reply(user, messages, { onText, signal } = {}) {
  const stream = getClient().beta.messages.stream(
    {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      // Nếu bộ lọc an toàn từ chối nhầm, API tự chạy lại bằng model dự phòng trong cùng request
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: EFFORT },
      system: [
        { type: 'text', text: SYSTEM_PROMPT },
        { type: 'text', text: await buildContext(user) },
      ],
      messages,
    },
    { signal },
  );
  if (onText) stream.on('text', onText);

  const message = await stream.finalMessage();
  if (message.stop_reason === 'refusal') return { refused: true, text: '' };
  const text = message.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  return { refused: false, text, truncated: message.stop_reason === 'max_tokens' };
}

module.exports = { reply, isConfigured, Anthropic, MODEL };
