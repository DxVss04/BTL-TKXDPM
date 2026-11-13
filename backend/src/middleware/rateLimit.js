// Giới hạn số request đơn giản theo IP (mã 00024 - Quá nhiều yêu cầu), không cần thư viện ngoài
const { send } = require('../utils/response');

module.exports = function rateLimit({ windowMs = 60_000, max = 300 } = {}) {
  const hits = new Map();
  setInterval(() => hits.clear(), windowMs).unref();
  return (req, res, next) => {
    const key = req.ip;
    const n = (hits.get(key) || 0) + 1;
    hits.set(key, n);
    if (n > max) return send(res, 429, '00024');
    next();
  };
};
