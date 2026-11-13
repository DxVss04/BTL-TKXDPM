// Tạo dữ liệu mẫu: tài khoản admin, tài khoản demo, danh mục, đơn vị, nhóm, thực phẩm...
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Group = require('./models/Group');
const Category = require('./models/Category');
const Unit = require('./models/Unit');
const Food = require('./models/Food');
const FridgeItem = require('./models/FridgeItem');
const Recipe = require('./models/Recipe');

const DAY = 86400000;

(async () => {
  await connectDB();

  const categories = ['Thịt', 'Cá & hải sản', 'Rau củ', 'Trái cây', 'Trứng & sữa', 'Đồ khô', 'Đồ hộp', 'Gia vị', 'Đồ uống', 'Khác'];
  const units = ['kg', 'g', 'lít', 'ml', 'quả', 'bó', 'hộp', 'gói', 'chai', 'cái', 'lon', 'vỉ'];
  for (const name of categories) await Category.updateOne({ name }, { name }, { upsert: true });
  for (const name of units) await Unit.updateOne({ name }, { name }, { upsert: true });

  const pass = await bcrypt.hash('123456', 10);
  const upsertUser = async (email, name, username, role = 'user') => {
    let u = await User.findOne({ email });
    if (!u) u = await User.create({ email, name, username, password: pass, role, isVerified: true });
    return u;
  };
  await upsertUser('admin@dicho.vn', 'Quản trị viên', 'admin', 'admin');
  const mom = await upsertUser('me@dicho.vn', 'Mẹ Lan', 'melan');
  const dad = await upsertUser('bo@dicho.vn', 'Bố Hùng', 'bohung');

  if (!mom.group) {
    const g = await Group.create({ admin: mom._id, members: [mom._id, dad._id] });
    mom.group = g._id; await mom.save();
    dad.group = g._id; await dad.save();

    const cat = async (n) => (await Category.findOne({ name: n }))._id;
    const unit = async (n) => (await Unit.findOne({ name: n }))._id;
    const foods = [
      ['Thịt lợn', 'Thịt', 'kg'], ['Thịt bò', 'Thịt', 'kg'], ['Cá thu', 'Cá & hải sản', 'kg'],
      ['Trứng gà', 'Trứng & sữa', 'quả'], ['Cà chua', 'Rau củ', 'kg'], ['Rau muống', 'Rau củ', 'bó'],
      ['Sữa tươi', 'Trứng & sữa', 'hộp'], ['Táo', 'Trái cây', 'kg'], ['Đậu phụ', 'Khác', 'cái'],
    ];
    const created = {};
    for (const [name, c, u] of foods) {
      created[name] = await Food.create({ name, category: await cat(c), unit: await unit(u), group: g._id, createdBy: mom._id });
    }
    const fridge = [['Thịt lợn', 1, 2], ['Trứng gà', 10, 14], ['Cà chua', 0.5, 5], ['Sữa tươi', 4, 1], ['Đậu phụ', 3, 3]];
    for (const [name, q, d] of fridge) {
      await FridgeItem.create({ food: created[name]._id, group: g._id, quantity: q, useWithin: d, startDate: new Date(), expiredDate: new Date(Date.now() + d * DAY), createdBy: mom._id, location: 'Ngăn mát' });
    }
    await Recipe.create({
      name: 'Trứng xào cà chua', food: created['Trứng gà']._id, group: g._id, createdBy: mom._id,
      description: 'Món ăn nhanh, đơn giản cho bữa tối',
      htmlContent: '<h3>Nguyên liệu</h3><ul><li>3 quả trứng</li><li>2 quả cà chua</li><li>Hành lá, nước mắm</li></ul><h3>Cách làm</h3><ol><li>Đánh tan trứng với chút nước mắm.</li><li>Xào cà chua với hành cho mềm.</li><li>Đổ trứng vào, đảo nhẹ đến khi chín.</li></ol>',
    });
    await Recipe.create({
      name: 'Đậu phụ sốt cà chua', food: created['Đậu phụ']._id, group: g._id, createdBy: mom._id,
      description: 'Món chay đưa cơm',
      htmlContent: '<h3>Cách làm</h3><ol><li>Rán vàng đậu phụ.</li><li>Phi hành, xào cà chua thành sốt.</li><li>Cho đậu vào rim 5 phút, nêm vừa ăn.</li></ol>',
    });
  }

  console.log('\n✅ Seed xong. Tài khoản (mật khẩu đều là 123456):');
  console.log('   admin@dicho.vn  (quản trị hệ thống)');
  console.log('   me@dicho.vn     (trưởng nhóm, username: melan)');
  console.log('   bo@dicho.vn     (thành viên, username: bohung)\n');
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
