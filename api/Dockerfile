# --- GIAI ĐOẠN 1: Build stage (Sử dụng Node.js đầy đủ để biên dịch TS) ---
FROM node:20-alpine AS builder

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Copy các file quản lý thư viện trước để tận dụng cache của Docker
COPY package*.json ./

# Cài đặt tất cả dependencies (bao gồm cả các công cụ biên dịch TS)
RUN npm install

# Copy toàn bộ mã nguồn vào container
COPY . .

# Biên dịch TypeScript sang JavaScript (lệnh này chạy script "build" trong package.json)
RUN npm run build


# --- GIAI ĐOẠN 2: Production stage (Chỉ giữ lại những gì cần thiết để chạy) ---
FROM node:20-alpine

WORKDIR /app

# Thiết lập biến môi trường mặc định là production
ENV NODE_ENV=production

# Chỉ copy file package.json để cài đặt thư viện chạy thực tế (bỏ qua devDependencies)
COPY package*.json ./
RUN npm install --omit=dev

# Copy file đã được biên dịch từ Giai đoạn 1 sang
COPY --from=builder /app/dist ./dist

# Mở cổng 3000 theo đúng sơ đồ kiến trúc
EXPOSE 3000

# Lệnh khởi chạy API
CMD ["node", "dist/server.js"]