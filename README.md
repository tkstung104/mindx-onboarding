# MindX Onboarding - Week 1 Project

Full-stack application với React frontend và Node.js/Express API, được thiết kế để deploy lên Azure Cloud với Kubernetes.

## 📋 Mô tả

Ứng dụng web full-stack bao gồm:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Authentication**: JWT-based authentication
- **Deployment**: Docker containers trên Azure Kubernetes Service (AKS)

## 🛠️ Tech Stack

### Frontend
- React 19.2.0
- TypeScript 5.9.3
- Vite 7.2.4
- Axios 1.13.2

### Backend
- Node.js 20
- Express 5.2.1
- TypeScript 5.9.3
- JSON Web Token (JWT) 9.0.3
- CORS 2.8.5

### DevOps
- Docker (Multi-stage builds)
- Kubernetes
- Azure Cloud

## 🚀 Cài đặt và Chạy Local

### Prerequisites
- Node.js 20+ 
- npm hoặc yarn
- Docker (tùy chọn)

### Backend API

```bash
# Di chuyển vào thư mục API
cd api

# Cài đặt dependencies
npm install

# Chạy development server (với hot reload)
npm run dev

# Build TypeScript
npm run build

# Chạy production
npm start
```

API sẽ chạy tại: `http://localhost:3000`

### Frontend

```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build production
npm run build

# Preview production build
npm run preview
```

Frontend sẽ chạy tại: `http://localhost:5173`

## 🐳 Docker

### Build và chạy với Docker

#### Backend
```bash
cd api
docker build -t mindx-api .
docker run -p 3000:3000 mindx-api
```

#### Frontend
```bash
cd frontend
docker build -t mindx-frontend .
docker run -p 5173:5173 mindx-frontend
```

### Full-stack sử dụng Docker Compose

Chạy cả backend và frontend cùng lúc với Docker Compose:

```bash
# Từ thư mục root của project
docker-compose up --build

# Hoặc chạy ở background
docker-compose up -d --build

# Xem logs
docker-compose logs -f

# Dừng services
docker-compose down

# Dừng và xóa volumes
docker-compose down -v
```

Sau khi chạy:
- **Backend API**: `http://localhost:3000`
- **Frontend**: `http://localhost:8080`

#### Environment Variables cho Docker Compose

Tạo file `.env` ở root project (nếu chưa có):
```env
JWT_SECRET=mindx_secret_key_2025
NODE_ENV=production
```

## 📁 Cấu trúc Project

```
mindx-onboarding/
├── api/                    # Backend API
│   ├── src/
│   │   └── server.ts       # Express server
│   ├── Dockerfile          # Multi-stage Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── App.tsx         # Main component
│   │   ├── api.ts          # API client
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
│
├── k8s/                    # Kubernetes manifests
│   ├── api/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── secret.yaml
│   └── frontend/
│       ├── deployment.yaml
│       └── service.yaml
│
├── .gitignore
├── README.md
└── architecture.md
```

## 🔐 Authentication

Ứng dụng sử dụng JWT (JSON Web Token) cho authentication:

1. **Đăng ký**: `POST /api/register`
   ```json
   {
     "username": "user123",
     "password": "password123"
   }
   ```

2. **Đăng nhập**: `POST /api/login`
   ```json
   {
     "username": "user123",
     "password": "password123"
   }
   ```
   Response trả về `accessToken` để sử dụng cho các request sau.

3. **Protected Routes**: 
   - `GET /api/user/profile` - Yêu cầu header: `Authorization: Bearer <token>`

## 🌐 API Endpoints

### Public Endpoints
- `GET /health` - Health check
- `POST /api/register` - Đăng ký user mới
- `POST /api/login` - Đăng nhập và nhận token

### Protected Endpoints (Yêu cầu JWT token)
- `GET /api/user/profile` - Lấy thông tin user hiện tại

## ☁️ Deployment

### Azure Kubernetes Service (AKS)

1. **Build và push Docker images lên Azure Container Registry (ACR)**
   ```bash
   # Login vào ACR
   az acr login --name <registry-name>
   
   # Build và push API
   cd api
   docker build -t <registry-name>.azurecr.io/api:latest .
   docker push <registry-name>.azurecr.io/api:latest
   
   # Build và push Frontend
   cd ../frontend
   docker build -t <registry-name>.azurecr.io/frontend:latest .
   docker push <registry-name>.azurecr.io/frontend:latest
   ```

2. **Deploy lên Kubernetes**
   ```bash
   # Apply Kubernetes manifests
   kubectl apply -f k8s/api/
   kubectl apply -f k8s/frontend/
   ```

3. **Kiểm tra deployment**
   ```bash
   kubectl get pods
   kubectl get services
   ```

Chi tiết về architecture và deployment xem file `architecture.md` và `tasks.md`.

## 🔧 Environment Variables

### Backend
Tạo file `.env` trong thư mục `api/`:
```
JWT_SECRET=your-secret-key-here
PORT=3000
NODE_ENV=production
```

### Frontend
Tạo file `.env` trong thư mục `frontend/` (nếu cần):
```
VITE_API_URL=http://localhost:3000
```

## 📝 Scripts

### Backend
- `npm run dev` - Chạy development server với hot reload
- `npm run build` - Build TypeScript sang JavaScript
- `npm start` - Chạy production server

### Frontend
- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm run preview` - Preview production build
- `npm run lint` - Chạy ESLint

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

ISC

## 👥 Authors

MindX Engineering Team

## 🙏 Acknowledgments

- MindX for the onboarding program
- Azure Cloud Platform
- React and Express communities

