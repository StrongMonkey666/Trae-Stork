#!/bin/bash

# 交易平台部署脚本 - 服务器端
# 这个脚本在服务器上直接运行，不需要从外部上传

set -e

echo "=========================================="
echo "  私人股票交易策略平台 - 一键部署脚本"
echo "=========================================="
echo ""

# 创建项目目录
echo "1. 创建项目目录..."
mkdir -p ~/trading-platform
cd ~/trading-platform

# 检查是否已经有docker-compose.yml
if [ -f "docker-compose.yml" ]; then
    echo "⚠️  项目文件已存在，跳过创建"
else
    echo "2. 创建配置文件..."

    # 创建 docker-compose.yml
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: trading-mysql
    environment:
      MYSQL_ROOT_PASSWORD: trading_root_password
      MYSQL_DATABASE: trading_platform
      MYSQL_USER: trading_user
      MYSQL_PASSWORD: trading_password123
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - trading-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: trading-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - trading-network
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: trading-backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: mysql+pymysql://trading_user:trading_password123@mysql:3306/trading_platform
      REDIS_URL: redis://redis:6379
      SECRET_KEY: your-secret-key-change-this-in-production-please
      ALGORITHM: HS256
      ACCESS_TOKEN_EXPIRE_MINUTES: 1440
    depends_on:
      - mysql
      - redis
    networks:
      - trading-network
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: trading-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - trading-network
    restart: unless-stopped

volumes:
  mysql_data:
  redis_data:

networks:
  trading-network:
    driver: bridge
EOF

    # 创建后端 Dockerfile
    mkdir -p backend
    cat > backend/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF

    # 创建前端 Dockerfile
    mkdir -p frontend
    cat > frontend/Dockerfile << 'EOF'
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --registry=https://registry.npmmirror.com

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF

    mkdir -p frontend
    cat > frontend/nginx.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

    # 创建后端的requirements.txt
    mkdir -p backend
    cat > backend/requirements.txt << 'EOF'
fastapi==0.104.1
uvicorn==0.24.0.post1
sqlalchemy==2.0.23
pymysql==1.1.0
cryptography==41.0.7
passlib[bcrypt]==1.7.4
python-jose[cryptography]==3.3.0
python-multipart==0.0.6
pydantic==2.5.2
pydantic-settings==2.1.0
akshare==1.12.0
pandas==2.1.3
numpy==1.26.2
redis==5.0.1
httpx==0.25.2
EOF

    # 创建后端主应用
    mkdir -p backend/app
    cat > backend/app/main.py << 'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="私人股票交易策略平台")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "私人股票交易策略平台 API", "status": "running"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
EOF

    echo "✅ 配置文件创建成功！"
fi

# 检查是否安装 Docker
echo ""
echo "3. 检查 Docker..."
if ! command -v docker &> /dev/null; then
    echo "   正在安装 Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "   ✅ Docker 安装完成"
else
    echo "   ✅ Docker 已安装"
fi

# 检查 Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "   正在安装 Docker Compose..."
    sudo apt-get update && sudo apt-get install -y docker-compose
    echo "   ✅ Docker Compose 安装完成"
else
    echo "   ✅ Docker Compose 已安装"
fi

# 启动服务
echo ""
echo "4. 启动服务（这可能需要 5-10 分钟）..."
cd ~/trading-platform
sudo docker-compose up -d --build

# 等待服务启动
echo ""
echo "5. 等待服务启动中..."
sleep 30

echo ""
echo "=========================================="
echo "  🎉 部署完成！"
echo "=========================================="
echo ""
echo "访问地址: http://$(hostname -I | awk '{print $1}')"
echo ""
echo "测试账号:"
echo "  邮箱: test@example.com"
echo "  密码: test123"
echo ""
echo "查看日志: sudo docker-compose logs -f"
echo ""
