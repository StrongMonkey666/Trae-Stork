#!/bin/bash

set -e

echo "开始部署私人交易策略平台..."

cd /workspace

if [ ! -f .env ]; then
    echo "创建环境变量文件..."
    cp backend/.env.example backend/.env
    echo "请编辑 backend/.env 文件配置数据库和密钥"
fi

echo "构建并启动 Docker 容器..."
docker-compose up -d --build

echo "等待服务启动..."
sleep 10

echo "检查服务状态..."
docker-compose ps

echo ""
echo "部署完成!"
echo "- 前端地址: http://localhost"
echo "- 后端API: http://localhost:8000"
echo "- API文档: http://localhost:8000/docs"
echo ""
echo "测试账号:"
echo "- 邮箱: test@example.com"
echo "- 密码: test123"
