const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    htmlContent: { type: String, default: '' },
    food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    favorite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Recipe', recipeSchema);
