# SIXEDI Shop - Ứng Dụng Thương Mại Điện Tử

## Thông Tin Thành Viên Nhóm

| Họ Tên | Lớp | MSSV |
|--------|------|------|
| Nguyễn Hoài Nam | D18CNPM2 | 23810310082 |
| Nguyễn Huy Cường | D18CNPM2 | 23810310084 |
| Phạm Tiến Vinh | D18CNPM2 | 23810310085 |

---

## Mô Tả Project

SIXEDI Shop là một ứng dụng thương mại điện tử toàn diện bao gồm:
- **Backend**: Node.js + Express + Prisma + PostgreSQL
- **Mobile App**: React Native + Expo
- **Tính năng chính**: 
  - Đăng ký/Đăng nhập với xác thực JWT
  - Quản lý sản phẩm
  - Giỏ hàng
  - Thanh toán
  - Quản lý đơn hàng
  - Hồ sơ người dùng
  - Quản trị viên

---

## Cài Đặt Nhanh

### Yêu Cầu Hệ Thống
- **Node.js**: v18 trở lên
- **npm** hoặc **yarn**
- **PostgreSQL**: v12 trở lên
- **Git**
- **Expo CLI** (cho mobile)

---

## 🔧 Hướng Dẫn Cài Đặt Backend

### 1. Điều hướng vào thư mục backend
```bash
cd backend
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình biến môi trường
Tạo file `.env` từ file `.env.example`:
```bash
cp .env.example .env
```

Cập nhật các biến trong file `.env`:
```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://shopuser:shoppass@localhost:5432/shopdb"

# JWT Configuration
JWT_SECRET="your_super_secret_jwt_key_change_this_in_production"
ACCESS_TOKEN_TTL="15m"
REFRESH_TOKEN_TTL="7d"
RESET_TOKEN_TTL="15m"

# Server
PORT=8080
NODE_ENV=development

# VNPay (Optional - for payment gateway)
VNPAY_TMN_CODE="your_vnpay_tmn_code"
VNPAY_HASH_SECRET="your_vnpay_hash_secret"
VNPAY_URL="https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
VNPAY_RETURN_URL="http://localhost:8080/api/payments/vnpay/return"
VNPAY_IPN_URL="http://localhost:8080/api/payments/vnpay/ipn"
VNPAY_LOCALE="vn"
```

**Lưu ý quan trọng:**
- Database phải là **PostgreSQL** (không phải MySQL)
- Port backend mặc định là **8080**
- JWT_SECRET nên được thay đổi trong production
- VNPay là tùy chọn, để trống nếu chỉ dùng COD (thanh toán khi nhận)

### 4. Khởi tạo cơ sở dữ liệu
```bash
# Chạy migrations (tạo tables)
npx prisma migrate deploy

# Seed dữ liệu mẫu (tài khoản test, sản phẩm, v.v)
npm run seed
```

**Lưu ý:** Sau khi chạy `npm run seed`, các tài khoản test sẽ được tạo tự động

### 5. Khởi động server
```bash
# Development mode (có auto-reload)
npm run dev

# Hoặc production mode
npm run build
npm start
```

✅ Server sẽ chạy tại `http://localhost:8080`
✅ API sẽ ở `http://localhost:8080/api`

---

## Hướng Dẫn Cài Đặt Mobile App

### 1. Điều hướng vào thư mục mobile
```bash
cd expo-mobile
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình API URL (Tự động)
File `src/config/api.js` đã được cấu hình để tự động tìm backend:
- **Android Emulator**: `http://10.0.2.2:8080/api`
- **Android Device (LAN)**: Tự động detect từ Expo host
- **iOS**: `http://localhost:8080/api`
- **Web**: `http://localhost:8080/api`

Nếu cần cấu hình thủ công, set environment variable:
```bash
EXPO_PUBLIC_API_BASE_URL="http://your_local_ip:8080/api"
```

### 4. Khởi động ứng dụng

#### Trên Android:
```bash
npm run android
```

#### Trên iOS:
```bash
npm run ios
```

#### Trên Web:
```bash
npm run web
```

#### Hoặc sử dụng Expo CLI:
```bash
npm start
# Sau đó chọn platform (android, ios, web)
```

---

## Hướng Dẫn Sử Dụng

### Backend API Endpoints

#### Authentication (Xác thực) - `BASE_URL/auth`
- `POST /auth/register` - Đăng ký tài khoản mới
  - Body: `{ email, password, fullName }`
  - Password yêu cầu: 8+ ký tự, chữ hoa, chữ thường, số
- `POST /auth/login` - Đăng nhập
  - Body: `{ email, password }`
- `POST /auth/refresh` - Làm mới access token
  - Body: `{ refreshToken }`
- `POST /auth/logout` - Đăng xuất
  - Body: `{ refreshToken }`
- `POST /auth/password/forgot` - Quên mật khẩu
  - Body: `{ email }`
- `POST /auth/password/reset` - Đặt lại mật khẩu
  - Body: `{ token, newPassword }`

#### User (Người dùng)
- `GET /api/users/profile` - Lấy thông tin hồ sơ
- `PUT /api/users/profile` - Cập nhật thông tin hồ sơ
- `GET /api/users` - Danh sách người dùng (chỉ admin)

