# 📊 Sơ đồ luồng hoạt động - Trực quan

## 🔄 Luồng hoạt động từng bước

### **Bước 1: User mở trang chính**

```
┌─────────────────────────────────────┐
│  Browser: tungha104.id.vn          │
│  ┌───────────────────────────────┐ │
│  │  index.html                    │ │
│  │                                │ │
│  │  🔐 MindX OpenID Connect       │ │
│  │                                │ │
│  │  [🔑 Đăng nhập với MindX]      │ │
│  │                                │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

**File:** `index.html`  
**Hành động:** Hiển thị nút đăng nhập

---

### **Bước 2: User click "Đăng nhập"**

```
┌─────────────────────────────────────┐
│  index.html                         │
│  ┌───────────────────────────────┐ │
│  │  handleLogin()                │ │
│  │  1. Tạo PKCE                   │ │
│  │  2. Tạo authorization URL      │ │
│  │  3. Redirect đến MindX         │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
              ↓
    window.location.href = 
    "https://id-dev.mindx.edu.vn/auth?
     redirect_uri=https://tungha104.id.vn/callback.html&
     response_type=code&..."
```

**File:** `index.html`  
**Hành động:** Redirect đến MindX

---

### **Bước 3: User đăng nhập trên MindX**

```
┌─────────────────────────────────────┐
│  Browser: id-dev.mindx.edu.vn      │
│  ┌───────────────────────────────┐ │
│  │  MindX Login Page             │ │
│  │                                │ │
│  │  Username: [________]          │ │
│  │  Password: [________]         │ │
│  │                                │ │
│  │  [Đăng nhập]                   │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
              ↓
    MindX xác thực thành công
    Tạo authorization code: "abc123"
```

**File:** Không phải file của bạn (MindX xử lý)

---

### **Bước 4: MindX redirect về callback.html**

```
┌─────────────────────────────────────┐
│  Browser: tungha104.id.vn          │
│  ┌───────────────────────────────┐ │
│  │  callback.html?code=abc123    │ │
│  │  &state=xyz789                │ │
│  │                                │ │
│  │  ⏳ Đang xử lý...              │ │
│  │                                │ │
│  │  [Spinner loading]             │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

**File:** `callback.html`  
**Hành động:** Tự động chạy `handleCallback()` khi page load

**Tại sao cần file riêng?**
- MindX redirect về URL: `callback.html?code=...`
- Browser phải load một file HTML thực sự
- → Phải có `callback.html` để nhận redirect này!

---

### **Bước 5: Callback.html gửi code lên backend**

```
┌─────────────────────────────────────┐
│  callback.html                      │
│  ┌───────────────────────────────┐ │
│  │  handleCallback()             │ │
│  │  1. Đọc code từ URL           │ │
│  │  2. Verify state               │ │
│  │  3. Gửi code lên backend      │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
              ↓
    POST https://tungha104.id.vn/api/callback
    Body: {
      code: "abc123",
      redirect_uri: "https://tungha104.id.vn/callback.html",
      code_verifier: "..."
    }
```

**File:** `callback.html`  
**Hành động:** Gửi code lên backend

---

### **Bước 6: Backend đổi code lấy token**

```
┌─────────────────────────────────────┐
│  Backend (server.ts)               │
│  ┌───────────────────────────────┐ │
│  │  POST /api/callback           │ │
│  │  1. Nhận code từ frontend     │ │
│  │  2. Gửi code + Client Secret  │ │
│  │     lên MindX token endpoint  │ │
│  │  3. Nhận ID Token từ MindX   │ │
│  │  4. Verify token với JWKS    │ │
│  │  5. Trả về user info          │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
              ↓
    POST https://id-dev.mindx.edu.vn/token
    Body: {
      grant_type: "authorization_code",
      code: "abc123",
      client_id: "mindx-onboarding",
      client_secret: "..."  ← Quan trọng!
    }
              ↓
    MindX trả về: { id_token: "eyJhbGci..." }
```

**File:** `server.ts`  
**Hành động:** Đổi code lấy token

---

### **Bước 7: Callback.html nhận kết quả**

