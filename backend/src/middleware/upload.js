const multer = require('multer');
const path = require('path');
const fs = require('fs');

const dir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('INVALID_IMAGE'));
  },
});

// Bọc multer để trả mã lỗi theo đặc tả khi upload thất bại
const single = (field, errorCode = '00158') => (req, res, next) => {
  upload.single(field)(req, res, (err) => {
    if (err) {
      const { bad } = require('../utils/response');
      return bad(res, errorCode);
    }
    next();
  });
};

module.exports = { single };
