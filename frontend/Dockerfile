# --- GIAI ĐOẠN 1: Build stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json và cài đặt thư viện
COPY package*.json ./
RUN npm install

# Copy code và build ứng dụng React
COPY . .
RUN npm run build

# --- GIAI ĐOẠN 2: Production stage (Dùng Nginx để chạy file tĩnh) ---
FROM nginx:stable-alpine

# Copy các file đã build từ Giai đoạn 1 vào thư mục mặc định của Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Cấu hình Nginx để phục vụ Single Page Application (SPA)
# (Tạo một file config nhỏ để xử lý React Router nếu cần)
RUN echo "server { \
    listen 8080; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files \$uri \$uri/ /index.html; \
    } \
}" > /etc/nginx/conf.d/default.conf

# Mở cổng 8080 theo đúng sơ đồ kiến trúc
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]