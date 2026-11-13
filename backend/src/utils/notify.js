const Notification = require('../models/Notification');
const { emitToUsers } = require('../realtime');
const { sendPush } = require('./push');

// Lưu để hiện chấm đỏ cả khi người nhận đang offline, đẩy qua socket cho người đang mở app,
// và gửi Expo Push cho người đã đóng app. Cờ realtime giúp app đang mở không hiện trùng push.
async function notifyUsers(users, title, body, data = {}) {
  const targets = users.filter(Boolean);
  try {
    const docs = await Notification.insertMany(targets.map((u) => ({ user: u._id, title, body, data })));
    docs.forEach((doc) => emitToUsers([doc.user], 'notification', doc.toClient()));
  } catch (e) {
    console.warn('[NOTIFY] Không lưu được thông báo:', e.message);
  }
  return sendPush(targets.map((u) => u.pushToken), title, body, { ...data, realtime: true });
}

module.exports = { notifyUsers };
