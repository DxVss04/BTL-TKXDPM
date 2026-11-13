const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    username: { type: String, unique: true, sparse: true, trim: true },
    language: { type: String, default: 'vn' },
    timezone: { type: String, default: 'Asia/Ho_Chi_Minh' },
    deviceId: { type: String },
    gender: { type: String, enum: ['male', 'female', 'other', null], default: null },
    birthDate: { type: Date },
    photoUrl: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isActivated: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationCodeExpires: { type: Date },
    refreshToken: { type: String },
    pushToken: { type: String },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
  },
  { timestamps: true }
);

userSchema.methods.toPublic = function () {
  return {
    _id: this._id,
    email: this.email,
    name: this.name,
    username: this.username || '',
    language: this.language,
    timezone: this.timezone,
    gender: this.gender,
    birthDate: this.birthDate,
    photoUrl: this.photoUrl,
    role: this.role,
    isVerified: this.isVerified,
    isActivated: this.isActivated,
    group: this.group,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
