const mongoose = require('mongoose');

const shoppingListSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    note: { type: String, default: '' },
    date: { type: Date, required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    belongsTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // người tạo (trưởng nhóm)
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ShoppingList', shoppingListSchema);
