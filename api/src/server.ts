import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET as string;

// --- DATABASE ẢO (Sẽ mất khi restart server) ---
const users: any[] = []; 

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 1. Endpoint Đăng ký (Mới)
app.post('/api/register', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập đủ username và password' });
  }

  // Kiểm tra xem username đã tồn tại chưa
  const userExists = users.find(u => u.username === username);
  if (userExists) {
    return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại!' });
  }

  // Lưu user mới vào mảng
  const newUser = { id: Date.now().toString(), username, password };
  users.push(newUser);

  res.status(201).json({ message: 'Đăng ký thành công!' });
});

// 2. Endpoint Đăng nhập (Cập nhật để kiểm tra password)
app.post('/api/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  // Tìm user trong mảng
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu!' });
  }

  // Tạo token chứa thông tin user (trừ password để bảo mật)
  const accessToken = jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      email: '123@mindx.com', 
      phone: '0989111222' 
    }, 
    JWT_SECRET, 
    { expiresIn: '1h' }
  );

  res.json({
    message: 'Login successful',
    accessToken,
    user: { id: user.id, 
        username: user.username, 
        email: '123@mindx.com', 
        phone: '0989111222',
        address: '123 Nguyen Van Linh, Q9, TP.HCM'
    }
  });
});

// 3. Middleware & Protected Route (Giữ nguyên logic cũ)
const authenticateToken = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Missing token' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: 'Token không hợp lệ' });
    req.user = user;
    next();
  });
};

app.get('/api/user/profile', authenticateToken, (req: any, res: Response) => {
  res.json({ user: req.user });
});

app.listen(PORT, () => console.log(`Server chạy tại http://localhost:${PORT}`));