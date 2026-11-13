const ShoppingList = require('../models/ShoppingList');
const Task = require('../models/Task');
const Food = require('../models/Food');
const User = require('../models/User');
const Group = require('../models/Group');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const { ok, created, bad, notFound, forbidden, conflict } = require('../utils/response');
const v = require('../utils/validators');
const { notifyUsers } = require('../utils/notify');
const { emitToUsers } = require('../realtime');

const clean = (s) => (typeof s === 'string' ? s.trim() : '');

async function loadGroup(user) {
  return user.group ? Group.findById(user.group) : null;
}
const isAdminOf = (group, user) => group && String(group.admin) === String(user._id);
const inGroup = (group, userId) => group && group.members.some((m) => String(m) === String(userId));

const populateList = (q) =>
  q.populate('assignedTo', 'name username photoUrl').populate('belongsTo', 'name username');

// Báo cho mọi thành viên tải lại dữ liệu đi chợ
const shoppingChanged = (group, listId) =>
  emitToUsers([group.admin, ...group.members], 'shopping:changed', { listId: String(listId) });

// Thông báo riêng cho người được phân công, trừ khi chính họ là người thao tác
const notifyAssignee = (assignee, actor, title, body, listId) => {
  if (!assignee || String(assignee._id) === String(actor._id)) return;
  notifyUsers([assignee], title, body, listId ? { type: 'shopping', listId: String(listId) } : { type: 'shopping' });
};
const findAssignee = (userId) => User.findById(userId).select('pushToken');

// POST /shopping/
exports.createList = async (req, res) => {
  const { name, assignToUsername, note, date } = req.body;
  if (!v.isDefined(name) && !v.isDefined(assignToUsername) && !v.isDefined(date)) return bad(res, '00238');
  if (!v.isNonEmptyString(name, 1, 100)) return bad(res, '00239');
  if (!v.isNonEmptyString(assignToUsername)) return bad(res, '00240');
  if (v.isDefined(note) && typeof note !== 'string') return bad(res, '00241');
  if (!v.isValidDate(date)) return bad(res, '00242');

  const group = await loadGroup(req.user);
  if (!isAdminOf(group, req.user)) return forbidden(res, '00243');
  const assignee = await User.findOne({ username: clean(assignToUsername) });
  if (!assignee) return notFound(res, '00245');
  if (!inGroup(group, assignee._id)) return forbidden(res, '00246');

  const list = await ShoppingList.create({
    name: clean(name), note: note || '', date: v.toDate(date),
    group: group._id, belongsTo: req.user._id, assignedTo: assignee._id,
  });
  notifyAssignee(assignee, req.user, 'Bạn được giao đi chợ 🛒', `${req.user.name} giao cho bạn danh sách "${list.name}"`, list._id);
  shoppingChanged(group, list._id);
  return created(res, '00249', { list: await populateList(ShoppingList.findById(list._id)) });
};

// PUT /shopping/
exports.updateList = async (req, res) => {
  const { listId, newName, newAssignToUsername, newNote, newDate } = req.body;
  if (!v.isDefined(listId) && !v.isDefined(newName) && !v.isDefined(newAssignToUsername) && !v.isDefined(newNote) && !v.isDefined(newDate)) return bad(res, '00250');
  if (!v.isDefined(listId)) return bad(res, '00251');
  if (!v.isObjectId(String(listId))) return bad(res, '00023');
  if (!v.isDefined(newName) && !v.isDefined(newAssignToUsername) && !v.isDefined(newNote) && !v.isDefined(newDate)) return bad(res, '00252');
  if (v.isDefined(newName) && !v.isNonEmptyString(newName, 1, 100)) return bad(res, '00253');
  if (v.isDefined(newAssignToUsername) && !v.isNonEmptyString(newAssignToUsername)) return bad(res, '00254');
  if (v.isDefined(newNote) && typeof newNote !== 'string') return bad(res, '00255');
  if (v.isDefined(newDate) && !v.isValidDate(newDate)) return bad(res, '00256');

  const group = await loadGroup(req.user);
  if (!isAdminOf(group, req.user)) return forbidden(res, '00258');
  const list = await ShoppingList.findById(listId);
  if (!list) return notFound(res, '00260');
  if (String(list.group) !== String(group._id)) return forbidden(res, '00261');

  const previousAssigneeId = String(list.assignedTo);
  const snapshot = () => JSON.stringify([list.name, list.note, list.date]);
  const before = snapshot();

  if (v.isDefined(newAssignToUsername)) {
    const assignee = await User.findOne({ username: clean(newAssignToUsername) });
    if (!assignee) return notFound(res, '00262');
    if (!inGroup(group, assignee._id)) return forbidden(res, '00263');
    list.assignedTo = assignee._id;
  }
  if (v.isDefined(newName)) list.name = clean(newName);
  if (v.isDefined(newNote)) list.note = newNote;
  if (v.isDefined(newDate)) list.date = v.toDate(newDate);
  await list.save();

  const assignee = await findAssignee(list.assignedTo);
  if (String(list.assignedTo) !== previousAssigneeId) {
    notifyAssignee(assignee, req.user, 'Bạn được giao đi chợ 🛒', `${req.user.name} giao cho bạn danh sách "${list.name}"`, list._id);
    notifyAssignee(await findAssignee(previousAssigneeId), req.user, 'Danh sách đã chuyển người 🔁', `"${list.name}" đã được giao cho người khác`, list._id);
  } else if (snapshot() !== before) {
    notifyAssignee(assignee, req.user, 'Danh sách được cập nhật ✏️', `${req.user.name} đã sửa danh sách "${list.name}"`, list._id);
  }
  shoppingChanged(group, list._id);
  return ok(res, '00266', { list: await populateList(ShoppingList.findById(list._id)) });
};

