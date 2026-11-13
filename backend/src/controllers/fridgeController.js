const FridgeItem = require('../models/FridgeItem');
const Food = require('../models/Food');
const Activity = require('../models/Activity');
const { ok, created, bad, notFound, forbidden, conflict } = require('../utils/response');
const v = require('../utils/validators');

const DAY = 24 * 60 * 60 * 1000;
const clean = (s) => (typeof s === 'string' ? s.trim() : '');
const populateItem = (q) =>
  q.populate({ path: 'food', populate: [{ path: 'category', select: 'name' }, { path: 'unit', select: 'name' }] });

// POST /fridge/
exports.createItem = async (req, res) => {
  const { foodName, useWithin, quantity, note, location } = req.body;
  if (!v.isNonEmptyString(foodName)) return bad(res, '00190');
  if (!v.isPositiveNumber(useWithin)) return bad(res, '00191');
  if (!v.isPositiveNumber(quantity)) return bad(res, '00192');
  if (v.isDefined(note) && typeof note !== 'string') return bad(res, '00193');
  if (!req.user.group) return forbidden(res, '00196');

  const food = await Food.findOne({ name: clean(foodName), group: req.user.group });
  if (!food) return notFound(res, '00194');
  if (String(food.group) !== String(req.user.group)) return forbidden(res, '00198');
  if (await FridgeItem.findOne({ food: food._id, group: req.user.group })) return conflict(res, '00199');

  const days = Number(useWithin);
  const item = await FridgeItem.create({
    food: food._id,
    group: req.user.group,
    quantity: Number(quantity),
    useWithin: days,
    startDate: new Date(),
    expiredDate: new Date(Date.now() + days * DAY),
    note: note || '',
    location: location || '',
    createdBy: req.user._id,
  });
  return created(res, '00202', { item: await populateItem(FridgeItem.findById(item._id)) });
};

// PUT /fridge/
exports.updateItem = async (req, res) => {
  const { itemId, newNote, newQuantity, newUseWithin, newFoodName, newLocation } = req.body;
  if (!v.isDefined(itemId)) return bad(res, '00204');
  if (!v.isObjectId(String(itemId))) return bad(res, '00023');
  if (!v.isDefined(newNote) && !v.isDefined(newQuantity) && !v.isDefined(newUseWithin) &&
      !v.isDefined(newFoodName) && !v.isDefined(newLocation)) return bad(res, '00204x');
  if (v.isDefined(newUseWithin) && !v.isPositiveNumber(newUseWithin)) return bad(res, '00205');
  if (v.isDefined(newQuantity) && !(Number(newQuantity) >= 0) ) return bad(res, '00206');
  if (v.isDefined(newNote) && typeof newNote !== 'string') return bad(res, '00207');
  if (v.isDefined(newFoodName) && !v.isNonEmptyString(newFoodName)) return bad(res, '00207x');
  if (!req.user.group) return bad(res, '00210');

  const item = await FridgeItem.findById(itemId);
  if (!item) return notFound(res, '00213');
  if (String(item.group) !== String(req.user.group)) return forbidden(res, '00212');

  if (v.isDefined(newFoodName)) {
    const food = await Food.findOne({ name: clean(newFoodName), group: req.user.group });
    if (!food) return notFound(res, '00214x');
    const dup = await FridgeItem.findOne({ food: food._id, group: req.user.group, _id: { $ne: item._id } });
    if (dup) return conflict(res, '00199');
    item.food = food._id;
  }
  if (v.isDefined(newQuantity)) {
    const diff = item.quantity - Number(newQuantity);
    if (diff > 0) {
      const food = await Food.findById(item.food);
      await Activity.create({ type: 'consume', food: item.food, foodName: food && food.name, quantity: diff, group: item.group, user: req.user._id });
    }
    item.quantity = Number(newQuantity);
  }
  if (v.isDefined(newUseWithin)) {
    item.useWithin = Number(newUseWithin);
    item.expiredDate = new Date(new Date(item.startDate).getTime() + item.useWithin * DAY);
    item.notifiedAt = null;
  }
  if (v.isDefined(newNote)) item.note = newNote;
  if (v.isDefined(newLocation)) item.location = String(newLocation);
  await item.save();
  return ok(res, '00216', { item: await populateItem(FridgeItem.findById(item._id)) });
};

// DELETE /fridge/   body: { foodName, reason?: 'consume' | 'waste' }
exports.deleteItem = async (req, res) => {
  const { foodName, reason } = req.body;
  if (!v.isNonEmptyString(foodName)) return bad(res, '00217');
  if (!req.user.group) return forbidden(res, '00219');
  const food = await Food.findOne({ name: clean(foodName), group: req.user.group });
  if (!food) return notFound(res, '00218');
  const item = await FridgeItem.findOne({ food: food._id, group: req.user.group });
  if (!item) return notFound(res, '00221');
  if (reason === 'consume' || reason === 'waste') {
    await Activity.create({ type: reason, food: food._id, foodName: food.name, quantity: item.quantity, group: item.group, user: req.user._id });
  }
  await item.deleteOne();
  return ok(res, '00224');
};

// GET /fridge/   (hỗ trợ ?q= & ?category=)
exports.getItems = async (req, res) => {
  if (!req.user.group) return bad(res, '00225');
  let items = await populateItem(FridgeItem.find({ group: req.user.group }).sort({ expiredDate: 1 }));
  if (req.query.q) {
    const re = new RegExp(v.escapeRegex(String(req.query.q)), 'i');
    items = items.filter((i) => i.food && re.test(i.food.name));
  }
  if (req.query.category) items = items.filter((i) => i.food && i.food.category && i.food.category.name === req.query.category);
  return ok(res, '00228', { items });
};

// GET /fridge/expiring/?days=3   (mở rộng)
exports.getExpiring = async (req, res) => {
  if (!req.user.group) return bad(res, '00225');
  const days = Number(req.query.days) || Number(process.env.EXPIRY_REMIND_DAYS) || 3;
  const items = await populateItem(
    FridgeItem.find({ group: req.user.group, expiredDate: { $lte: new Date(Date.now() + days * DAY) } }).sort({ expiredDate: 1 })
  );
  return ok(res, '00910', { items, days });
};

// GET /fridge/:foodName/
exports.getSpecific = async (req, res) => {
  const foodName = clean(req.params.foodName);
  if (!foodName) return bad(res, '00229');
  if (!req.user.group) return forbidden(res, '00232');
  const food = await Food.findOne({ name: foodName, group: req.user.group });
  if (!food) return notFound(res, '00230');
  const item = await populateItem(FridgeItem.findOne({ food: food._id, group: req.user.group }));
  if (!item) return notFound(res, '00234');
  return ok(res, '00237', { item });
};
