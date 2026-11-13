# Đi chợ tiện lợi – IT4788 Phát triển ứng dụng đa nền tảng

Dự án gồm 2 phần:

| Thư mục | Công nghệ | Mô tả |
|---|---|---|
| `backend/` | Node.js, Express, MongoDB (Mongoose), JWT | REST API theo đúng đặc tả của thầy: đường dẫn `/it4788/...`, mã phản hồi `00xxx` |
| `mobile/` | React Native (Expo), React Navigation, Axios, Socket.IO | App cho Android, iOS và web (cùng một mã nguồn) |

---

## 1. Cần cài trước

1. **Node.js 18 trở lên** (khuyên dùng bản 20 hoặc 22 LTS): https://nodejs.org
2. **MongoDB**, chọn 1 trong 3 cách:
   - Cài MongoDB Community Server: https://www.mongodb.com/try/download/community
   - Hoặc dùng Docker: `docker compose up -d` ở thư mục gốc
   - Hoặc dùng MongoDB Atlas (miễn phí), rồi sửa `MONGO_URI` trong `backend/.env`
3. Cài app **Expo Go** trên điện thoại (CH Play / App Store), hoặc dùng máy ảo Android.

## 2. Chạy trong VS Code (nhanh nhất)

1. Giải nén file, chọn **File → Open Folder…** và mở thư mục `di-cho-tien-loi`.
2. Nhấn `Ctrl + Shift + P`, gõ **Tasks: Run Task**, rồi chạy lần lượt:
   - `Cài đặt tất cả` (cài thư viện cho backend và app, chỉ cần chạy lần đầu)
   - `2. Tạo dữ liệu mẫu (seed)` (chỉ cần chạy lần đầu)
   - `Chạy tất cả (backend + app)`
3. Terminal của Expo sẽ hiện mã QR. Mở **Expo Go** trên điện thoại rồi quét mã. Điện thoại và máy tính phải dùng **cùng một mạng Wi-Fi**.

Muốn chạy bằng tay thì mở 2 terminal:

```bash
# Terminal 1 – backend
cd backend
npm install
npm run seed      # tạo dữ liệu mẫu
npm run dev       # API chạy ở http://localhost:3000/it4788/

# Terminal 2 – app
cd mobile
npm install
npx expo start    # quét QR bằng Expo Go, hoặc bấm "a" để mở máy ảo Android
```

### Tài khoản mẫu (sau khi chạy seed, mật khẩu đều là `123456`)

| Email | Vai trò |
|---|---|
| `admin@dicho.vn` | Quản trị hệ thống (quản lý danh mục, đơn vị, người dùng, log) |
| `me@dicho.vn` | Trưởng nhóm gia đình (username `melan`) |
| `bo@dicho.vn` | Thành viên nhóm (username `bohung`) |

### Bản web

App chạy trên web bằng chính mã nguồn của bản di động (Expo + `react-native-web`) và tự đổi giao diện theo độ rộng màn hình:

- **Từ 900px trở lên** (máy tính, tablet nằm ngang): thanh điều hướng bên trái luôn hiện, kể cả ở trang chi tiết; danh sách chia 2–3 cột; Trang chủ chia 2 cột; hộp chọn hiện giữa màn hình.
- **Dưới 900px** (điện thoại, cửa sổ hẹp): giữ giao diện di động với thanh tab ở dưới.

Hai cách chạy:

| Mục đích | Lệnh | Địa chỉ |
|---|---|---|
| Phát triển (tự tải lại khi sửa code) | `cd mobile && npx expo start --web` (backend vẫn chạy `npm run dev`) | http://localhost:8081 |
| Demo / triển khai (1 server cho cả API và web) | `cd mobile && npm run build:web`, rồi `cd backend && npm start` | http://localhost:3000 |

Với cách thứ hai, backend phục vụ thư mục `mobile/dist` và app gọi API trên cùng địa chỉ, nên chỉ cần mở một cổng. Build lại thì khởi động lại backend. Trong VS Code có sẵn task **Chạy bản web (build + backend)**.

### Trợ lý AI "Bếp Nhỏ" (chatbot)