// DELETE /shopping/
exports.deleteList = async (req, res) => {
  const { listId } = req.body;
  if (!v.isDefined(listId)) return bad(res, '00268');
  if (!v.isObjectId(String(listId))) return bad(res, '00023');
  const group = await loadGroup(req.user);
  if (!isAdminOf(group, req.user)) return forbidden(res, '00270');
  const list = await ShoppingList.findById(listId);
  if (!list) return notFound(res, '00272');
  if (String(list.group) !== String(group._id)) return forbidden(res, '00273');
  const assignee = await findAssignee(list.assignedTo);
  await Task.deleteMany({ list: list._id });
  await list.deleteOne();
  // Danh sách không còn để mở nên chấm đỏ cũ của nó phải được xóa
  await Notification.updateMany({ 'data.listId': String(list._id), readAt: null }, { readAt: new Date() });
  emitToUsers([group.admin, ...group.members], 'notifications:changed', {});
  notifyAssignee(assignee, req.user, 'Danh sách đã bị xóa 🗑️', `${req.user.name} đã xóa danh sách "${list.name}"`);
  shoppingChanged(group, list._id);
  return ok(res, '00275');
};

// POST /shopping/task/   (application/json) { listId, tasks: [{ foodName, quantity }] }
exports.createTasks = async (req, res) => {
  const { listId, tasks } = req.body;
  if (!v.isDefined(listId) && !v.isDefined(tasks)) return bad(res, '00276');
  if (!v.isDefined(listId)) return bad(res, '00277');
  if (!v.isObjectId(String(listId))) return bad(res, '00023');
  if (!Array.isArray(tasks) || !tasks.length) return bad(res, '00278');
  if (tasks.some((t) => !t || !v.isNonEmptyString(t.foodName) || !v.isDefined(t.quantity))) return bad(res, '00279');

  const group = await loadGroup(req.user);
  if (!isAdminOf(group, req.user)) return forbidden(res, '00281');
  const list = await ShoppingList.findById(listId);
  if (!list) return notFound(res, '00283');
  if (String(list.group) !== String(group._id)) return forbidden(res, '00284');

  const docs = [];
  const seen = new Set();
  for (const t of tasks) {
    const food = await Food.findOne({ name: clean(t.foodName), group: group._id });
    if (!food) return notFound(res, '00285');
    if (seen.has(String(food._id)) || (await Task.findOne({ list: list._id, food: food._id }))) return conflict(res, '00285x');
    seen.add(String(food._id));
    docs.push({ list: list._id, food: food._id, quantity: String(t.quantity) });
  }
  const createdTasks = await Task.insertMany(docs);
  notifyAssignee(await findAssignee(list.assignedTo), req.user, 'Có món mới cần mua 📝', `"${list.name}" vừa có thêm ${docs.length} món`, list._id);
  shoppingChanged(group, list._id);
  return created(res, '00287', { tasks: createdTasks });
};

