// Lịch sử mua sắm / tiêu thụ phục vụ thống kê báo cáo
const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['purchase', 'consume', 'waste'], required: true },
    food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
    foodName: { type: String },
    categoryName: { type: String },
    quantity: { type: Number, default: 1 },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Activity', activitySchema);
