# 階段一：建置前端靜態檔案
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 階段二：使用 Nginx 提供高效能的靜態網頁服務
FROM nginx:alpine
# 將建置好的檔案複製到 Nginx 的預設公開資料夾 (注意：如果是 Vite 可能是 dist，Create React App 可能是 build)
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]