// GET /shopping/task/   -> trả về các danh sách mua sắm của nhóm kèm nhiệm vụ
exports.getTasks = async (req, res) => {
  if (!req.user.group) return bad(res, '00288');
  const filter = { group: req.user.group };
  if (req.query.mine === 'true') filter.assignedTo = req.user._id;
  const lists = await populateList(ShoppingList.find(filter).sort({ date: -1 })).lean();
  const tasks = await Task.find({ list: { $in: lists.map((l) => l._id) } })
    .populate({ path: 'food', populate: [{ path: 'unit', select: 'name' }, { path: 'category', select: 'name' }] })
    .lean();
  const byList = {};
  tasks.forEach((t) => { (byList[String(t.list)] = byList[String(t.list)] || []).push(t); });
  const result = lists.map((l) => ({ ...l, tasks: byList[String(l._id)] || [] }));
  return ok(res, '00292', { lists: result });
};

// DELETE /shopping/task/
exports.deleteTask = async (req, res) => {
  const { taskId } = req.body;
  if (!v.isDefined(taskId)) return bad(res, '00294');
  if (!v.isObjectId(String(taskId))) return bad(res, '00023');
  const task = await Task.findById(taskId);
  if (!task) return notFound(res, '00296');
  const group = await loadGroup(req.user);
  const list = await ShoppingList.findById(task.list);
  if (!isAdminOf(group, req.user) || !list || String(list.group) !== String(group._id)) return forbidden(res, '00297');
  await task.deleteOne();
  shoppingChanged(group, list._id);
  return ok(res, '00299');
};

// PUT /shopping/task/
exports.updateTask = async (req, res) => {
  const { taskId, newFoodName, newQuantity } = req.body;
  if (!v.isDefined(taskId) && !v.isDefined(newFoodName) && !v.isDefined(newQuantity)) return bad(res, '00300');
  if (!v.isDefined(taskId)) return bad(res, '00301');
  if (!v.isObjectId(String(taskId))) return bad(res, '00023');
  if (!v.isDefined(newFoodName) && !v.isDefined(newQuantity)) return bad(res, '00302');
  if (v.isDefined(newFoodName) && !v.isNonEmptyString(newFoodName)) return bad(res, '00303');
  if (v.isDefined(newQuantity) && !v.isNonEmptyString(String(newQuantity))) return bad(res, '00304');

  const task = await Task.findById(taskId);
  if (!task) return notFound(res, '00306');
  const group = await loadGroup(req.user);
  const list = await ShoppingList.findById(task.list);
  if (!isAdminOf(group, req.user) || !list || String(list.group) !== String(group._id)) return forbidden(res, '00307');

  if (v.isDefined(newFoodName)) {
    const food = await Food.findOne({ name: clean(newFoodName), group: group._id });
    if (!food) return notFound(res, '00308');
    const dup = await Task.findOne({ list: task.list, food: food._id, _id: { $ne: task._id } });
    if (dup) return conflict(res, '00309');
    task.food = food._id;
  }
  if (v.isDefined(newQuantity)) task.quantity = String(newQuantity);
  await task.save();
  shoppingChanged(group, list._id);
  return ok(res, '00312', { task });
};

// PUT /shopping/task/done/   (mở rộng) { taskId, done: true|false }
// Người được giao hoặc trưởng nhóm đánh dấu đã mua -> ghi lịch sử mua sắm
exports.markTask = async (req, res) => {
  const { taskId } = req.body;
  const done = req.body.done === true || req.body.done === 'true';
  if (!v.isDefined(taskId)) return bad(res, '00294');
  if (!v.isObjectId(String(taskId))) return bad(res, '00023');
  const task = await Task.findById(taskId).populate('food');
  if (!task) return notFound(res, '00296');
  const list = await ShoppingList.findById(task.list);
  const group = await loadGroup(req.user);
  if (!list || !group || String(list.group) !== String(group._id)) return forbidden(res, '00297');
  if (String(list.assignedTo) !== String(req.user._id) && !isAdminOf(group, req.user)) return forbidden(res, '00911');

  if (done && !task.done) {
    await Activity.create({
      type: 'purchase', food: task.food && task.food._id, foodName: task.food && task.food.name,
      quantity: parseFloat(task.quantity) || 1, group: group._id, user: req.user._id,
    });
  }
  task.done = done;
  task.doneAt = done ? new Date() : null;
  task.doneBy = done ? req.user._id : null;
  await task.save();
  shoppingChanged(group, list._id);
  return ok(res, '00907', { task });
};
