const Log = require('../models/Log');

// Ghi log mọi request API vào MongoDB (phục vụ API Get logs của admin)
module.exports = function requestLogger(req, res, next) {
  res.on('finish', () => {
    if (req.method === 'OPTIONS') return;
    Log.create({
      user: req.user ? req.user._id : null,
      method: req.method,
      path: req.originalUrl.split('?')[0],
      statusCode: res.statusCode,
      resultCode: res.locals.resultCode || '',
      ip: req.ip,
    }).catch(() => {});
  });
  next();
};
