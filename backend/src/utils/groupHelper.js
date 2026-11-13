const Group = require('../models/Group');

// Lấy nhóm của user hiện tại (hoặc null)
async function getUserGroup(user) {
  if (!user.group) return null;
  return Group.findById(user.group);
}

const isGroupAdmin = (group, user) => group && String(group.admin) === String(user._id);
const isMember = (group, userId) => group && group.members.some((m) => String(m) === String(userId));

module.exports = { getUserGroup, isGroupAdmin, isMember };
