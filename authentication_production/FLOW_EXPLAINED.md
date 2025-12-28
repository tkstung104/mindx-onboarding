# 🔄 Luồng hoạt động chi tiết - Authentication Production

## ❓ Tại sao có 2 file HTML?

### **index.html** - Trang chính (Login Page)
- Hiển thị nút "Đăng nhập với MindX"
- Xử lý khi user click đăng nhập
- Redirect user đến MindX login page
- Hiển thị thông tin user sau khi đăng nhập thành công

### **callback.html** - Trang xử lý callback
- Nhận authorization code từ MindX (qua URL: `?code=...`)
- Gửi code lên backend để đổi lấy token
- Xử lý kết quả và redirect về `index.html`

**Tại sao cần 2 file?**
- MindX redirect về URL của bạn sau khi đăng nhập
- URL đó phải là một trang riêng để xử lý callback
- Không thể xử lý callback trong cùng trang login (vì đã bị redirect đi)

## 🔄 Luồng hoạt động chi tiết (Step by Step)

### **Bước 1: User mở trang chính**

```
User → Mở browser: https://tungha104.id.vn
     → Load index.html
```

**File:** `index.html`

**Code thực thi:**
```javascript
// Khởi tạo
init();  // Load OpenID config từ backend
checkLoggedInUser();  // Kiểm tra đã đăng nhập chưa
```

**Kết quả:**
- Hiển thị nút "🔑 Đăng nhập với MindX"
- Nếu đã đăng nhập → Hiển thị user info

---

### **Bước 2: User click "Đăng nhập"**

```
User → Click button "Đăng nhập với MindX"
     → Frontend tạo authorization URL
     → Redirect đến MindX
```

**File:** `index.html` - Function `handleLogin()`

**Code thực thi:**
```javascript
// 1. Tạo PKCE (bảo mật)
const state = generateRandomString(32);
const codeVerifier = generateRandomString(128);
const codeChallenge = await sha256(codeVerifier);

// 2. Lưu vào sessionStorage
sessionStorage.setItem('oauth_state', state);
sessionStorage.setItem('oauth_code_verifier', codeVerifier);

// 3. Tạo authorization URL
const authUrl = `https://id-dev.mindx.edu.vn/auth?
    client_id=mindx-onboarding&
    redirect_uri=https://tungha104.id.vn/callback.html&  ← Quan trọng!
    response_type=code&
    scope=openid profile email&
    state=${state}&
    code_challenge=${codeChallenge}&
    code_challenge_method=S256`;

// 4. Redirect đến MindX
window.location.href = authUrl;
```

**Kết quả:**
- User bị redirect đến: `https://id-dev.mindx.edu.vn/auth?...`
- Browser rời khỏi `index.html` → Đến MindX login page

---

### **Bước 3: User đăng nhập trên MindX**

```
User → Đang ở MindX login page
     → Nhập username/password
     → Click "Đăng nhập"
     → MindX xác thực thành công
```

**File:** Không phải file của bạn (MindX xử lý)

**Kết quả:**
- MindX xác thực user thành công
- MindX tạo authorization code
- MindX chuẩn bị redirect về callback URL

---

### **Bước 4: MindX redirect về callback.html**

```
MindX → Redirect về: https://tungha104.id.vn/callback.html?code=abc123&state=xyz
      → Browser load callback.html
```

**File:** `callback.html` - Tự động chạy khi page load

**URL sau redirect:**
```
https://tungha104.id.vn/callback.html?code=abc123&state=xyz789
```

**Code thực thi:**
```javascript
// Tự động chạy khi page load
handleCallback();

// 1. Đọc code từ URL
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');  // "abc123"
const state = urlParams.get('state'); // "xyz789"

// 2. Verify state (chống CSRF)
const savedState = sessionStorage.getItem('oauth_state');
if (state !== savedState) {
    // State không khớp → Có thể bị tấn công
    showError('State không khớp');
    return;
}

// 3. Gửi code lên backend
fetch('https://tungha104.id.vn/api/callback', {
    method: 'POST',
    body: JSON.stringify({
        code: code,
        redirect_uri: 'https://tungha104.id.vn/callback.html',
        code_verifier: sessionStorage.getItem('oauth_code_verifier')
    })
});
```

