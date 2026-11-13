const Group = require('../models/Group');
const User = require('../models/User');
const { ok, created, bad, notFound, forbidden, conflict } = require('../utils/response');

const memberFields = 'name email username photoUrl';

// POST /user/group/
exports.createGroup = async (req, res) => {
  const user = req.user;
  if (user.group) return conflict(res, '00093');
  const group = await Group.create({ admin: user._id, members: [user._id] });
  user.group = group._id;
  await user.save();
  return created(res, '00095', { group });
};

// POST /user/group/add/
exports.addMember = async (req, res) => {
  const { username } = req.body;
  if (!username) return bad(res, '00100');
  const me = req.user;
  if (!me.group) return bad(res, '00096');
  const group = await Group.findById(me.group);
  if (!group) return bad(res, '00096');
  if (String(group.admin) !== String(me._id)) return forbidden(res, '00017');

  const target = await User.findOne({ username: String(username).trim() });
  if (!target) return notFound(res, '00099x');
  if (target.group) return conflict(res, '00099');

  group.members.push(target._id);
  await group.save();
  target.group = group._id;
  await target.save();
  return ok(res, '00102');
};

// DELETE /user/group/
exports.deleteMember = async (req, res) => {
  const { username } = req.body;
  if (!username) return bad(res, '00107');
  const me = req.user;
  if (!me.group) return bad(res, '00096');
  const group = await Group.findById(me.group);
  if (!group) return bad(res, '00096');
  if (String(group.admin) !== String(me._id)) return forbidden(res, '00104');

  const target = await User.findOne({ username: String(username).trim() });
  if (!target) return notFound(res, '00099x');
  if (!target.group || String(target.group) !== String(group._id) || String(target._id) === String(me._id)) {
    return bad(res, '00103');
  }
  group.members = group.members.filter((m) => String(m) !== String(target._id));
  await group.save();
  target.group = null;
  await target.save();
  return ok(res, '00106');
};

// GET /user/group/
exports.getMembers = async (req, res) => {
  const me = req.user;
  if (!me.group) return bad(res, '00096');
  const group = await Group.findById(me.group)
    .populate('admin', memberFields)
    .populate('members', memberFields);
  if (!group) return bad(res, '00096');
  return ok(res, '00098', { groupId: group._id, groupAdmin: group.admin, members: group.members });
};

// DELETE /user/group/leave/  (mở rộng)
exports.leaveGroup = async (req, res) => {
  const me = req.user;
  if (!me.group) return bad(res, '00096');
  const group = await Group.findById(me.group);
  if (group) {
    const isAdmin = String(group.admin) === String(me._id);
    if (isAdmin && group.members.length > 1) return bad(res, '00909');
    group.members = group.members.filter((m) => String(m) !== String(me._id));
    if (group.members.length === 0) await group.deleteOne();
    else await group.save();
  }
  me.group = null;
  await me.save();
  return ok(res, '00908');
};
