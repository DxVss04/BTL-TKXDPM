// Kênh realtime (Socket.IO). Mỗi người dùng có một phòng riêng để sự kiện chỉ đến đúng người nhận.
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

let io = null;
const room = (userId) => `user:${userId}`;

function init(httpServer) {
  io = new Server(httpServer, { cors: { origin: '*' } });

  io.use(async (socket, next) => {
    try {
      const { id } = jwt.verify(String(socket.handshake.auth?.token || ''), process.env.JWT_SECRET);
      const user = await User.findById(id).select('isActivated');
      if (!user || !user.isActivated) throw new Error('inactive');
      socket.data.userId = String(user._id);
      next();
    } catch (_) {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => socket.join(room(socket.data.userId)));
}

function emitToUsers(userIds, event, payload) {
  const rooms = [...new Set(userIds.filter(Boolean).map(String))].map(room);
  if (io && rooms.length) io.to(rooms).emit(event, payload);
}

module.exports = { init, emitToUsers };
