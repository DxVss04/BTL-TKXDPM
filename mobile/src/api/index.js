import client from './client';

const del = (url, data) => client.delete(url, { data });
const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };
const d = (p) => p.then((r) => r.data);

// Tạo FormData từ object, tự xử lý ảnh { uri }
export function toFormData(obj) {
  const fd = new FormData();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    if (k === 'image' && v.file) {
      // Trên web, expo-image-picker trả về File của trình duyệt
      fd.append('image', v.file, v.file.name);
    } else if (k === 'image' && v.uri) {
      const name = v.fileName || v.uri.split('/').pop() || 'photo.jpg';
      const ext = (name.split('.').pop() || 'jpg').toLowerCase();
      fd.append('image', { uri: v.uri, name, type: v.mimeType || `image/${ext === 'jpg' ? 'jpeg' : ext}` });
    } else fd.append(k, String(v));
  });
  return fd;
}

export const api = {
  // ===== Xác thực / tài khoản =====
  login: (email, password) => d(client.post('/user/login', { email, password })),
  register: (body) => d(client.post('/user', body)),
  logout: () => d(client.post('/user/logout')),
  sendCode: (email) => d(client.post('/user/send-verification-code', { email })),
  verifyEmail: (code, token) => d(client.post('/user/verify-email', { code, token })),
  getUser: () => d(client.get('/user')),
  editUser: (obj) => d(client.put('/user', toFormData(obj), multipart)),
  changePassword: (oldPassword, newPassword) => d(client.post('/user/change-password', { oldPassword, newPassword })),
  deleteAccount: () => d(del('/user')),
  savePushToken: (pushToken) => d(client.post('/user/push-token', { pushToken })),

  // ===== Nhóm =====
  createGroup: () => d(client.post('/user/group')),
  addMember: (username) => d(client.post('/user/group/add', { username })),
  removeMember: (username) => d(del('/user/group', { username })),
  getMembers: () => d(client.get('/user/group')),
  leaveGroup: () => d(del('/user/group/leave')),

  // ===== Admin =====
  adminCategories: () => d(client.get('/admin/category')),
  adminCreateCategory: (name) => d(client.post('/admin/category', { name })),
  adminEditCategory: (oldName, newName) => d(client.put('/admin/category', { oldName, newName })),
  adminDeleteCategory: (name) => d(del('/admin/category', { name })),
  adminUnits: () => d(client.get('/admin/unit')),
  adminCreateUnit: (unitName) => d(client.post('/admin/unit', { unitName })),
  adminEditUnit: (oldName, newName) => d(client.put('/admin/unit', { oldName, newName })),
  adminDeleteUnit: (unitName) => d(del('/admin/unit', { unitName })),
  adminLogs: () => d(client.get('/admin/logs')),
  adminUsers: (q) => d(client.get('/admin/users', { params: { q } })),
  adminUpdateUser: (body) => d(client.put('/admin/users', body)),
  adminDeleteUser: (userId) => d(del('/admin/users', { userId })),
  adminOverview: () => d(client.get('/admin/overview')),

  // ===== Thực phẩm =====
  getFoods: (params) => d(client.get('/food', { params })),
  createFood: (obj) => d(client.post('/food', toFormData(obj), multipart)),
  updateFood: (obj) => d(client.put('/food', toFormData(obj), multipart)),
  deleteFood: (name) => d(del('/food', { name })),
  getUnits: () => d(client.get('/food/unit')),
  getCategories: () => d(client.get('/food/category')),

  // ===== Tủ lạnh =====
  getFridge: (params) => d(client.get('/fridge', { params })),
  getExpiring: (days = 3) => d(client.get('/fridge/expiring', { params: { days } })),
  getFridgeItem: (foodName) => d(client.get(`/fridge/${encodeURIComponent(foodName)}`)),
  createFridge: (body) => d(client.post('/fridge', body)),
  updateFridge: (body) => d(client.put('/fridge', body)),
  deleteFridge: (foodName, reason) => d(del('/fridge', { foodName, reason })),

  // ===== Mua sắm =====
  getShopping: (params) => d(client.get('/shopping/task', { params })),
  createList: (body) => d(client.post('/shopping', body)),
  updateList: (body) => d(client.put('/shopping', body)),
  deleteList: (listId) => d(del('/shopping', { listId })),
  createTasks: (listId, tasks) => d(client.post('/shopping/task', { listId, tasks })),
  updateTask: (body) => d(client.put('/shopping/task', body)),
  deleteTask: (taskId) => d(del('/shopping/task', { taskId })),
  markTask: (taskId, done) => d(client.put('/shopping/task/done', { taskId, done })),

  // ===== Bữa ăn =====
  getMeals: (params) => d(client.get('/meal', { params })),
  createMeal: (body) => d(client.post('/meal', body)),
  updateMeal: (body) => d(client.put('/meal', body)),
  deleteMeal: (planId) => d(del('/meal', { planId })),

  // ===== Công thức =====
  getRecipes: (params) => d(client.get('/recipe', { params })),
  createRecipe: (body) => d(client.post('/recipe', body)),
  updateRecipe: (body) => d(client.put('/recipe', body)),
  deleteRecipe: (recipeId) => d(del('/recipe', { recipeId })),
  suggest: () => d(client.get('/recipe/suggest')),

  // ===== Thống kê =====
  getStats: (params) => d(client.get('/stats', { params })),

  // ===== Thông báo =====
  getNotifications: () => d(client.get('/notification')),
  markNotificationsRead: (body) => d(client.put('/notification/read', body)),

  // ===== Trợ lý AI ===== (câu trả lời dài có thể mất hơn 15 giây mặc định)
  chat: (messages, requestId) => d(client.post('/chat', { messages, requestId }, { timeout: 180000 })),
};

export default api;
