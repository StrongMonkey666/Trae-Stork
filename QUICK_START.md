# 服务器部署快速指南

## 📋 部署步骤概览

你只需要在服务器上执行 **6个简单步骤** 即可完成部署！

---

## 🚀 开始部署

### 步骤 1：连接服务器

在本地终端执行：

```bash
ssh -p 22 Ubuntu@43.139.27.137
```

输入密码：`SY9331sy`

---

### 步骤 2：下载项目文件

**选项 A：如果代码在 Git 仓库**

```bash
git clone <你的仓库地址> ~/trading-platform
cd ~/trading-platform
```

**选项 B：如果需要手动上传**

先在本地打包，然后上传到服务器：

```bash
# 在本地项目目录执行
cd /workspace
tar -czvf trading-platform.tar.gz ./*
```

然后在服务器上：

```bash
cd ~
scp Ubuntu@43.139.27.137:~/trading-platform.tar.gz ~/  # 如果文件在本地
# 或者让服务商上传文件

tar -xzvf trading-platform.tar.gz
cd trading-platform
```

---

### 步骤 3：赋予脚本执行权限

```bash
cd ~/trading-platform
chmod +x server-setup.sh
```

---

### 步骤 4：运行自动部署脚本

```bash
sudo ./server-setup.sh
```

⏱ 等待 **5-10分钟**，脚本会自动完成所有安装和配置。

---

### 步骤 5：验证部署成功

```bash
# 检查所有服务是否运行
docker ps
```

应该看到类似输出：
```
CONTAINER ID   IMAGE              STATUS
abc123         trading-frontend   Up 2 minutes
def456         trading-backend    Up 2 minutes
ghi789         trading-db         Up 5 minutes
jkl012         trading-cache      Up 2 minutes
```

---

### 步骤 6：访问应用

打开浏览器，访问：

👉 **http://43.139.27.137**

使用测试账号登录：
- 📧 邮箱：`test@example.com`
- 🔐 密码：`test123`

---

## ❌ 如果遇到问题

### 问题：端口被占用

```bash
# 停止占用80端口的服务
sudo systemctl stop nginx
sudo systemctl stop apache2

# 或者修改 frontend/nginx.conf 中的端口
```

### 问题：MySQL启动失败

```bash
# 查看MySQL日志
docker logs trading-db

# 等待更长时间后重试
sleep 60
docker restart trading-db
```

### 问题：权限不足

```bash
# 确保使用sudo运行
sudo ./server-setup.sh

# 或者先将当前用户加入docker组
sudo usermod -aG docker $USER
# 然后重新登录
```

---

## 📊 部署后检查清单

- [ ] 访问 http://43.139.27.137 成功显示登录页面
- [ ] 使用测试账号能够成功登录
- [ ] 仪表盘页面正常显示
- [ ] API文档可访问：http://43.139.27.137:8000/docs

---

## 🔧 常用维护命令

```bash
# 查看日志
docker logs -f trading-backend      # 后端日志
docker logs -f trading-frontend     # 前端日志

# 重启服务
docker restart trading-backend
docker restart trading-frontend

# 停止所有服务
docker stop $(docker ps -q)

# 删除所有容器（慎用）
docker-compose down

# 完全重装
docker-compose down -v
sudo ./server-setup.sh
```

---

## 🎯 下一步

部署成功后，你可以：

1. ✅ 查看 API 文档：http://43.139.27.137:8000/docs
2. ✅ 创建新的交易策略
3. ✅ 运行回测分析
4. ✅ 查看实时行情
5. ⚠️ **重要**：建议后续修改密码和配置真实的数据库

---

## ⚠️ 安全提醒

当前部署使用了默认配置，生产环境请：

1. 修改 `SECRET_KEY` 为强密码
2. 修改 MySQL 数据库密码
3. 配置防火墙（只开放80和22端口）
4. 考虑配置 HTTPS（SSL证书）

---

**遇到任何问题，随时告诉我！** 😊