Chatbot gợi ý món ăn, thực đơn và thực phẩm nên mua. Mỗi câu hỏi, backend gửi kèm danh sách tủ lạnh của gia đình (sắp theo hạn dùng, đánh dấu đồ đã quá hạn) và các công thức đã lưu, nên câu trả lời ưu tiên dùng đồ sắp hết hạn. Chatbot dùng model Claude của Anthropic.

Mở chatbot từ nút **"Hỏi trợ lý AI: hôm nay nấu gì?"** ở Trang chủ, mục **Trợ lý AI** ở thanh bên trái (máy tính), hoặc nút trong màn **Gợi ý món**.

**Bật chatbot:**

1. Tạo khóa API tại https://platform.claude.com (mục **API Keys**).
2. Thêm vào `backend/.env`:
   ```
   ANTHROPIC_API_KEY=khóa-của-bạn
   ```
3. Khởi động lại backend.

Chưa có khóa thì app vẫn chạy bình thường; riêng màn chat sẽ báo "Trợ lý AI chưa được cấu hình".

**Tùy chọn trong `backend/.env`:**

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `CHATBOT_MODEL` | `claude-opus-5-5` | Model Claude dùng để trả lời |
| `CHATBOT_EFFORT` | `low` | Mức suy nghĩ: `low` trả lời nhanh, `medium` / `high` kỹ hơn nhưng chậm và tốn hơn |

**Cần biết:**

- **Chi phí:** mỗi câu hỏi tính phí theo bảng giá API của Anthropic. Để hạn chế, mỗi người dùng hỏi tối đa 30 câu trong 10 phút, và chỉ 20 tin nhắn gần nhất được gửi kèm.
- **Dữ liệu gửi đi:** tên người hỏi, danh sách tủ lạnh, tên công thức của nhóm và nội dung trò chuyện được gửi tới Anthropic để tạo câu trả lời. Khóa API chỉ nằm ở backend, app không bao giờ thấy.
- **Lịch sử trò chuyện** lưu trên máy của từng người (40 tin gần nhất), xóa bằng biểu tượng thùng rác ở góc phải màn chat.
- Nếu model từ chối nhầm một câu hỏi vì bộ lọc an toàn, API tự trả lời lại bằng model dự phòng (`fallbacks: "default"`).

## 3. Xử lý lỗi thường gặp

- **App báo "Không kết nối được máy chủ":**
  - Kiểm tra backend đang chạy.
  - Kiểm tra điện thoại và máy tính dùng cùng Wi-Fi.
  - Trên Windows: khi tường lửa hỏi thì cho phép Node.js truy cập mạng, hoặc mở cổng 3000.
  - App tự lấy IP từ máy đang chạy Expo. Nếu backend chạy ở máy khác, khởi động app bằng lệnh sau (thay IP cho đúng):
    `EXPO_PUBLIC_API_URL=http://192.168.1.10:3000 npx expo start`
- **Expo Go báo dự án dùng SDK cũ (incompatible SDK version):** chạy lệnh dưới trong thư mục `mobile`. Lệnh này nâng Expo và các thư viện đi kèm lên phiên bản Expo Go đang hỗ trợ.
  ```bash
  npx expo install expo@latest
  npx expo install --fix
  ```
