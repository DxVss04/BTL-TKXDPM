const mongoose = require('mongoose');

const mealPlanSchema = new mongoose.Schema(
  {
    name: { type: String, enum: ['sáng', 'trưa', 'tối'], required: true },
    timestamp: { type: Date, required: true },
    food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MealPlan', mealPlanSchema);
