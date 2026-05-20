# 服务器部署指南

## 服务器信息

- **服务器IP**: 43.139.27.137
- **SSH端口**: 22
- **用户名**: Ubuntu
- **应用访问地址**: http://43.139.27.137

---

## 部署前准备

### 1. 连接到服务器

在本地电脑打开终端，执行以下命令连接服务器：

```bash
ssh -p 22 Ubuntu@43.139.27.137
```

输入密码：`SY9331sy`

### 2. 更新系统并安装必要软件

连接成功后，依次执行以下命令：

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Docker和Docker Compose
sudo apt install -y docker.io docker-compose

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户添加到docker组（避免每次都要sudo）
sudo usermod -aG docker Ubuntu
```

### 3. 退出并重新连接（使Docker权限生效）

```bash
exit
ssh -p 22 Ubuntu@43.139.27.137
```

---

## 部署应用

### 方式一：自动部署（推荐）

#### 步骤1：创建项目目录

```bash
mkdir -p ~/trading-platform
cd ~/trading-platform
```

#### 步骤2：上传项目文件

**方法A：使用Git（推荐）**

```bash
# 如果你有Git仓库
git clone <你的仓库地址> .

# 或者如果没有仓库，需要手动上传文件
```

**方法B：使用scp上传**

在**本地电脑**（不是服务器）的新终端窗口执行：

```bash
cd /workspace  # 本地项目目录
scp -r * Ubuntu@43.139.27.137:~/trading-platform/
```

#### 步骤3：配置环境变量

```bash
cd ~/trading-platform

# 复制环境变量配置
cp backend/.env.example backend/.env

# 编辑后端配置
nano backend/.env
```

将内容修改为：

```
DATABASE_URL=mysql+pymysql://trading_user:trading_password123@db:3306/trading_platform
REDIS_URL=redis://cache:6379/0
SECRET_KEY=trading-platform-secret-key-2024-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=http://43.139.27.137,http://localhost
```

保存退出：`Ctrl + X`，然后按 `Y`，再按 `Enter`

#### 步骤4：启动服务

```bash
cd ~/trading-platform

# 赋予部署脚本执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

等待服务启动（约3-5分钟），然后访问 http://43.139.27.137

---

### 方式二：手动分步部署

如果自动部署脚本有问题，可以手动执行以下步骤：

#### 步骤1：创建必要目录

```bash
cd ~/trading-platform
mkdir -p mysql_data
```

#### 步骤2：启动MySQL和Redis

```bash
docker run -d \
  --name trading-db \
  -e MYSQL_ROOT_PASSWORD=root_password \
  -e MYSQL_DATABASE=trading_platform \
  -e MYSQL_USER=trading_user \
  -e MYSQL_PASSWORD=trading_password123 \
  -v $(pwd)/mysql_data:/var/lib/mysql \
  -p 3306:3306 \
  --network app-network \
  mysql:8.0
```

#### 步骤3：等待MySQL启动（约30秒）

```bash
sleep 30

# 初始化数据库
docker exec -i trading-db mysql -uroot -proot_password trading_platform < backend/migrations/001_init.sql
```

#### 步骤4：启动Redis

```bash
docker run -d \
  --name trading-cache \
  --network app-network \
  redis:7-alpine
```

#### 步骤5：构建并启动后端

```bash
# 构建后端镜像
cd ~/trading-platform
docker build -t trading-backend ./backend

# 启动后端容器
docker run -d \
  --name trading-backend \
  --network app-network \
  -p 8000:8000 \
  -e DATABASE_URL=mysql+pymysql://trading_user:trading_password123@trading-db:3306/trading_platform \
  -e REDIS_URL=redis://trading-cache:6379/0 \
  -e SECRET_KEY=trading-platform-secret-key-2024 \
  trading-backend
```

#### 步骤6：构建并启动前端

```bash
# 构建前端镜像
docker build -t trading-frontend ./frontend

# 启动前端容器
docker run -d \
  --name trading-frontend \
  -p 80:80 \
  --network app-network \
  trading-frontend
```

#### 步骤7：验证部署

```bash
# 检查所有容器状态
docker ps

# 测试后端API
curl http://localhost:8000/health

# 测试前端
curl http://localhost:80
```

---

## 验证部署成功

### 1. 检查服务状态

在服务器上执行：

```bash
docker ps
```

应该看到4个运行的容器：
- trading-frontend (前端)
- trading-backend (后端)
- trading-db (MySQL)
- trading-cache (Redis)

### 2. 访问应用

在浏览器中打开：

```
http://43.139.27.137
```

### 3. 测试登录

使用测试账号登录：

- **邮箱**: `test@example.com`
- **密码**: `test123`

---

## 常见问题解决

### 问题1：前端无法访问

```bash
# 检查前端容器日志
docker logs trading-frontend

# 重启前端容器
docker restart trading-frontend
```

### 问题2：后端API无法访问

```bash
# 检查后端容器日志
docker logs trading-backend

# 重启后端容器
docker restart trading-backend
```

### 问题3：数据库连接失败

```bash
# 检查MySQL容器是否运行
docker ps | grep trading-db

# 如果没有运行，重新启动
docker start trading-db

# 等待30秒后重试
sleep 30
docker restart trading-backend
```

### 问题4：需要重启所有服务

```bash
cd ~/trading-platform
docker-compose down
docker-compose up -d
```

---

## 维护命令

### 查看日志

```bash
# 查看所有容器日志
docker-compose logs -f

# 查看特定容器日志
docker logs -f trading-backend
docker logs -f trading-frontend
```

### 停止服务

```bash
cd ~/trading-platform
docker-compose down
```

### 更新代码

```bash
cd ~/trading-platform

# 拉取最新代码
git pull

# 重新构建并启动
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 备份数据库

```bash
# 创建备份
docker exec trading-db mysqldump -uroot -proot_password trading_platform > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复备份
docker exec -i trading-db mysql -uroot -proot_password trading_platform < backup_file.sql
```

---

## 安全建议

### 1. 修改默认密码

在生产环境中，请务必修改以下密码：

- MySQL root密码
- MySQL trading_user密码
- JWT SECRET_KEY

### 2. 配置防火墙

```bash
# 只开放必要的端口
sudo ufw allow 22    # SSH
sudo ufw allow 80     # HTTP
sudo ufw allow 443    # HTTPS（如果有）
sudo ufw enable
```

### 3. 配置SSL证书（推荐）

如果需要HTTPS，可以使用Let's Encrypt：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 4. 定期更新

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 更新Docker镜像
docker-compose pull
docker-compose up -d
```

---

## 联系支持

如果部署过程中遇到问题，请提供：

1. 执行的具体命令
2. 完整的错误信息
3. `docker ps` 和 `docker logs` 的输出

祝你部署成功！🚀
