const mongoose = require('mongoose');
const Activity = require('../models/Activity');
const FridgeItem = require('../models/FridgeItem');
const ShoppingList = require('../models/ShoppingList');
const Task = require('../models/Task');
const { ok, bad } = require('../utils/response');
const v = require('../utils/validators');

// GET /stats/?from=YYYY-MM-DD&to=YYYY-MM-DD   (mở rộng - Thống kê báo cáo)
exports.getStats = async (req, res) => {
  if (!req.user.group) return bad(res, '00096');
  const to = req.query.to && v.isValidDate(req.query.to) ? v.toDate(req.query.to) : new Date();
  to.setHours(23, 59, 59, 999);
  const from = req.query.from && v.isValidDate(req.query.from) ? v.toDate(req.query.from) : new Date(to.getTime() - 29 * 86400000);
  from.setHours(0, 0, 0, 0);
  const group = new mongoose.Types.ObjectId(String(req.user.group));
  const match = { group, date: { $gte: from, $lte: to } };

  const [totals, topFoods, daily, fridgeCount, expiringCount, lists] = await Promise.all([
    Activity.aggregate([{ $match: match }, { $group: { _id: '$type', count: { $sum: 1 }, quantity: { $sum: '$quantity' } } }]),
    Activity.aggregate([
      { $match: match },
      { $group: { _id: { type: '$type', foodName: '$foodName' }, count: { $sum: 1 }, quantity: { $sum: '$quantity' } } },
      { $sort: { count: -1 } },
      { $limit: 30 },
    ]),
    Activity.aggregate([
      { $match: match },
      { $group: { _id: { day: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: 'Asia/Ho_Chi_Minh' } }, type: '$type' }, count: { $sum: 1 } } },
      { $sort: { '_id.day': 1 } },
    ]),
    FridgeItem.countDocuments({ group }),
    FridgeItem.countDocuments({ group, expiredDate: { $lte: new Date(Date.now() + 3 * 86400000) } }),
    ShoppingList.find({ group, date: { $gte: from, $lte: to } }).select('_id'),
  ]);

  const listIds = lists.map((l) => l._id);
  const [taskTotal, taskDone] = await Promise.all([
    Task.countDocuments({ list: { $in: listIds } }),
    Task.countDocuments({ list: { $in: listIds }, done: true }),
  ]);

  const summary = { purchase: 0, consume: 0, waste: 0 };
  totals.forEach((t) => { summary[t._id] = t.count; });
  const top = { purchase: [], consume: [], waste: [] };
  topFoods.forEach((t) => {
    if (top[t._id.type].length < 5) top[t._id.type].push({ foodName: t._id.foodName, count: t.count, quantity: t.quantity });
  });
  const series = {};
  daily.forEach((d) => {
    series[d._id.day] = series[d._id.day] || { day: d._id.day, purchase: 0, consume: 0, waste: 0 };
    series[d._id.day][d._id.type] = d.count;
  });

  return ok(res, '00902', {
    from, to, summary, top,
    daily: Object.values(series),
    fridge: { total: fridgeCount, expiringSoon: expiringCount },
    shopping: { lists: listIds.length, tasks: taskTotal, done: taskDone },
  });
};