- **Không nhận được email mã xác thực:** khi chưa cấu hình SMTP trong `backend/.env`, mã xác thực sẽ được in ra terminal của backend và hiện luôn trên màn hình xác minh (chế độ dev). Muốn gửi email thật thì điền `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (Gmail cần dùng App Password).
- **Trợ lý AI báo lỗi:**
  - "chưa được cấu hình": thiếu hoặc sai `ANTHROPIC_API_KEY` trong `backend/.env`. Sửa xong thì khởi động lại backend.
  - "Bạn hỏi hơi nhanh": vượt 30 câu trong 10 phút, hoặc tài khoản Anthropic bị giới hạn tốc độ. Đợi vài phút rồi hỏi lại.
  - "đang bận": lỗi phía máy chủ Anthropic hoặc mất mạng. Bấm **Thử lại** dưới tin nhắn lỗi.
- **Bản web build hiện trang trắng:** chạy `npx expo install --check` trong `mobile` và sửa các gói lệch phiên bản (ví dụ `@expo/vector-icons` phải là `~14.0.4` với SDK 52), rồi build lại.
- **Push notification:** trong Expo Go trên Android, push từ server có thể không hoạt động (giới hạn của Expo Go). App vẫn **tự đặt lịch nhắc nhở cục bộ** trước 3 ngày cho từng thực phẩm trong tủ lạnh, nên vẫn có thông báo khi demo. Muốn có push đầy đủ thì build bản development bằng `npx expo run:android`, hoặc dùng EAS.

## 4. Chức năng đã làm (so với đề bài)

| Đề bài | Đã làm |
|---|---|
| Quản lý danh sách mua sắm, chia sẻ trong nhóm, trưởng nhóm phân công | Tạo, sửa, xóa danh sách; giao cho thành viên; thêm, sửa, xóa món; người được giao tick "đã mua" và có thể cho món đó vào tủ lạnh ngay; có push báo khi được giao việc |
| Lên lịch bữa ăn sáng, trưa, tối theo ngày hoặc tuần | Lịch theo tuần, mỗi ngày chia 3 bữa, đánh dấu món đang có trong tủ |
| Gợi ý món ăn từ đồ có sẵn | Màn "Gợi ý món" ưu tiên các món dùng nguyên liệu sắp hết hạn |
| Quản lý thực phẩm trong tủ lạnh: số lượng, hạn dùng, vị trí | Có đủ; khi dùng hết hoặc bỏ đi sẽ ghi lại lịch sử để thống kê |
| Nhắc trước 3 ngày khi sắp hết hạn | Server gửi push mỗi giờ; app đặt lịch nhắc cục bộ |
| Công thức nấu ăn liên kết nguyên liệu | Thêm, sửa, xóa công thức, đánh dấu yêu thích, hiển thị HTML bằng WebView |
| Tìm kiếm, phân loại thực phẩm | Tìm theo tên, lọc theo danh mục ở tủ lạnh và danh mục thực phẩm |
| Thống kê báo cáo | Số món đã mua, đã dùng, bỏ đi; biểu đồ theo ngày; top thực phẩm; tỉ lệ lãng phí; tỉ lệ hoàn thành nhiệm vụ |
| Quản trị hệ thống | Quản lý danh mục, đơn vị, tài khoản (khóa, cấp quyền admin, xóa) và xem log |
| Xử lý JSON, push notification | Có; thêm thông báo realtime qua Socket.IO, chuông có số đỏ, chấm đỏ trên tab và danh sách mới |
| Đa nền tảng | Android, iOS và web từ cùng mã nguồn; web có giao diện riêng cho màn hình rộng |
| (Mở rộng) Trợ lý AI | Chatbot "Bếp Nhỏ" gợi ý món, thực đơn, đồ cần mua dựa trên tủ lạnh của gia đình |

## 5. API

Toàn bộ API trong tài liệu của thầy đều có, đúng method, đường dẫn, tên tham số và mã phản hồi (xem `backend/src/routes/index.js` và `backend/src/utils/messages.js`).

Mọi phản hồi có dạng:

```json
{ "resultCode": "00047", "resultMessage": { "vn": "Bạn đã đăng nhập thành công." }, "...": "dữ liệu" }
```

Các API **mở rộng** do nhóm bổ sung (mã `009xx`, có thể trình bày để lấy điểm cộng):

| API | Mô tả |
|---|---|
| `GET /fridge/expiring?days=3` | Thực phẩm sắp hết hạn |
| `GET /recipe/suggest` | Gợi ý món từ tủ lạnh |
| `GET /recipe` (không có `foodId`) | Tất cả công thức của nhóm, hỗ trợ `?q=` |
| `PUT /shopping/task/done` | Đánh dấu đã mua (người được giao hoặc trưởng nhóm) |
| `DELETE /user/group/leave` | Rời nhóm |
| `POST /user/push-token` | Lưu Expo push token |
| `GET /stats?from=&to=` | Thống kê mua sắm và tiêu thụ |
| `GET/PUT/DELETE /admin/users`, `GET /admin/overview` | Quản lý tài khoản |
| `GET /food?q=&category=`, `GET /fridge?q=&category=` | Tìm kiếm, lọc |
| `GET /notification`, `PUT /notification/read` | Danh sách thông báo, đánh dấu đã đọc |
| `POST /chat` | Trợ lý AI: gửi `{ messages: [{ role, content }], requestId }`, nhận `{ reply }` |

Có thể test nhanh bằng file `api-test.http` (cài extension **REST Client** trong VS Code).

**Realtime (Socket.IO, cùng cổng với API):** kết nối với `auth: { token: <accessToken> }`. Mỗi người dùng ở một phòng riêng nên chỉ nhận sự kiện của mình.

| Sự kiện | Người nhận | Dữ liệu |
|---|---|---|
| `notification` | Người được phân công (khi được giao, chuyển người, sửa hoặc xóa danh sách, thêm món); cả nhóm (khi thực phẩm sắp hết hạn) | `{ id, title, body, data }` |
| `shopping:changed` | Mọi thành viên trong nhóm | `{ listId }`, app dùng để tự tải lại |
| `notifications:changed` | Người dùng liên quan | App tải lại danh sách thông báo |
| `meal:changed` | Mọi thành viên trong nhóm | App tải lại lịch bữa ăn |
| `chat:delta` | Người đang hỏi trợ lý AI | `{ requestId, text }`, từng đoạn câu trả lời để chữ hiện dần |

Mỗi thông báo cũng được gửi qua Expo Push để người đã đóng app vẫn nhận được, và được lưu 30 ngày để hiện chấm đỏ khi mở lại app. Đọc qua `GET /notification`, đánh dấu đã đọc qua `PUT /notification/read` với `{ ids: [...] }` hoặc `{ all: true }`.

**Một số quy ước nhóm đã chọn** (đặc tả gốc không nói rõ, nên ghi vào báo cáo):

- `useWithin` là **số ngày** dùng được kể từ lúc cho vào tủ; hạn dùng = ngày cho vào + `useWithin`.
- Tên thực phẩm là duy nhất **trong mỗi nhóm**; mỗi thực phẩm chỉ có 1 mục trong tủ lạnh.
- Chỉ **trưởng nhóm** được tạo, sửa danh sách mua sắm và kế hoạch bữa ăn (theo các mã lỗi "không phải quản trị viên nhóm" trong đặc tả). Mọi thành viên đều được thêm thực phẩm, đồ trong tủ và công thức.
- Bữa ăn nhận `name` là `sáng`, `trưa`, `tối` (cũng chấp nhận `sang`, `trua`, `toi`, `breakfast`, `lunch`, `dinner`).

## 6. Cấu trúc thư mục

```
backend/src
├── config/db.js            kết nối MongoDB
├── models/                 User, Group, Category, Unit, Food, FridgeItem, ShoppingList, Task, MealPlan, Recipe, Activity, Log, Notification
├── middleware/             auth (JWT), upload ảnh (multer), ghi log, giới hạn request, xử lý lỗi
├── controllers/            user, group, admin, food, fridge, shopping, meal, recipe, stats, notification, chat
├── services/chatbot.js     trợ lý AI: dựng ngữ cảnh tủ lạnh, gọi Claude
├── routes/index.js         khai báo toàn bộ API
├── jobs/expiryReminder.js  quét hạn dùng và gửi thông báo
├── realtime.js             Socket.IO, mỗi người dùng một phòng
├── utils/                  bảng mã phản hồi, kiểm tra dữ liệu, gửi mail, gửi push, lưu + gửi thông báo
├── app.js, server.js       app.js phục vụ cả bản web đã build (mobile/dist)
└── seed.js                 dữ liệu mẫu

mobile/src
├── api/                    axios client (tự refresh token) và các hàm gọi API
├── context/                đăng nhập (AuthContext), thông báo + chấm đỏ (NotificationContext)
├── navigation/             stack + bottom tabs; thanh bên trái trên màn hình rộng
├── components/             ui.js (component dùng chung), Sidebar, chuông và banner thông báo, bản web (*.web.js)
├── screens/                auth, home, fridge, food, shopping, meal, recipe, group, profile, stats, admin, notification, chat
└── utils/                  định dạng ngày, thông báo, hooks, realtime (Socket.IO), layout (responsive)
```
