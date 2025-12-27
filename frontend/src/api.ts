import axios from 'axios';

// Khởi tạo một instance (thực thể) của Axios
const api = axios.create({
  // Sử dụng relative path để hoạt động với Ingress trên AKS
  // Frontend sẽ gọi API qua cùng domain, Ingress sẽ route /api tới API service
  baseURL: '/api',
});

// Sử dụng Interceptor để can thiệp vào trước khi yêu cầu được gửi đi
api.interceptors.request.use((config) => {
  // Lấy "tấm thẻ thông hành" (Token) từ bộ nhớ trình duyệt
  const token = localStorage.getItem('token'); 
  
  if (token) {
    // Tự động dán Token vào Header Authorization theo đúng định dạng Bearer
    // Đây chính là bước bạn đã làm thủ công trong Headers lúc nãy!
    config.headers.Authorization = `Bearer ${token}`; 
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;