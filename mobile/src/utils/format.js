const pad = (n) => String(n).padStart(2, '0');

export const toYMD = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};
export const fmtDate = (d) => {
  if (!d) return '';
  const x = new Date(d);
  return `${pad(x.getDate())}/${pad(x.getMonth() + 1)}/${x.getFullYear()}`;
};
export const fmtDateTime = (d) => {
  const x = new Date(d);
  return `${pad(x.getHours())}:${pad(x.getMinutes())} ${fmtDate(x)}`;
};
export const timeAgo = (d) => {
  const minutes = Math.floor((Date.now() - new Date(d)) / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} giờ trước`;
  return fmtDateTime(d);
};
export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const daysLeft = (d) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const t = new Date(d); t.setHours(0, 0, 0, 0);
  return Math.round((t - today) / 86400000);
};
export const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export const expiryInfo = (expiredDate) => {
  const n = daysLeft(expiredDate);
  if (n < 0) return { label: `Hết hạn ${-n} ngày`, level: 'danger' };
  if (n === 0) return { label: 'Hết hạn hôm nay', level: 'danger' };
  if (n <= 3) return { label: `Còn ${n} ngày`, level: 'warning' };
  return { label: `Còn ${n} ngày`, level: 'ok' };
};

export const MEALS = [
  { key: 'sáng', label: 'Bữa sáng', icon: 'sunny-outline', hour: 7 },
  { key: 'trưa', label: 'Bữa trưa', icon: 'partly-sunny-outline', hour: 12 },
  { key: 'tối', label: 'Bữa tối', icon: 'moon-outline', hour: 19 },
];

// Danh sách vẫn là việc phải làm khi chưa có món nào hoặc còn món chưa mua
export const isListPending = (list) => list.tasks.length === 0 || list.tasks.some((t) => !t.done);

// Bỏ thẻ HTML để hiển thị xem trước
export const stripHtml = (html = '') => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
