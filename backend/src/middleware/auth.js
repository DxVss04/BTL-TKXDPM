const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { unauthorized, forbidden } = require('../utils/response');

function getToken(req) {
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) return h.slice(7).trim();
  return null;
}

// Bắt buộc đăng nhập
async function auth(req, res, next) {
  const token = getToken(req);
  if (!token) return unauthorized(res, '00006');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return unauthorized(res, '00052');
    if (!user.isActivated) return forbidden(res, '00043');
    req.user = user;
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') return unauthorized(res, '00011');
    return unauthorized(res, '00012');
  }
}

// Không bắt buộc (vd: logout)
async function optionalAuth(req, res, next) {
  const token = getToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    req.user = await User.findById(payload.id);
  } catch (_) { /* bỏ qua */ }
  next();
}

// Chỉ quản trị viên hệ thống
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return forbidden(res, '00017');
  next();
}

module.exports = { auth, optionalAuth, adminOnly };
