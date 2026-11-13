const mongoose = require('mongoose');

const logSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    method: String,
    path: String,
    statusCode: Number,
    resultCode: String,
    ip: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Log', logSchema);
