// Gửi push notification qua Expo Push API (không cần thư viện, Node >= 18 có sẵn fetch)
async function sendPush(tokens, title, body, data = {}) {
  const valid = (tokens || []).filter((t) => typeof t === 'string' && t.startsWith('ExponentPushToken'));
  if (!valid.length) return;
  const messages = valid.map((to) => ({ to, sound: 'default', title, body, data }));
  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
    if (!res.ok) console.warn('[PUSH] Lỗi gửi push:', res.status);
  } catch (e) {
    console.warn('[PUSH] Không gửi được push:', e.message);
  }
}

module.exports = { sendPush };
