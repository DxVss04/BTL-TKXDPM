const { send } = require('../utils/response');

function notFoundHandler(req, res) {
  return send(res, 404, '00900');
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err);
  if (err && err.name === 'CastError') return send(res, 400, '00023');
  if (err && err.type === 'entity.parse.failed') return send(res, 400, '00025');
  return send(res, 500, '00008');
}

module.exports = { notFoundHandler, errorHandler };
