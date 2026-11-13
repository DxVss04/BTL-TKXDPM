require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const reminder = require('./jobs/expiryReminder');
const realtime = require('./realtime');

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.error('Thiếu JWT_SECRET / JWT_REFRESH_SECRET trong file .env');
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    const server = http.createServer(app);
    realtime.init(server);
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`[SERVER] API chạy tại http://localhost:${PORT}/it4788/`);
      if (app.hasWebBuild) console.log(`[SERVER] Bản web chạy tại http://localhost:${PORT}/`);
    });
    reminder.start();
  })
  .catch((err) => {
    console.error('[DB] Không kết nối được MongoDB:', err.message);
    process.exit(1);
  });
