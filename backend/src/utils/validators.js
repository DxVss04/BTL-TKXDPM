const mongoose = require('mongoose');

const isNonEmptyString = (v, min = 1, max = 1000) =>
  typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;

const isEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// Mật khẩu "dài hơn 6 và ngắn hơn 20" -> chấp nhận 6..20 ký tự
const isPassword = (v) => typeof v === 'string' && v.length >= 6 && v.length <= 20;

const isPositiveNumber = (v) => v !== undefined && v !== null && v !== '' && !isNaN(Number(v)) && Number(v) > 0;

const isNonNegativeInt = (v) => v !== undefined && v !== null && v !== '' && Number.isInteger(Number(v)) && Number(v) >= 0;

const isValidDate = (v) => {
  if (v === undefined || v === null || v === '') return false;
  const d = new Date(isNaN(Number(v)) ? v : Number(v));
  return !isNaN(d.getTime());
};

const toDate = (v) => new Date(isNaN(Number(v)) ? v : Number(v));

const isObjectId = (v) => typeof v === 'string' && mongoose.Types.ObjectId.isValid(v);

const isDefined = (v) => v !== undefined && v !== null && v !== '';

const MEAL_NAMES = ['sáng', 'trưa', 'tối'];
// Chấp nhận thêm cách viết không dấu / tiếng Anh, quy về chuẩn
const normalizeMealName = (v) => {
  if (typeof v !== 'string') return null;
  const s = v.trim().toLowerCase();
  const map = { sang: 'sáng', 'sáng': 'sáng', breakfast: 'sáng', trua: 'trưa', 'trưa': 'trưa', lunch: 'trưa', toi: 'tối', 'tối': 'tối', dinner: 'tối' };
  return map[s] || null;
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = {
  isNonEmptyString, isEmail, isPassword, isPositiveNumber, isNonNegativeInt,
  isValidDate, toDate, isObjectId, isDefined, MEAL_NAMES, normalizeMealName, escapeRegex,
};