**Tại sao cần file riêng?**
- MindX redirect về URL cụ thể (`callback.html`)
- URL này phải là một trang thực sự (không thể là function trong `index.html`)
- Browser load `callback.html` → Code tự động chạy

---

### **Bước 5: Backend đổi code lấy token**

```
Backend → Nhận code từ frontend
        → Gửi code + Client Secret lên MindX token endpoint
        → MindX verify và trả về ID Token
        → Backend verify ID Token với JWKS
```

**File:** `server.ts` - Endpoint `/api/callback`

**Code thực thi:**
```typescript
app.post('/api/callback', async (req, res) => {
    const { code, redirect_uri, code_verifier } = req.body;

    // 1. Đổi code lấy token từ MindX
    const tokenResponse = await fetch('https://id-dev.mindx.edu.vn/token', {
        method: 'POST',
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirect_uri,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,  // ← Quan trọng!
            code_verifier: code_verifier
        })
    });

    // 2. Nhận ID Token từ MindX
    const { id_token } = await tokenResponse.json();

    // 3. Verify token với JWKS
    const payload = await verifyMindXIdToken(id_token);

    // 4. Trả về user info cho frontend
    res.json({
        success: true,
        user: { id: payload.sub, name: payload.name, ... },
        idToken: id_token
    });
});
```

**Kết quả:**
- Backend trả về user info + ID Token
- Frontend (`callback.html`) nhận được response

---

### **Bước 6: Callback.html xử lý kết quả**

```
callback.html → Nhận user info từ backend
              → Lưu vào sessionStorage
              → Redirect về index.html
```

**File:** `callback.html` - Function `handleCallback()`

**Code thực thi:**
```javascript
// Nhận response từ backend
const result = await response.json();

if (result.success) {
    // 1. Lưu user info vào sessionStorage
    sessionStorage.setItem('user', JSON.stringify(result.user));
    sessionStorage.setItem('idToken', result.idToken);

    // 2. Xóa state và code_verifier (không cần nữa)
    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('oauth_code_verifier');

    // 3. Redirect về trang chính
    window.location.href = 'index.html';
}
```

**Kết quả:**
- User info được lưu vào sessionStorage
- Browser redirect về `index.html`

---

### **Bước 7: Index.html hiển thị user info**

```
index.html → Load lại
          → Kiểm tra sessionStorage
          → Hiển thị user info
```

**File:** `index.html` - Function `checkLoggedInUser()`

**Code thực thi:**
```javascript
// Tự động chạy khi page load
checkLoggedInUser();

function checkLoggedInUser() {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        const idToken = sessionStorage.getItem('idToken');
        
        // Hiển thị user info
        displayUserInfo(user, idToken);
        // Ẩn login button, hiển thị user info
    }
}
```

**Kết quả:**
- Hiển thị thông tin user
- Ẩn nút "Đăng nhập"
- Hiển thị nút "Đăng xuất"

---

## 📊 Sơ đồ luồng hoạt động

```
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 1: User mở index.html                                 │
│ → Hiển thị nút "Đăng nhập với MindX"                       │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 2: User click "Đăng nhập"                             │
│ → Tạo authorization URL với redirect_uri=callback.html      │
│ → Redirect đến MindX: https://id-dev.mindx.edu.vn/auth    │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 3: User đăng nhập trên MindX                          │
│ → MindX xác thực thành công                                 │
│ → MindX tạo authorization code                             │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 4: MindX redirect về callback.html                     │
│ → URL: callback.html?code=abc123&state=xyz                  │
│ → Browser load callback.html                                │
│ → Code tự động chạy handleCallback()                        │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 5: callback.html gửi code lên backend                │
│ → POST /api/callback { code, redirect_uri, code_verifier } │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 6: Backend đổi code lấy token                         │
│ → POST MindX token endpoint với Client Secret              │
│ → MindX trả về ID Token                                     │
│ → Backend verify token với JWKS                             │
│ → Backend trả về user info                                  │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 7: callback.html nhận user info                       │
│ → Lưu vào sessionStorage                                    │
│ → Redirect về index.html                                    │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 8: index.html load lại                                 │
│ → checkLoggedInUser() tìm thấy user trong sessionStorage   │
│ → Hiển thị user info                                        │
│ → Ẩn login button, hiển thị logout button                  │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Tại sao cần 2 file HTML?

### **Lý do 1: MindX redirect về URL cụ thể**

Khi bạn tạo authorization URL:
```javascript
redirect_uri: 'https://tungha104.id.vn/callback.html'
```

MindX sẽ redirect về đúng URL này:
```
https://tungha104.id.vn/callback.html?code=abc123&state=xyz
```

→ **Phải có file `callback.html`** để nhận redirect này!

### **Lý do 2: Không thể xử lý callback trong index.html**

Nếu bạn chỉ có `index.html`:

```javascript
// index.html
function handleLogin() {
    window.location.href = 'https://id-dev.mindx.edu.vn/auth?...';
    // Browser rời khỏi index.html → Đến MindX
}

