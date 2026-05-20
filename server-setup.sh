#!/bin/bash

# 私人交易策略平台 - 一键部署脚本
# 适用于 Ubuntu/Debian 系统

set -e

echo "=========================================="
echo "  私人交易策略平台 - 自动化部署脚本"
echo "=========================================="
echo ""

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
  echo "请使用 sudo 运行此脚本"
  exit 1
fi

# 1. 安装 Docker 和 Docker Compose
echo "[1/6] 安装 Docker 和 Docker Compose..."
apt-get update
apt-get install -y docker.io docker-compose

# 启动Docker服务
systemctl start docker
systemctl enable docker

echo "✓ Docker 安装完成"

# 2. 创建网络
echo "[2/6] 创建 Docker 网络..."
docker network create app-network 2>/dev/null || true
echo "✓ 网络创建完成"

# 3. 启动 MySQL
echo "[3/6] 启动 MySQL 数据库..."
docker rm -f trading-db 2>/dev/null || true
docker run -d \
  --name trading-db \
  --network app-network \
  -e MYSQL_ROOT_PASSWORD=root_password \
  -e MYSQL_DATABASE=trading_platform \
  -e MYSQL_USER=trading_user \
  -e MYSQL_PASSWORD=trading_password123 \
  -p 3306:3306 \
  -v $(pwd)/mysql_data:/var/lib/mysql \
  mysql:8.0

echo "✓ MySQL 启动中（等待30秒）..."
sleep 30

# 4. 初始化数据库
echo "[4/6] 初始化数据库..."
if [ -f "backend/migrations/001_init.sql" ]; then
  docker exec -i trading-db mysql -uroot -proot_password trading_platform < backend/migrations/001_init.sql
  echo "✓ 数据库初始化完成"
else
  echo "⚠ 警告：未找到数据库初始化脚本"
fi

# 5. 启动 Redis
echo "[5/6] 启动 Redis..."
docker rm -f trading-cache 2>/dev/null || true
docker run -d \
  --name trading-cache \
  --network app-network \
  redis:7-alpine

echo "✓ Redis 启动完成"

# 6. 启动应用
echo "[6/6] 启动前后端服务..."

# 构建并启动后端
echo "  - 构建后端镜像..."
docker build -t trading-backend ./backend

docker rm -f trading-backend 2>/dev/null || true
docker run -d \
  --name trading-backend \
  --network app-network \
  -p 8000:8000 \
  -e DATABASE_URL=mysql+pymysql://trading_user:trading_password123@trading-db:3306/trading_platform \
  -e REDIS_URL=redis://trading-cache:6379/0 \
  -e SECRET_KEY=trading-platform-secret-key-2024 \
  -e CORS_ORIGINS=http://43.139.27.137,http://localhost \
  trading-backend

# 构建并启动前端
echo "  - 构建前端镜像..."
docker build -t trading-frontend ./frontend

docker rm -f trading-frontend 2>/dev/null || true
docker run -d \
  --name trading-frontend \
  --network app-network \
  -p 80:80 \
  trading-frontend

echo ""
echo "=========================================="
echo "  ✓ 部署完成！"
echo "=========================================="
echo ""
echo "访问地址："
echo "  - 应用前台：http://43.139.27.137"
echo "  - API文档：http://43.139.27.137:8000/docs"
echo "  - 健康检查：http://43.139.27.137:8000/health"
echo ""
echo "测试账号："
echo "  - 邮箱：test@example.com"
echo "  - 密码：test123"
echo ""
echo "常用命令："
echo "  - 查看日志：docker logs -f trading-backend"
echo "  - 重启服务：docker restart trading-backend trading-frontend"
echo "  - 停止服务：docker stop trading-backend trading-frontend"
echo ""
