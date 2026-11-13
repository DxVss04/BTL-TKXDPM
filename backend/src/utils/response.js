const MESSAGES = require('./messages');

/**
 * Định dạng phản hồi thống nhất:
 * { resultCode: '00047', resultMessage: { vn: '...' }, ...data }
 */
function send(res, httpStatus, code, data = {}) {
  res.locals.resultCode = code;
  return res.status(httpStatus).json({
    resultCode: code,
    resultMessage: { vn: MESSAGES[code] || '' },
    ...data,
  });
}

const ok = (res, code, data) => send(res, 200, code, data);
const created = (res, code, data) => send(res, 201, code, data);
const bad = (res, code, data) => send(res, 400, code, data);
const unauthorized = (res, code) => send(res, 401, code);
const forbidden = (res, code) => send(res, 403, code);
const notFound = (res, code) => send(res, 404, code);
const conflict = (res, code) => send(res, 409, code);

module.exports = { send, ok, created, bad, unauthorized, forbidden, notFound, conflict };
