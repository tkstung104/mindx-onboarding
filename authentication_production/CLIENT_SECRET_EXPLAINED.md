# 🔐 Client Secret - Giải thích chi tiết

## ❓ Client Secret là gì?

**Client Secret** là một **mật khẩu bí mật** được cấp cùng với **Client ID** khi bạn đăng ký OAuth application với Identity Provider (MindX).

## 🎯 Mục đích của Client Secret

### 1. **Xác thực Backend với Identity Provider**

Client Secret được dùng để **chứng minh rằng request đến từ backend hợp lệ** của bạn, không phải từ attacker.

```
Backend → Gửi Client ID + Client Secret → MindX
        → MindX verify: "Đúng là backend của ứng dụng này"
        → MindX trả về token
```

### 2. **Bảo vệ Authorization Code**

Trong **Authorization Code flow**, Client Secret đóng vai trò quan trọng:

```
1. User đăng nhập → MindX trả về authorization code
2. Frontend nhận code (code này có thể bị lộ)
3. Frontend gửi code lên Backend
4. Backend gửi code + Client Secret lên MindX
5. MindX verify Client Secret → "Đúng là backend hợp lệ"
6. MindX trả về ID Token + Access Token
```

**Tại sao quan trọng?**
- Authorization code có thể bị lộ (trong URL, browser history, logs)
- Nhưng chỉ có backend mới có Client Secret
- → Attacker không thể đổi code lấy token (vì không có Client Secret)

## 🔄 So sánh các Flow

### Flow 1: Authorization Code (Bạn đang dùng) ✅

```
Frontend → Redirect đến MindX
         → User đăng nhập
         → MindX trả về code (có thể bị lộ)
         → Frontend gửi code lên Backend
         → Backend gửi code + Client Secret lên MindX
         → MindX verify Client Secret → Trả về token
```

**Cần Client Secret:** ✅ **CÓ** (để đổi code lấy token)

### Flow 2: ID Token Direct (Google Sign-In button)

```
Frontend → Google Sign-In button
         → Google trả về ID Token trực tiếp
         → Frontend gửi token lên Backend
         → Backend verify token với JWKS
```

**Cần Client Secret:** ❌ **KHÔNG** (vì không cần đổi code)

## 🔍 Client Secret trong code của bạn

### Trong `server.ts` - Endpoint `/api/callback`:

```typescript
// Backend đổi authorization code lấy token
const tokenParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,                    // Code từ frontend
    redirect_uri: redirect_uri,
    client_id: CLIENT_ID,          // Public - ai cũng biết
    client_secret: CLIENT_SECRET,   // SECRET - chỉ backend biết
});

const tokenResponse = await fetch(MINDX_TOKEN_ENDPOINT, {
    method: 'POST',
    body: tokenParams.toString()
});
```

**Client Secret được dùng ở đây để:**
1. Chứng minh request đến từ backend hợp lệ
2. MindX verify Client Secret trước khi trả về token
3. Nếu Client Secret sai → MindX từ chối request

## 🛡️ Security: Tại sao Client Secret quan trọng?

### Scenario 1: Không có Client Secret

```
1. Attacker lấy được authorization code (từ URL, logs)
2. Attacker gửi code lên backend của bạn
3. Backend đổi code lấy token (không cần verify gì)
4. → Attacker có token! ❌
```

### Scenario 2: Có Client Secret

```
1. Attacker lấy được authorization code
2. Attacker gửi code lên backend
3. Backend gửi code + Client Secret lên MindX
4. MindX verify Client Secret → "Đúng là backend hợp lệ"
5. → Attacker không thể làm gì vì không có Client Secret ✅
```

**Lưu ý:** Attacker vẫn có thể lấy code, nhưng không thể đổi code lấy token vì không có Client Secret.

## ⚠️ Best Practices với Client Secret

### 1. **KHÔNG BAO GIỜ expose Client Secret**

❌ **SAI:**
```javascript
// Frontend - KHÔNG BAO GIỜ làm thế này!
const CLIENT_SECRET = 'abc123...'; // ❌ Lộ ra browser!
```

✅ **ĐÚNG:**
```typescript
// Backend - Chỉ backend mới có
const CLIENT_SECRET = process.env.MINDX_CLIENT_SECRET; // ✅
```

### 2. **Lưu trong Environment Variables**

✅ **ĐÚNG:**
```env
# .env file (không commit lên Git)
MINDX_CLIENT_SECRET=cHJldmVudGJvdW5kYmF0dHJlZWV4cGxvcmVjZWxsbmVydm91c3ZhcG9ydGhhbnN0ZWU=
```

❌ **SAI:**
```typescript
// Hardcode trong code
const CLIENT_SECRET = 'cHJldmVudGJvdW5kYmF0dHJlZWV4cGxvcmVjZWxsbmVydm91c3ZhcG9ydGhhbnN0ZWU='; // ❌
```

### 3. **Không log Client Secret**

❌ **SAI:**
```typescript
console.log('Client Secret:', CLIENT_SECRET); // ❌ Lộ ra logs!
```

✅ **ĐÚNG:**
```typescript
console.log('Client ID:', CLIENT_ID); // ✅ OK
// Không log Client Secret
```

### 4. **Rotate Client Secret định kỳ**

- Nếu nghi ngờ Client Secret bị lộ → Đổi ngay
- Rotate định kỳ (mỗi 3-6 tháng) để tăng bảo mật

## 📊 So sánh Client ID vs Client Secret

| | **Client ID** | **Client Secret** |
|---|---|---|
| **Mục đích** | Identify ứng dụng | Authenticate backend |
| **Public?** | ✅ Public (ai cũng biết) | ❌ Secret (chỉ backend biết) |
| **Dùng ở đâu?** | Frontend + Backend | Chỉ Backend |
| **Có thể lộ?** | ✅ Có thể (không sao) | ❌ Không được lộ |
| **Ví dụ** | `mindx-onboarding` | `cHJldmVudGJvdW5k...` |

## 🔄 Flow hoạt động với Client Secret

### Bước 1: User đăng nhập
```
User → Click "Đăng nhập"
     → Redirect đến MindX
     → User đăng nhập
     → MindX trả về code: "abc123"
```

### Bước 2: Frontend nhận code
```
MindX → Redirect về: https://tungha104.id.vn/callback.html?code=abc123
      → Frontend nhận code
      → Frontend gửi code lên Backend
```

### Bước 3: Backend đổi code lấy token
```
Backend → POST https://id-dev.mindx.edu.vn/token
        → Body: {
             code: "abc123",
             client_id: "mindx-onboarding",
             client_secret: "cHJldmVudGJvdW5k..."  ← ĐÂY!
           }
        → MindX verify Client Secret
        → MindX trả về ID Token
```

**Nếu Client Secret sai:**
```
MindX → "Client Secret không đúng"
      → Trả về error 401
      → Không trả về token
```

## 💡 Tóm tắt

1. **Client Secret** = Mật khẩu bí mật của backend
2. **Mục đích**: Xác thực backend với Identity Provider
3. **Dùng khi**: Đổi authorization code lấy token
4. **Bảo mật**: 
   - Không bao giờ expose ra frontend
   - Lưu trong environment variables
   - Không log ra console
   - Rotate định kỳ

## 🎓 Kết luận

Client Secret là **chìa khóa bí mật** để backend chứng minh với MindX rằng:
- "Tôi là backend hợp lệ của ứng dụng này"
- "Tôi có quyền đổi authorization code lấy token"

**Không có Client Secret** → Backend không thể đổi code lấy token → Authentication flow sẽ fail.