// Khi MindX redirect về index.html?code=...
// → index.html load lại từ đầu
// → Không biết đây là callback hay lần đầu mở trang
// → Khó xử lý!
```

Với 2 file:
```javascript
// index.html - Chỉ xử lý login
function handleLogin() {
    window.location.href = '...';
}

// callback.html - Chỉ xử lý callback
function handleCallback() {
    const code = urlParams.get('code');
    // Xử lý code
}
```

→ **Rõ ràng, dễ quản lý!**

### **Lý do 3: Separation of Concerns**

- **index.html**: Trang chính, hiển thị UI, xử lý login
- **callback.html**: Trang xử lý callback, không cần UI phức tạp

→ **Code sạch hơn, dễ maintain!**

## 🔍 Chi tiết từng file

### **index.html - Chức năng**

1. **Hiển thị UI:**
   - Nút "Đăng nhập với MindX"
   - User info (sau khi đăng nhập)
   - Nút "Đăng xuất"

2. **Xử lý login:**
   - Tạo authorization URL
   - Redirect đến MindX

3. **Kiểm tra đăng nhập:**
   - Load user info từ sessionStorage
   - Hiển thị nếu đã đăng nhập

### **callback.html - Chức năng**

1. **Nhận callback từ MindX:**
   - Đọc `code` từ URL query params
   - Verify `state` (chống CSRF)

2. **Gửi code lên backend:**
   - POST `/api/callback` với code
   - Nhận user info từ backend

3. **Lưu và redirect:**
   - Lưu user info vào sessionStorage
   - Redirect về `index.html`

## 💡 Tại sao không dùng 1 file?

### **Option 1: Chỉ dùng index.html (Không khuyến khích)**

```javascript
// index.html
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

if (code) {
    // Xử lý callback
    handleCallback(code);
} else {
    // Hiển thị login button
    showLoginButton();
}
```

**Vấn đề:**
- ❌ Code phức tạp hơn (phải check code mỗi lần load)
- ❌ Khó debug (không biết đang ở mode nào)
- ❌ URL có query params (`?code=...`) không đẹp
- ❌ Khó refresh trang (query params vẫn còn)

### **Option 2: Dùng 2 file (Khuyến khích) ✅**

```javascript
// index.html - Chỉ login
function handleLogin() { ... }

// callback.html - Chỉ callback
function handleCallback() { ... }
```

**Ưu điểm:**
- ✅ Code rõ ràng, dễ hiểu
- ✅ Separation of concerns
- ✅ Dễ debug (biết rõ đang ở file nào)
- ✅ URL sạch (không có query params ở index.html)

## 📝 Tóm tắt

**2 file HTML vì:**

1. **MindX redirect về URL cụ thể** → Cần `callback.html` để nhận
2. **Separation of concerns** → Mỗi file một nhiệm vụ
3. **Code sạch hơn** → Dễ maintain và debug

**Luồng hoạt động:**

1. `index.html` → User click login → Redirect đến MindX
2. MindX → User đăng nhập → Redirect về `callback.html?code=...`
3. `callback.html` → Nhận code → Gửi lên backend → Lưu user info → Redirect về `index.html`
4. `index.html` → Load lại → Hiển thị user info

**Tất cả đều vì Authorization Code Flow yêu cầu redirect!**

