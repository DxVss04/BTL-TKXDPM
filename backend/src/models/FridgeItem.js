const mongoose = require('mongoose');

const fridgeItemSchema = new mongoose.Schema(
  {
    food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    quantity: { type: Number, required: true },
    useWithin: { type: Number, required: true }, // số ngày sử dụng kể từ khi cho vào tủ
    startDate: { type: Date, default: Date.now },
    expiredDate: { type: Date, required: true },
    note: { type: String, default: '' },
    location: { type: String, default: '' }, // vị trí lưu trữ: ngăn mát, ngăn đá...
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
fridgeItemSchema.index({ food: 1, group: 1 }, { unique: true });

module.exports = mongoose.model('FridgeItem', fridgeItemSchema);
