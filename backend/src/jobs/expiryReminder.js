// Định kỳ kiểm tra thực phẩm sắp hết hạn (mặc định trước 3 ngày) và gửi push notification
const FridgeItem = require('../models/FridgeItem');
const User = require('../models/User');
const { notifyUsers } = require('../utils/notify');

const DAY = 86400000;

async function runOnce() {
  const days = Number(process.env.EXPIRY_REMIND_DAYS) || 3;
  const items = await FridgeItem.find({
    expiredDate: { $lte: new Date(Date.now() + days * DAY) },
    notifiedAt: null,
  }).populate('food', 'name');
  if (!items.length) return 0;

  const byGroup = {};
  items.forEach((i) => { (byGroup[String(i.group)] = byGroup[String(i.group)] || []).push(i); });

  for (const [groupId, list] of Object.entries(byGroup)) {
    const users = await User.find({ group: groupId }).select('pushToken');
    const names = list.map((i) => (i.food ? i.food.name : '?')).slice(0, 5).join(', ');
    const more = list.length > 5 ? ` và ${list.length - 5} món khác` : '';
    await notifyUsers(
      users,
      '⏰ Thực phẩm sắp hết hạn',
      `${names}${more} sẽ hết hạn trong ${days} ngày tới. Hãy sử dụng sớm nhé!`,
      { type: 'fridge', screen: 'Fridge' }
    );
  }
  await FridgeItem.updateMany({ _id: { $in: items.map((i) => i._id) } }, { notifiedAt: new Date() });
  console.log(`[REMINDER] Đã nhắc ${items.length} thực phẩm sắp hết hạn`);
  return items.length;
}

function start() {
  const tick = () => runOnce().catch((e) => console.warn('[REMINDER] Lỗi:', e.message));
  setTimeout(tick, 10_000);
  setInterval(tick, 60 * 60 * 1000); // mỗi giờ
}

module.exports = { start, runOnce };
