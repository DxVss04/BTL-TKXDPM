const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const routes = require('./routes');
const requestLogger = require('./middleware/logger');
const rateLimit = require('./middleware/rateLimit');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Bản web đã build bằng "npm run build:web" trong thư mục mobile
const WEB_DIR = process.env.WEB_DIR || path.join(__dirname, '..', '..', 'mobile', 'dist');
const WEB_INDEX = path.join(WEB_DIR, 'index.html');
const hasWebBuild = fs.existsSync(WEB_INDEX);

const app = express();
app.set('trust proxy', true);
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const apiInfo = (req, res) => res.json({ name: 'Đi chợ tiện lợi API', base: '/it4788', status: 'ok', web: hasWebBuild });
app.get('/api', apiInfo);

app.use('/it4788', rateLimit({ windowMs: 60_000, max: 300 }), requestLogger, routes);

if (hasWebBuild) {
  // index.html luôn lấy bản mới; các file JS có mã băm trong tên nên trình duyệt cache được
  const noCacheIndex = (res, file) => { if (file.endsWith('index.html')) res.setHeader('Cache-Control', 'no-cache'); };
  app.use(express.static(WEB_DIR, { setHeaders: noCacheIndex }));
  app.get(/^\/(?!it4788\/|uploads\/|socket\.io\/).*/, (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(WEB_INDEX);
  });
} else {
  app.get('/', apiInfo);
}

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
module.exports.hasWebBuild = hasWebBuild;
