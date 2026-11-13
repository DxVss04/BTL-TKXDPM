const Notification = require('../models/Notification');
const { ok, bad } = require('../utils/response');
const v = require('../utils/validators');
const { emitToUsers } = require('../realtime');

const LIST_LIMIT = 50;

// GET /notification   (mở rộng)
exports.list = async (req, res) => {
  const docs = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(LIST_LIMIT);
  return ok(res, '00913', { notifications: docs.map((d) => d.toClient()) });
};

// PUT /notification/read   (mở rộng) { ids: [...] } hoặc { all: true }
exports.markRead = async (req, res) => {
  const { ids, all } = req.body;
  const validIds = Array.isArray(ids) && ids.length > 0 && ids.every((id) => v.isObjectId(String(id)));
  if (all !== true && !validIds) return bad(res, '00915');

  const filter = { user: req.user._id, readAt: null };
  if (all !== true) filter._id = { $in: ids };
  await Notification.updateMany(filter, { readAt: new Date() });
  emitToUsers([req.user._id], 'notifications:changed', {});
  return ok(res, '00914');
};
