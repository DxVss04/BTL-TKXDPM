const express = require('express');
const h = require('../utils/asyncHandler');
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');
const { single } = require('../middleware/upload');

const user = require('../controllers/userController');
const group = require('../controllers/groupController');
const admin = require('../controllers/adminController');
const food = require('../controllers/foodController');
const fridge = require('../controllers/fridgeController');
const shopping = require('../controllers/shoppingController');
const meal = require('../controllers/mealController');
const recipe = require('../controllers/recipeController');
const stats = require('../controllers/statsController');
const notification = require('../controllers/notificationController');
const chat = require('../controllers/chatController');

const r = express.Router();

// ===== 1. Đăng nhập, xác thực =====
r.post('/user/login', h(user.login));
r.post('/user/logout', optionalAuth, h(user.logout));
r.post('/user/refresh-token', h(user.refreshToken));
r.post('/user/send-verification-code', h(user.sendCode));
r.post('/user/verify-email', h(user.verifyEmail));
r.post('/user/push-token', auth, h(user.savePushToken)); // mở rộng

// ===== 2. Tài khoản =====
r.post('/user/change-password', auth, h(user.changePassword));

// ===== 3. Nhóm =====
r.post('/user/group/add', auth, h(group.addMember));
r.delete('/user/group/leave', auth, h(group.leaveGroup)); // mở rộng
r.post('/user/group', auth, h(group.createGroup));
r.delete('/user/group', auth, h(group.deleteMember));
r.get('/user/group', auth, h(group.getMembers));

r.post('/user', h(user.register));
r.get('/user', auth, h(user.getUser));
r.put('/user', auth, single('image'), h(user.editUser));
r.delete('/user', auth, h(user.deleteUser));

// ===== 4 & 5. Quản trị: danh mục, đơn vị, log, tài khoản =====
const A = [auth, adminOnly];
r.get('/admin/category', ...A, h(admin.getCategories));
r.post('/admin/category', ...A, h(admin.createCategory));
r.put('/admin/category', ...A, h(admin.editCategory));
r.delete('/admin/category', ...A, h(admin.deleteCategory));
r.get('/admin/unit', ...A, h(admin.getUnits));
r.post('/admin/unit', ...A, h(admin.createUnit));
r.put('/admin/unit', ...A, h(admin.editUnit));
r.delete('/admin/unit', ...A, h(admin.deleteUnit));
r.get('/admin/logs', ...A, h(admin.getLogs));
r.get('/admin/users', ...A, h(admin.getUsers)); // mở rộng
r.put('/admin/users', ...A, h(admin.updateUser)); // mở rộng
r.delete('/admin/users', ...A, h(admin.deleteUserById)); // mở rộng
r.get('/admin/overview', ...A, h(admin.overview)); // mở rộng

// ===== 6. Thực phẩm =====
r.get('/food/unit', auth, h(admin.getUnits));
r.get('/food/category', auth, h(admin.getCategories));
r.post('/food', auth, single('image'), h(food.createFood));
r.put('/food', auth, single('image'), h(food.updateFood));
r.delete('/food', auth, h(food.deleteFood));
r.get('/food', auth, h(food.getFoods));

// ===== 7. Tủ lạnh =====
r.post('/fridge', auth, h(fridge.createItem));
r.put('/fridge', auth, h(fridge.updateItem));
r.delete('/fridge', auth, h(fridge.deleteItem));
r.get('/fridge', auth, h(fridge.getItems));
r.get('/fridge/expiring', auth, h(fridge.getExpiring)); // mở rộng (khai báo trước :foodName)
r.get('/fridge/:foodName', auth, h(fridge.getSpecific));

// ===== 8. Danh sách mua sắm =====
r.post('/shopping', auth, h(shopping.createList));
r.put('/shopping', auth, h(shopping.updateList));
r.delete('/shopping', auth, h(shopping.deleteList));
r.put('/shopping/task/done', auth, h(shopping.markTask)); // mở rộng
r.post('/shopping/task', auth, h(shopping.createTasks));
r.get('/shopping/task', auth, h(shopping.getTasks));
r.delete('/shopping/task', auth, h(shopping.deleteTask));
r.put('/shopping/task', auth, h(shopping.updateTask));

// ===== 9. Kế hoạch bữa ăn =====
r.post('/meal', auth, h(meal.createPlan));
r.delete('/meal', auth, h(meal.deletePlan));
r.put('/meal', auth, h(meal.updatePlan));
r.get('/meal', auth, h(meal.getPlans));

// ===== 10. Công thức nấu ăn =====
r.get('/recipe/suggest', auth, h(recipe.suggest)); // mở rộng
r.post('/recipe', auth, h(recipe.createRecipe));
r.put('/recipe', auth, h(recipe.updateRecipe));
r.delete('/recipe', auth, h(recipe.deleteRecipe));
r.get('/recipe', auth, h(recipe.getRecipes));

// ===== Thống kê (mở rộng) =====
r.get('/stats', auth, h(stats.getStats));

// ===== Thông báo (mở rộng) =====
r.get('/notification', auth, h(notification.list));
r.put('/notification/read', auth, h(notification.markRead));

// ===== Trợ lý AI (mở rộng) =====
r.post('/chat', auth, h(chat.chat));

module.exports = r;
