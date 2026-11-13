const mongoose = require('mongoose');

const RETENTION_SECONDS = 30 * 24 * 60 * 60;

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    data: { type: mongoose.Schema.Types.Mixed, default: {} }, // { type: 'shopping' | 'meal' | 'fridge', listId?, screen?, date? }
    readAt: { type: Date, default: null },
  },
  { timestamps: true, minimize: false }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: RETENTION_SECONDS });

notificationSchema.methods.toClient = function toClient() {
  return { id: String(this._id), title: this.title, body: this.body, data: this.data, readAt: this.readAt, createdAt: this.createdAt };
};

module.exports = mongoose.model('Notification', notificationSchema);
