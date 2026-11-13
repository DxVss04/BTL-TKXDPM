const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/di_cho_tien_loi';
  await mongoose.connect(uri);
  console.log('[DB] Đã kết nối MongoDB:', uri);
}

module.exports = connectDB;
