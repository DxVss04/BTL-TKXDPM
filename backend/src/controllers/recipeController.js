const Recipe = require('../models/Recipe');
const Food = require('../models/Food');
const FridgeItem = require('../models/FridgeItem');
const { ok, created, bad, notFound, forbidden } = require('../utils/response');
const v = require('../utils/validators');

const clean = (s) => (typeof s === 'string' ? s.trim() : '');
const populateRecipe = (q) => q.populate('food', 'name imageUrl').populate('createdBy', 'name username');

// POST /recipe/
exports.createRecipe = async (req, res) => {
  const { foodName, name, htmlContent, description } = req.body;
  if (!v.isDefined(foodName) && !v.isDefined(name) && !v.isDefined(htmlContent) && !v.isDefined(description)) return bad(res, '00349');
  if (!v.isNonEmptyString(foodName)) return bad(res, '00350');
  if (!v.isNonEmptyString(name, 1, 200)) return bad(res, '00351');
  if (!v.isNonEmptyString(description)) return bad(res, '00352');
  if (!v.isNonEmptyString(htmlContent)) return bad(res, '00353');
  if (!req.user.group) return bad(res, '00345');
  const food = await Food.findOne({ name: clean(foodName), group: req.user.group });
  if (!food) return notFound(res, '00354');

  const recipe = await Recipe.create({
    name: clean(name), description, htmlContent, food: food._id,
    group: req.user.group, createdBy: req.user._id,
  });
  return created(res, '00357', { recipe: await populateRecipe(Recipe.findById(recipe._id)) });
};

// PUT /recipe/
exports.updateRecipe = async (req, res) => {
  const { recipeId, newFoodName, newDescription, newHtmlContent, newName, favorite } = req.body;
  if (!v.isDefined(recipeId) && !v.isDefined(newFoodName) && !v.isDefined(newDescription) && !v.isDefined(newHtmlContent) && !v.isDefined(newName)) return bad(res, '00358');
  if (!v.isDefined(recipeId) || !v.isObjectId(String(recipeId))) return bad(res, '00359');
  if (!v.isDefined(newFoodName) && !v.isDefined(newDescription) && !v.isDefined(newHtmlContent) && !v.isDefined(newName) && !v.isDefined(favorite)) return bad(res, '00360');
  if (v.isDefined(newFoodName) && !v.isNonEmptyString(newFoodName)) return bad(res, '00361');
  if (v.isDefined(newDescription) && !v.isNonEmptyString(newDescription)) return bad(res, '00362');
  if (v.isDefined(newHtmlContent) && !v.isNonEmptyString(newHtmlContent)) return bad(res, '00363');
  if (v.isDefined(newName) && !v.isNonEmptyString(newName, 1, 200)) return bad(res, '00364');

  const recipe = await Recipe.findById(recipeId);
  if (!recipe) return notFound(res, '00365');
  if (String(recipe.group) !== String(req.user.group)) return forbidden(res, '00017');
  if (v.isDefined(newFoodName)) {
    const food = await Food.findOne({ name: clean(newFoodName), group: req.user.group });
    if (!food) return notFound(res, '00367');
    recipe.food = food._id;
  }
  if (v.isDefined(newDescription)) recipe.description = newDescription;
  if (v.isDefined(newHtmlContent)) recipe.htmlContent = newHtmlContent;
  if (v.isDefined(newName)) recipe.name = clean(newName);
  if (v.isDefined(favorite)) recipe.favorite = favorite === true || favorite === 'true';
  await recipe.save();
  return ok(res, '00370', { recipe: await populateRecipe(Recipe.findById(recipe._id)) });
};

// DELETE /recipe/
exports.deleteRecipe = async (req, res) => {
  const { recipeId } = req.body;
  if (!v.isDefined(recipeId)) return bad(res, '00371');
  if (!v.isObjectId(String(recipeId))) return bad(res, '00372');
  const recipe = await Recipe.findById(recipeId);
  if (!recipe) return notFound(res, '00373');
  if (String(recipe.group) !== String(req.user.group)) return forbidden(res, '00017');
  await recipe.deleteOne();
  return ok(res, '00376');
};

// GET /recipe/?foodId=...   (mở rộng: không truyền foodId -> lấy tất cả công thức của nhóm, hỗ trợ ?q=)
exports.getRecipes = async (req, res) => {
  if (!req.user.group) return bad(res, '00345');
  const filter = { group: req.user.group };
  if (req.query.foodId) {
    if (!v.isObjectId(String(req.query.foodId))) return bad(res, '00023');
    filter.food = req.query.foodId;
  }
  if (req.query.q) filter.name = new RegExp(v.escapeRegex(String(req.query.q)), 'i');
  const recipes = await populateRecipe(Recipe.find(filter).sort({ favorite: -1, createdAt: -1 }));
  return ok(res, req.query.foodId ? '00378' : '00912', { recipes });
};

// GET /recipe/suggest/   (mở rộng) Gợi ý món ăn từ thực phẩm đang có trong tủ lạnh,
// ưu tiên thực phẩm sắp hết hạn để tránh lãng phí.
exports.suggest = async (req, res) => {
  if (!req.user.group) return bad(res, '00345');
  const items = await FridgeItem.find({ group: req.user.group, quantity: { $gt: 0 } }).populate('food', 'name');
  const expiryByFood = {};
  items.forEach((i) => { if (i.food) expiryByFood[String(i.food._id)] = i.expiredDate; });
  const recipes = await populateRecipe(Recipe.find({ group: req.user.group, food: { $in: Object.keys(expiryByFood) } }));
  const now = Date.now();
  const suggestions = recipes
    .map((r) => {
      const exp = expiryByFood[String(r.food._id)];
      const daysLeft = Math.ceil((new Date(exp).getTime() - now) / 86400000);
      return { recipe: r, daysLeft, reason: daysLeft <= 3 ? `${r.food.name} sắp hết hạn (${daysLeft} ngày)` : `Có sẵn ${r.food.name} trong tủ lạnh` };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);
  // Thực phẩm có trong tủ nhưng chưa có công thức nào
  const withRecipe = new Set(recipes.map((r) => String(r.food._id)));
  const foodsWithoutRecipe = items.filter((i) => i.food && !withRecipe.has(String(i.food._id))).map((i) => i.food.name);
  return ok(res, '00901', { suggestions, foodsWithoutRecipe });
};
