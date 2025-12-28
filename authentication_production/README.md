# 🚀 MindX OpenID Connect - Production Deployment

Version production-ready của OpenID Connect authentication với MindX Identity Provider, được tối ưu cho Azure Cloud deployment.

## 📋 Thông tin Azure

- **Domain**: `tungha104.id.vn`
- **Load Balancer IP**: `4.144.170.166`
- **Backend API**: `https://tungha104.id.vn/api`

## 🔧 Khác biệt so với Development Version

### 1. **BACKEND_URL**
- ✅ **Production**: Dùng `window.location.origin` (tự động detect domain)
- ❌ Development: Hardcode `http://localhost:3000`

### 2. **CORS Configuration**
- ✅ **Production**: Chỉ cho phép domain cụ thể (`tungha104.id.vn`)
- ❌ Development: Cho phép tất cả origins

### 3. **Environment Variables**
- ✅ **Production**: Dùng `.env` với `NODE_ENV=production`
- ❌ Development: Hardcode values

## 📁 Cấu trúc Files

```
authentication_production/
├── server.ts          # Backend với CORS production config
├── index.html         # Frontend với BACKEND_URL tự động
├── callback.html      # Callback handler với BACKEND_URL tự động
├── .env.example       # Template cho environment variables
└── README.md          # File này
```

## 🚀 Cách Deploy

### Bước 1: Cấu hình Environment Variables

Tạo file `.env` hoặc set trong Azure App Service Configuration:

```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://tungha104.id.vn
MINDX_CLIENT_ID=mindx-onboarding
MINDX_CLIENT_SECRET=cHJldmVudGJvdW5kYmF0dHJlZWV4cGxvcmVjZWxsbmVydm91c3ZhcG9ydGhhbnN0ZWU=
```

### Bước 2: Đăng ký Redirect URI trong MindX

**QUAN TRỌNG:** Phải đăng ký Redirect URI mới:

```
https://tungha104.id.vn/callback.html
```

Liên hệ admin MindX để đăng ký.

### Bước 3: Cấu hình Load Balancer / Reverse Proxy

Đảm bảo Load Balancer route đúng:

```
Frontend (Static files):
  https://tungha104.id.vn/              → Serve index.html
  https://tungha104.id.vn/callback.html → Serve callback.html

Backend API:
  https://tungha104.id.vn/api/*         → Route đến backend server (port 3000)
```

### Bước 4: Deploy Backend

1. Upload `server.ts` lên Azure
2. Install dependencies: `npm install`
3. Set environment variables trong Azure Portal
4. Start server: `node server.ts` hoặc `tsx server.ts`

### Bước 5: Deploy Frontend

1. Upload `index.html` và `callback.html` lên web server
2. Đảm bảo cả 2 files có thể truy cập được:
   - `https://tungha104.id.vn/index.html`
   - `https://tungha104.id.vn/callback.html`

## ✅ Checklist trước khi deploy

- [ ] Đã tạo file `.env` với các biến môi trường
- [ ] Đã đăng ký Redirect URI `https://tungha104.id.vn/callback.html` trong MindX
- [ ] Đã cấu hình Load Balancer/Reverse Proxy route đúng
- [ ] Đã test backend API: `https://tungha104.id.vn/api/health`
- [ ] Đã test frontend: `https://tungha104.id.vn`
- [ ] Đã test callback: `https://tungha104.id.vn/callback.html`

## 🧪 Test sau khi deploy

### 1. Test Backend Health
```bash
curl https://tungha104.id.vn/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "issuer": "https://id-dev.mindx.edu.vn",
  "clientId": "mindx-onboarding",
  "environment": "production",
  "frontendUrl": "https://tungha104.id.vn"
}
```

### 2. Test Backend Config
```bash
curl https://tungha104.id.vn/api/config
```

### 3. Test Frontend
- Mở browser: `https://tungha104.id.vn`
- Click "Đăng nhập với MindX"
- Kiểm tra Browser Console (F12) xem có lỗi không

### 4. Test Callback
- Sau khi đăng nhập, kiểm tra xem có redirect về `callback.html` không
- Kiểm tra xem có nhận được user info không

## 🔍 Debug nếu có lỗi

### Lỗi CORS
- Kiểm tra CORS configuration trong `server.ts`
- Kiểm tra `FRONTEND_URL` trong `.env`
- Kiểm tra domain trong allowed origins

### Lỗi "Invalid redirect_uri"
- Kiểm tra đã đăng ký `https://tungha104.id.vn/callback.html` trong MindX chưa
- Kiểm tra redirect_uri trong Browser Console khi click "Đăng nhập"

### Lỗi "Cannot connect to backend"
- Kiểm tra Load Balancer có route `/api` đến backend không
- Kiểm tra backend có đang chạy không
- Kiểm tra firewall/security groups

## 📚 Best Practices

1. **Dùng HTTPS**: Luôn dùng HTTPS trong production
2. **Environment Variables**: Không hardcode credentials
3. **CORS**: Chỉ cho phép domain cần thiết
4. **Error Handling**: Log errors nhưng không expose thông tin nhạy cảm
5. **Rate Limiting**: Thêm rate limiting cho `/api/callback` và `/api/login` (recommended)

## 🔐 Security Notes

- ✅ CORS chỉ cho phép domain cụ thể
- ✅ CLIENT_SECRET được lưu trong environment variables
- ✅ Token được verify với JWKS
- ✅ Claims được verify (iss, aud, exp)
- ⚠️ Nên thêm rate limiting
- ⚠️ Nên thêm request logging/monitoring

