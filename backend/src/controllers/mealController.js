const MealPlan = require('../models/MealPlan');
const Food = require('../models/Food');
const Group = require('../models/Group');
const User = require('../models/User');
const { ok, created, bad, notFound, forbidden } = require('../utils/response');
const v = require('../utils/validators');
const { notifyUsers } = require('../utils/notify');
const { emitToUsers } = require('../realtime');

const clean = (s) => (typeof s === 'string' ? s.trim() : '');
const populatePlan = (q) =>
  q.populate({ path: 'food', populate: [{ path: 'category', select: 'name' }, { path: 'unit', select: 'name' }] });

async function isGroupAdmin(user) {
  if (!user.group) return false;
  const g = await Group.findById(user.group);
  return g && String(g.admin) === String(user._id);
}

// Cập nhật lịch cho cả nhóm; có title thì báo thêm cho các thành viên còn lại
function broadcastMeal(actor, plan, title) {
  (async () => {
    const members = await User.find({ group: actor.group }).select('pushToken');
    emitToUsers(members.map((m) => m._id), 'meal:changed', {});
    if (!title) return;
    const day = plan.timestamp.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    await notifyUsers(
      members.filter((m) => String(m._id) !== String(actor._id)),
      title,
      `Bữa ${plan.name} ngày ${day}: ${plan.food?.name || ''}`,
      { type: 'meal', screen: 'Meal', date: plan.timestamp.toISOString() }
    );
  })().catch((e) => console.warn('[MEAL] Không gửi được thông báo:', e.message));
}

// POST /meal/
exports.createPlan = async (req, res) => {
  const { foodName, timestamp, name } = req.body;
  if (!v.isDefined(foodName) && !v.isDefined(timestamp) && !v.isDefined(name)) return bad(res, '00313');
  if (!v.isNonEmptyString(foodName)) return bad(res, '00314');
  if (!v.isValidDate(timestamp)) return bad(res, '00315');
  const mealName = v.normalizeMealName(name);
  if (!mealName) return bad(res, '00316');
  if (!(await isGroupAdmin(req.user))) return forbidden(res, '00319');
  const food = await Food.findOne({ name: clean(foodName), group: req.user.group });
  if (!food) return notFound(res, '00317');

  const plan = await MealPlan.create({
    name: mealName, timestamp: v.toDate(timestamp), food: food._id,
    group: req.user.group, createdBy: req.user._id,
  });
  const populated = await populatePlan(MealPlan.findById(plan._id));
  broadcastMeal(req.user, populated, 'Có lịch bữa ăn mới 🍽️');
  return created(res, '00322', { plan: populated });
};

// DELETE /meal/
exports.deletePlan = async (req, res) => {
  const { planId } = req.body;
  if (!v.isDefined(planId)) return bad(res, '00323');
  if (!v.isObjectId(String(planId))) return bad(res, '00324');
  const plan = await MealPlan.findById(planId);
  if (!plan) return notFound(res, '00325');
  if (!(await isGroupAdmin(req.user)) || String(plan.group) !== String(req.user.group)) return forbidden(res, '00327');
  await plan.deleteOne();
  broadcastMeal(req.user, plan);
  return ok(res, '00330');
};

// PUT /meal/
exports.updatePlan = async (req, res) => {
  const { planId, newFoodName, newTimestamp, newName } = req.body;
  if (!v.isDefined(planId) && !v.isDefined(newFoodName) && !v.isDefined(newTimestamp) && !v.isDefined(newName)) return bad(res, '00331');
  if (!v.isDefined(planId) || !v.isObjectId(String(planId))) return bad(res, '00332');
  if (!v.isDefined(newFoodName) && !v.isDefined(newTimestamp) && !v.isDefined(newName)) return bad(res, '00333');
  if (v.isDefined(newFoodName) && !v.isNonEmptyString(newFoodName)) return bad(res, '00334');
  if (v.isDefined(newTimestamp) && !v.isValidDate(newTimestamp)) return bad(res, '00335');
  const mealName = v.isDefined(newName) ? v.normalizeMealName(newName) : null;
  if (v.isDefined(newName) && !mealName) return bad(res, '00336');

  const plan = await MealPlan.findById(planId);
  if (!plan) return notFound(res, '00337');
  if (!(await isGroupAdmin(req.user)) || String(plan.group) !== String(req.user.group)) return forbidden(res, '00339');
  if (v.isDefined(newFoodName)) {
    const food = await Food.findOne({ name: clean(newFoodName), group: req.user.group });
    if (!food) return notFound(res, '00341');
    plan.food = food._id;
  }
  if (v.isDefined(newTimestamp)) plan.timestamp = v.toDate(newTimestamp);
  if (mealName) plan.name = mealName;
  await plan.save();
  const populated = await populatePlan(MealPlan.findById(plan._id));
  broadcastMeal(req.user, populated, 'Lịch bữa ăn đã thay đổi 🍽️');
  return ok(res, '00344', { plan: populated });
};

// GET /meal/?date=YYYY-MM-DD   (mở rộng: ?from=...&to=... để xem theo tuần)
exports.getPlans = async (req, res) => {
  if (!req.user.group) return bad(res, '00345');
  let start;
  let end;
  if (req.query.from && req.query.to && v.isValidDate(req.query.from) && v.isValidDate(req.query.to)) {
    start = v.toDate(req.query.from); start.setHours(0, 0, 0, 0);
    end = v.toDate(req.query.to); end.setHours(23, 59, 59, 999);
  } else {
    const d = req.query.date && v.isValidDate(req.query.date) ? v.toDate(req.query.date) : new Date();
    start = new Date(d); start.setHours(0, 0, 0, 0);
    end = new Date(d); end.setHours(23, 59, 59, 999);
  }
  const plans = await populatePlan(
    MealPlan.find({ group: req.user.group, timestamp: { $gte: start, $lte: end } }).sort({ timestamp: 1 })
  );
  return ok(res, '00348', { plans });
};
