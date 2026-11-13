const Category = require('../models/Category');
const Unit = require('../models/Unit');
const Log = require('../models/Log');
const User = require('../models/User');
const Food = require('../models/Food');
const Group = require('../models/Group');
const { ok, created, bad, notFound, conflict } = require('../utils/response');

const clean = (s) => (typeof s === 'string' ? s.trim() : '');

// ===== CATEGORY =====
exports.getCategories = async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  return ok(res, '00129', { categories });
};

exports.createCategory = async (req, res) => {
  const name = clean(req.body.name);
  if (!name) return bad(res, '00131');
  if (await Category.findOne({ name })) return conflict(res, '00132');
  const category = await Category.create({ name });
  return created(res, '00135', { category });
};

exports.editCategory = async (req, res) => {
  const oldName = clean(req.body.oldName);
  const newName = clean(req.body.newName);
  if (!oldName || !newName) return bad(res, '00136');
  if (oldName === newName) return bad(res, '00137');
  const category = await Category.findOne({ name: oldName });
  if (!category) return notFound(res, '00138');
  if (await Category.findOne({ name: newName })) return conflict(res, '00138x');
  category.name = newName;
  await category.save();
  return ok(res, '00141', { category });
};

exports.deleteCategory = async (req, res) => {
  const name = clean(req.body.name);
  if (!name) return bad(res, '00142');
  const category = await Category.findOne({ name });
  if (!category) return notFound(res, '00143');
  await category.deleteOne();
  return ok(res, '00146');
};

// ===== UNIT =====
exports.getUnits = async (req, res) => {
  const units = await Unit.find().sort({ name: 1 });
  return ok(res, '00110', { units });
};

exports.createUnit = async (req, res) => {
  const name = clean(req.body.unitName);
  if (!name) return bad(res, '00112');
  if (await Unit.findOne({ name })) return conflict(res, '00113');
  const unit = await Unit.create({ name });
  return created(res, '00116', { unit });
};

exports.editUnit = async (req, res) => {
  const oldName = clean(req.body.oldName);
  const newName = clean(req.body.newName);
  if (!oldName || !newName) return bad(res, '00117');
  if (oldName === newName) return bad(res, '00118');
  const unit = await Unit.findOne({ name: oldName });
  if (!unit) return notFound(res, '00119');
  if (await Unit.findOne({ name: newName })) return conflict(res, '00113');
  unit.name = newName;
  await unit.save();
  return ok(res, '00122', { unit });
};

exports.deleteUnit = async (req, res) => {
  const name = clean(req.body.unitName);
  if (!name) return bad(res, '00123');
  const unit = await Unit.findOne({ name });
  if (!unit) return notFound(res, '00125');
  await unit.deleteOne();
  return ok(res, '00128');
};

// ===== LOGS =====
exports.getLogs = async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const logs = await Log.find().sort({ createdAt: -1 }).limit(limit).populate('user', 'email name');
  return ok(res, '00109', { logs });
};

// ===== QUẢN LÝ TÀI KHOẢN (mở rộng) =====
exports.getUsers = async (req, res) => {
  const q = clean(req.query.q);
  const filter = q ? { $or: [{ email: new RegExp(q, 'i') }, { name: new RegExp(q, 'i') }, { username: new RegExp(q, 'i') }] } : {};
  const users = await User.find(filter).sort({ createdAt: -1 }).limit(200);
  return ok(res, '00904', { users: users.map((u) => u.toPublic()), total: await User.countDocuments() });
};

exports.updateUser = async (req, res) => {
  const { userId, isActivated, role } = req.body;
  const user = await User.findById(userId);
  if (!user) return notFound(res, '00052');
  if (isActivated !== undefined) user.isActivated = isActivated === true || isActivated === 'true';
  if (role !== undefined) {
    if (!['user', 'admin'].includes(role)) return bad(res, '00025');
    user.role = role;
  }
  await user.save();
  return ok(res, '00905', { user: user.toPublic() });
};

exports.deleteUserById = async (req, res) => {
  const { userId } = req.body;
  const user = await User.findById(userId);
  if (!user) return notFound(res, '00052');
  if (user.group) {
    const group = await Group.findById(user.group);
    if (group) {
      group.members = group.members.filter((m) => String(m) !== String(user._id));
      if (!group.members.length) await group.deleteOne();
      else {
        if (String(group.admin) === String(user._id)) group.admin = group.members[0];
        await group.save();
      }
    }
  }
  await user.deleteOne();
  return ok(res, '00906');
};

// Số liệu tổng quan hệ thống cho trang admin
exports.overview = async (req, res) => {
  const [users, groups, foods, categories, units] = await Promise.all([
    User.countDocuments(), Group.countDocuments(), Food.countDocuments(),
    Category.countDocuments(), Unit.countDocuments(),
  ]);
  return ok(res, '00902', { users, groups, foods, categories, units });
};