#### Products (Sản phẩm)
- `GET /api/products` - Danh sách sản phẩm
- `GET /api/products/:id` - Chi tiết sản phẩm
- `POST /api/products` - Tạo sản phẩm (chỉ admin)
- `PUT /api/products/:id` - Cập nhật sản phẩm (chỉ admin)

#### Cart (Giỏ hàng)
- `GET /api/cart` - Lấy giỏ hàng
- `POST /api/cart/add` - Thêm vào giỏ hàng
- `PUT /api/cart/:itemId` - Cập nhật số lượng
- `DELETE /api/cart/:itemId` - Xóa khỏi giỏ hàng
- `DELETE /api/cart` - Xóa toàn bộ giỏ hàng

#### Orders (Đơn hàng)
- `GET /api/orders` - Danh sách đơn hàng
- `POST /api/orders` - Tạo đơn hàng
- `GET /api/orders/:id` - Chi tiết đơn hàng
- `PUT /api/orders/:id` - Cập nhật đơn hàng

### Tính Năng Mobile App

#### 1. Xác Thực
- ✅ Đăng ký tài khoản với email, mật khẩu (tối thiểu 8 ký tự, có chữ hoa, chữ thường, số)
- ✅ Đăng nhập với email/tên tài khoản
- ✅ Ghi nhớ email (Remember me)
- ✅ Xem/ẩn mật khẩu

#### 2. Duyệt Sản Phẩm
- ✅ Xem danh sách sản phẩm
- ✅ Tìm kiếm sản phẩm
- ✅ Xem chi tiết sản phẩm
- ✅ Thêm vào giỏ hàng

#### 3. Quản Lý Giỏ Hàng
- ✅ Xem giỏ hàng
- ✅ Tăng/giảm số lượng
- ✅ Xóa sản phẩm khỏi giỏ
- ✅ Tính toán tự động phí vận chuyển
- ✅ Tiếp tục mua sắm

#### 4. Thanh Toán
- ✅ Nhập thông tin giao hàng
- ✅ Chọn phương thức thanh toán
- ✅ Tạo đơn hàng

#### 5. Quản Lý Tài Khoản
- ✅ Xem thông tin hồ sơ
- ✅ Cập nhật thông tin (họ tên, số điện thoại)
- ✅ Xem lịch sử đơn hàng
- ✅ Quản lý địa chỉ giao hàng
- ✅ Quản lý phương thức thanh toán
- ✅ Đăng xuất

#### 6. Quản Trị Viên
- ✅ Xem danh sách người dùng
- ✅ Quản lý sản phẩm
- ✅ Xem thống kê đơn hàng

---

## 📝 Cấu Trúc Project

```
ltm/
├── backend/                    # Backend server
│   ├── src/
│   │   ├── controllers/       # API controllers
│   │   ├── services/          # Business logic
│   │   ├── routes/            # API routes
│   │   ├── middlewares/       # Express middlewares
│   │   ├── models/            # Database models
│   │   ├── utils/             # Utility functions
│   │   └── config/            # Configuration
│   ├── prisma/                # Database schema
│   └── package.json
│
├── expo-mobile/               # Mobile app
│   ├── src/
│   │   ├── screens/          # Screen components
│   │   ├── components/       # Reusable components
│   │   ├── context/          # React context
│   │   ├── config/           # Configuration
│   │   └── theme.js          # Theme styling
│   ├── App.js                # Main app component
│   └── package.json
│
└── README.md                  # This file
```

---

## Thông Tin Đăng Nhập Test

Các tài khoản sau được tạo tự động khi chạy `npm run seed`:

### Tài Khoản Quản Trị Viên (Admin)
| Thông Tin | Giá Trị |
|-----------|--------|
| Email | admin@ltwnc.tech |
| Mật khẩu | Admin@123 |
| Họ tên | Admin User |
| Vai trò | ADMIN |

### Tài Khoản Người Dùng (User)
| Email | Mật khẩu | Họ Tên | Vai Trò |
|-------|----------|--------|--------|
| user@ltwnc.tech | User@123 | Test User 1 | USER |
| user2@ltwnc.tech | User@123 | Test User 2 | USER |
| user3@ltwnc.tech | User@123 | Test User 3 | USER |
| user4@ltwnc.tech | User@123 | Test User 4 | USER |
| user5@ltwnc.tech | User@123 | Test User 5 | USER |

**Mật khẩu mặc định cho tất cả User**: `User@123`

---

## Các Lệnh Hữu Ích

### Backend
```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Database migration
npx prisma migrate dev --name migration_name

# Seed database
npm run seed

# Prisma studio
npx prisma studio
```

### Mobile
```bash
# Start development server
npm start

# Android
npm run android

# iOS
npm run ios

# Web
npm run web

# Clear cache
npm start -- -c
```

---

## Troubleshooting

### Backend không kết nối được database
- Kiểm tra PostgreSQL đã chạy
- Kiểm tra `DATABASE_URL` trong file `.env`
- Chạy migrations: `npx prisma migrate deploy`

### Mobile không kết nối được API
- Kiểm tra IP address backend đúng trong `src/config/api.js`
- Kiểm tra backend đang chạy
- Đảm bảo điện thoại và máy backend cùng mạng LAN

### Lỗi permission denied
- Chạy: `chmod +x ./scripts/*.sh` (trên Mac/Linux)
- Hoặc chạy PowerShell as Administrator (trên Windows)

---

