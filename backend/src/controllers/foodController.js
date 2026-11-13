const Food = require('../models/Food');
const Category = require('../models/Category');
const Unit = require('../models/Unit');
const Group = require('../models/Group');
const FridgeItem = require('../models/FridgeItem');
const Task = require('../models/Task');
const MealPlan = require('../models/MealPlan');
const Recipe = require('../models/Recipe');
const { ok, created, bad, notFound, forbidden, conflict } = require('../utils/response');
const v = require('../utils/validators');

const clean = (s) => (typeof s === 'string' ? s.trim() : '');
const populateFood = (q) => q.populate('category', 'name').populate('unit', 'name').populate('createdBy', 'name username');

async function canEdit(user, food) {
  if (String(food.createdBy) === String(user._id)) return true;
  const group = await Group.findById(food.group);
  return group && String(group.admin) === String(user._id);
}

// POST /food/
exports.createFood = async (req, res) => {
  const { name, foodCategoryName, unitName } = req.body;
  if (!v.isDefined(name) && !v.isDefined(foodCategoryName) && !v.isDefined(unitName)) return bad(res, '00147');
  if (!v.isNonEmptyString(name, 1, 100)) return bad(res, '00148');
  if (!v.isNonEmptyString(foodCategoryName)) return bad(res, '00149');
  if (!v.isNonEmptyString(unitName)) return bad(res, '00150');
  if (!req.user.group) return bad(res, '00156x');

  const unit = await Unit.findOne({ name: clean(unitName) });
  if (!unit) return notFound(res, '00153');
  const category = await Category.findOne({ name: clean(foodCategoryName) });
  if (!category) return notFound(res, '00155');
  if (await Food.findOne({ name: clean(name), group: req.user.group })) return conflict(res, '00151');

  const food = await Food.create({
    name: clean(name),
    category: category._id,
    unit: unit._id,
    group: req.user.group,
    createdBy: req.user._id,
    imageUrl: req.file ? `/uploads/${req.file.filename}` : '',
  });
  return created(res, '00160', { food: await populateFood(Food.findById(food._id)) });
};

// PUT /food/
exports.updateFood = async (req, res) => {
  const { name, newName, newCategory, newUnit } = req.body;
  if (!v.isDefined(name)) return bad(res, '00161');
  if (!v.isNonEmptyString(name)) return bad(res, '00162');
  if (!v.isDefined(newName) && !v.isDefined(newCategory) && !v.isDefined(newUnit) && !req.file) return bad(res, '00163');
  if (v.isDefined(newCategory) && !v.isNonEmptyString(newCategory)) return bad(res, '00164');
  if (v.isDefined(newUnit) && !v.isNonEmptyString(newUnit)) return bad(res, '00165');
  if (v.isDefined(newName) && !v.isNonEmptyString(newName, 1, 100)) return bad(res, '00166');
  if (!req.user.group) return bad(res, '00185');

  const food = await Food.findOne({ name: clean(name), group: req.user.group });
  if (!food) return notFound(res, '00167');
  if (!(await canEdit(req.user, food))) return forbidden(res, '00167x');

  if (v.isDefined(newUnit)) {
    const unit = await Unit.findOne({ name: clean(newUnit) });
    if (!unit) return notFound(res, '00169');
    food.unit = unit._id;
  }
  if (v.isDefined(newCategory)) {
    const category = await Category.findOne({ name: clean(newCategory) });
    if (!category) return notFound(res, '00171');
    food.category = category._id;
  }
  if (v.isDefined(newName) && clean(newName) !== food.name) {
    if (await Food.findOne({ name: clean(newName), group: req.user.group })) return conflict(res, '00173');
    food.name = clean(newName);
  }
  if (req.file) food.imageUrl = `/uploads/${req.file.filename}`;
  await food.save();
  return ok(res, '00178', { food: await populateFood(Food.findById(food._id)) });
};

// DELETE /food/
exports.deleteFood = async (req, res) => {
  const { name } = req.body;
  if (!v.isNonEmptyString(name)) return bad(res, '00179');
  if (!req.user.group) return bad(res, '00185');
  const food = await Food.findOne({ name: clean(name), group: req.user.group });
  if (!food) return notFound(res, '00180');
  if (!(await canEdit(req.user, food))) return forbidden(res, '00181');

  await Promise.all([
    FridgeItem.deleteMany({ food: food._id }),
    Task.deleteMany({ food: food._id }),
    MealPlan.deleteMany({ food: food._id }),
    Recipe.deleteMany({ food: food._id }),
  ]);
  await food.deleteOne();
  return ok(res, '00184');
};

// GET /food/   (hỗ trợ thêm ?q=từ khóa & ?category=tên danh mục)
exports.getFoods = async (req, res) => {
  if (!req.user.group) return bad(res, '00185');
  const filter = { group: req.user.group };
  if (req.query.q) filter.name = new RegExp(v.escapeRegex(String(req.query.q)), 'i');
  if (req.query.category) {
    const cat = await Category.findOne({ name: String(req.query.category) });
    filter.category = cat ? cat._id : null;
  }
  const foods = await populateFood(Food.find(filter).sort({ name: 1 }));
  return ok(res, '00188', { foods });
};
