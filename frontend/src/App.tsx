import { useState, useEffect } from 'react';
import api from './api';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); // Thêm state password
  const [isRegisterMode, setIsRegisterMode] = useState(false); // Mode chuyển đổi UI
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  // Xử lý Đăng ký
  const handleRegister = async () => {
    try {
      await api.post('/register', { username, password });
      alert("Đăng ký thành công! Hãy đăng nhập ngay.");
      setIsRegisterMode(false); // Chuyển về màn hình login
    } catch (error: any) {
      alert(error.response?.data?.message || "Lỗi đăng ký");
    }
  };

  // Xử lý Đăng nhập
  const handleLogin = async () => {
    try {
      const response = await api.post('/login', { username, password });
      localStorage.setItem('token', response.data.accessToken);
      setIsLoggedIn(true);
      alert("Đăng nhập thành công!");
    } catch (error: any) {
      alert(error.response?.data?.message || "Lỗi đăng nhập");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
  };

  useEffect(() => {
    if (isLoggedIn) {
      api.get('/user/profile')
        .then(res => setUser(res.data.user))
        .catch(() => handleLogout());
    }
  }, [isLoggedIn]);

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial', maxWidth: '400px', margin: '0 auto' }}>
      <h1>MindX Week 1</h1>
      <hr />

      {!isLoggedIn ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3>{isRegisterMode ? 'Đăng ký tài khoản' : 'Đăng nhập'}</h3>
          <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          
          {isRegisterMode ? (
            <button onClick={handleRegister}>Đăng ký ngay</button>
          ) : (
            <button onClick={handleLogin}>Đăng nhập</button>
          )}

          <p 
            onClick={() => setIsRegisterMode(!isRegisterMode)} 
            style={{ cursor: 'pointer', color: 'blue', fontSize: '14px', textAlign: 'center' }}
          >
            {isRegisterMode ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
          </p>
        </div>
      ) : (
        <div style={{ border: '1px solid #007bff', padding: '20px', borderRadius: '8px' }}>
          <h2> Thông tin người dùng</h2>
          {user ? (
            <div>
              <p>User name: <strong>{user.username}</strong> (ID: {user.id})</p>
              {user.email && <p>Email: <strong>{user.email}</strong></p>}
              {user.phone && <p>Số điện thoại: <strong>{user.phone}</strong></p>}
            </div>
          ) : (
            <p>Loading...</p>
          )}
          <button onClick={handleLogout} style={{ color: 'red' }}>Đăng xuất</button>
        </div>
      )}
    </div>
  );
}

export default App;