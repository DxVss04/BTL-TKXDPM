const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Group = require('../models/Group');
const { ok, created, bad, unauthorized, notFound, conflict } = require('../utils/response');
const v = require('../utils/validators');
const { sendVerificationCode, isMailConfigured } = require('../utils/mailer');

const ACCESS_EXP = () => process.env.ACCESS_TOKEN_EXPIRES || '1h';
const REFRESH_EXP = () => process.env.REFRESH_TOKEN_EXPIRES || '7d';

const signAccess = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: ACCESS_EXP() });
const signRefresh = (user) => jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXP() });
// Token xác nhận dùng cho bước verify email
const signConfirm = (user) => jwt.sign({ id: user._id, purpose: 'verify' }, process.env.JWT_SECRET, { expiresIn: '15m' });

const genCode = () => String(Math.floor(100000 + Math.random() * 900000));

async function issueCode(user) {
  const code = genCode();
  user.verificationCode = code;
  user.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();
  await sendVerificationCode(user.email, code);
  // Ở chế độ dev (chưa cấu hình SMTP) trả mã về để tiện kiểm thử
  return !isMailConfigured() && process.env.NODE_ENV !== 'production' ? { devCode: code } : {};
}

// POST /user/  (Register)
exports.register = async (req, res) => {
  const { email, password, name, language, timezone, deviceId } = req.body;
  if (!email || !password || !name) return bad(res, '00025');
  if (!v.isEmail(email)) return bad(res, '00026');
  if (!v.isPassword(password)) return bad(res, '00027');
  if (!v.isNonEmptyString(name, 3, 30)) return bad(res, '00028');

  const exists = await User.findOne({ email: email.toLowerCase().trim() });
  if (exists) return conflict(res, '00032');

  const user = await User.create({
    email,
    password: await bcrypt.hash(password, 10),
    name: name.trim(),
    language: language || 'vn',
    timezone: timezone || 'Asia/Ho_Chi_Minh',
    deviceId,
  });
  const extra = await issueCode(user);
  return created(res, '00035', { user: user.toPublic(), confirmToken: signConfirm(user), ...extra });
};

// POST /user/login/
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return bad(res, '00038');
  if (!v.isEmail(email)) return bad(res, '00039');
  if (!v.isPassword(password)) return bad(res, '00040');

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) return notFound(res, '00042');
  if (!user.isActivated) return bad(res, '00043');
  if (!user.isVerified) {
    return bad(res, '00044', { confirmToken: signConfirm(user) });
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) return unauthorized(res, '00045');

  const accessToken = signAccess(user);
  const refreshToken = signRefresh(user);
  user.refreshToken = refreshToken;
  if (req.body.deviceId) user.deviceId = req.body.deviceId;
  await user.save();
  return ok(res, '00047', { user: user.toPublic(), accessToken, refreshToken });
};

// POST /user/logout/
exports.logout = async (req, res) => {
  if (req.user) {
    req.user.refreshToken = null;
    req.user.pushToken = null;
    await req.user.save();
  }
  return ok(res, '00050');
};

// POST /user/refresh-token/
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return bad(res, '00059');
  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (e) {
    if (e.name === 'TokenExpiredError') return unauthorized(res, '00062');
    return unauthorized(res, '00063');
  }
  const user = await User.findById(payload.id);
  if (!user || user.refreshToken !== refreshToken) return unauthorized(res, '00061');
  const accessToken = signAccess(user);
  const newRefresh = signRefresh(user);
  user.refreshToken = newRefresh;
  await user.save();
  return ok(res, '00065', { accessToken, refreshToken: newRefresh });
};

// POST /user/send-verification-code/
exports.sendCode = async (req, res) => {
  const { email } = req.body;
  if (!email) return bad(res, '00005');
  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!user) return notFound(res, '00036');
  const extra = await issueCode(user);
  return ok(res, '00048', { confirmToken: signConfirm(user), ...extra });
};

// POST /user/verify-email/
exports.verifyEmail = async (req, res) => {
  const { code, token } = req.body;
  if (!code) return bad(res, '00053');
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (_) {
    return unauthorized(res, '00055');
  }
  const user = await User.findById(payload.id);
  if (!user) return notFound(res, '00052');
  if (!user.verificationCode || user.verificationCode !== String(code).trim() ||
      (user.verificationCodeExpires && user.verificationCodeExpires < new Date())) {
    return bad(res, '00054');
  }
  user.isVerified = true;
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  const accessToken = signAccess(user);
  const refreshToken = signRefresh(user);
  user.refreshToken = refreshToken;
  await user.save();
  return ok(res, '00058', { user: user.toPublic(), accessToken, refreshToken });
};

// POST /user/change-password/
exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!v.isPassword(oldPassword) || !v.isPassword(newPassword)) return bad(res, '00069');
  const user = req.user;
  if (!(await bcrypt.compare(oldPassword, user.password))) return bad(res, '00072');
  if (oldPassword === newPassword) return bad(res, '00073');
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  return ok(res, '00076');
};

// PUT /user/  (Edit user, có upload ảnh)
exports.editUser = async (req, res) => {
  const { username, name, gender, birthDate, language } = req.body;
  const user = req.user;
  if (v.isDefined(name)) {
    if (!v.isNonEmptyString(name, 3, 30)) return bad(res, '00077');
    user.name = name.trim();
  }
  if (v.isDefined(gender)) {
    if (!['female', 'male', 'other'].includes(gender)) return bad(res, '00078');
    user.gender = gender;
  }
  if (v.isDefined(language)) {
    if (!['tr', 'en', 'vn'].includes(language)) return bad(res, '00079');
    user.language = language;
  }
  if (v.isDefined(birthDate)) {
    if (!v.isValidDate(birthDate)) return bad(res, '00080');
    user.birthDate = v.toDate(birthDate);
  }
  if (v.isDefined(username)) {
    if (!v.isNonEmptyString(username, 3, 15)) return bad(res, '00081');
    const dup = await User.findOne({ username: username.trim(), _id: { $ne: user._id } });
    if (dup) return conflict(res, '00084');
    user.username = username.trim();
  }
  if (req.file) user.photoUrl = `/uploads/${req.file.filename}`;
  await user.save();
  return ok(res, '00086', { user: user.toPublic() });
};

// GET /user/
exports.getUser = async (req, res) => ok(res, '00089', { user: req.user.toPublic() });

// DELETE /user/
exports.deleteUser = async (req, res) => {
  const user = req.user;
  if (user.group) {
    const group = await Group.findById(user.group);
    if (group) {
      group.members = group.members.filter((m) => String(m) !== String(user._id));
      if (String(group.admin) === String(user._id)) {
        if (group.members.length) group.admin = group.members[0];
        else { await group.deleteOne(); }
      }
      if (group.members.length) await group.save();
    }
  }
  await user.deleteOne();
  return ok(res, '00092');
};

// POST /user/push-token/  (mở rộng) - lưu Expo push token để gửi nhắc nhở
exports.savePushToken = async (req, res) => {
  const { pushToken } = req.body;
  if (!pushToken) return bad(res, '00025');
  req.user.pushToken = pushToken;
  await req.user.save();
  return ok(res, '00903');
};