```
┌─────────────────────────────────────┐
│  callback.html                      │
│  ┌───────────────────────────────┐ │
│  │  Nhận response từ backend     │ │
│  │  {                            │ │
│  │    success: true,             │ │
│  │    user: { id, name, email }, │ │
│  │    idToken: "eyJhbGci..."     │ │
│  │  }                            │ │
│  │                                │ │
│  │  1. Lưu vào sessionStorage    │ │
│  │  2. Redirect về index.html    │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
              ↓
    sessionStorage.setItem('user', ...)
    sessionStorage.setItem('idToken', ...)
              ↓
    window.location.href = 'index.html'
```

**File:** `callback.html`  
**Hành động:** Lưu user info và redirect

---

### **Bước 8: Index.html hiển thị user info**

```
┌─────────────────────────────────────┐
│  Browser: tungha104.id.vn          │
│  ┌───────────────────────────────┐ │
│  │  index.html                    │ │
│  │                                │ │
│  │  🔐 MindX OpenID Connect       │ │
│  │                                │ │
│  │  👤 John Doe                   │ │
│  │  📧 john@example.com           │ │
│  │  🆔 user-123                   │ │
│  │                                │ │
│  │  [Đăng xuất]                   │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

**File:** `index.html`  
**Hành động:** Hiển thị user info từ sessionStorage

---

## 🎯 Tại sao cần 2 file HTML? (Giải thích đơn giản)

### **Vấn đề: MindX redirect về URL cụ thể**

Khi bạn tạo authorization URL:
```javascript
redirect_uri: 'https://tungha104.id.vn/callback.html'
```

MindX sẽ redirect về đúng URL này:
```
https://tungha104.id.vn/callback.html?code=abc123
```

**→ Phải có file `callback.html` để nhận redirect này!**

### **Nếu chỉ có 1 file (index.html):**

**Vấn đề 1: Không biết đây là callback hay lần đầu mở**
```javascript
// index.html
// Lần đầu mở: https://tungha104.id.vn
// Callback: https://tungha104.id.vn?code=abc123

// Phải check mỗi lần load
const code = urlParams.get('code');
if (code) {
    // Xử lý callback
} else {
    // Hiển thị login
}
```

**Vấn đề 2: URL không đẹp**
```
https://tungha104.id.vn?code=abc123&state=xyz
// Query params vẫn còn trong URL
```

**Vấn đề 3: Khó refresh**
```
User refresh trang → Query params vẫn còn
→ Code chạy lại handleCallback()
→ Có thể gây lỗi
```

### **Với 2 file (index.html + callback.html):**

**Ưu điểm 1: Rõ ràng**
```
index.html → Chỉ xử lý login
callback.html → Chỉ xử lý callback
```

**Ưu điểm 2: URL sạch**
```
index.html → https://tungha104.id.vn (không có query params)
callback.html → https://tungha104.id.vn/callback.html?code=...
                → Sau khi xử lý xong, redirect về index.html
                → URL sạch lại
```

**Ưu điểm 3: Dễ debug**
```
Biết rõ đang ở file nào
→ Dễ debug và maintain
```

## 📋 Checklist: Khi nào cần file nào?

### **index.html cần khi:**
- [ ] User mở trang chính
- [ ] User click "Đăng nhập"
- [ ] Hiển thị user info sau khi đăng nhập
- [ ] User click "Đăng xuất"

### **callback.html cần khi:**
- [ ] MindX redirect về sau khi đăng nhập
- [ ] Nhận authorization code từ URL
- [ ] Gửi code lên backend
- [ ] Lưu user info và redirect về index.html

## 💡 Tóm tắt

**2 file HTML vì:**

1. **MindX redirect về URL cụ thể** (`callback.html`)
   - → Phải có file để nhận redirect

2. **Separation of concerns**
   - `index.html` = Login page
   - `callback.html` = Callback handler

3. **Code sạch hơn**
   - Mỗi file một nhiệm vụ
   - Dễ debug và maintain

**Luồng:**
```
index.html → Click login → Redirect đến MindX
         ↓
MindX → User đăng nhập → Redirect về callback.html?code=...
         ↓
callback.html → Nhận code → Gửi backend → Lưu user → Redirect về index.html
         ↓
index.html → Hiển thị user info
```

**Tất cả đều vì Authorization Code Flow yêu cầu redirect!**

