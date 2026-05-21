#!/bin/bash
set -e

# AI Trader 一键部署脚本
# 适用于 Ubuntu 22.04 服务器

echo "============================================="
echo "   AI Trader 一键部署脚本"
echo "============================================="

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "工作目录: $SCRIPT_DIR"
echo ""

# 1. 更新系统包
echo "[1/8] 更新系统包..."
sudo apt-get update -qq

# 2. 安装必要的系统依赖
echo "[2/8] 安装系统依赖..."
sudo apt-get install -qq -y python3-venv python3-pip git

# 3. 创建虚拟环境
echo "[3/8] 创建 Python 虚拟环境..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "虚拟环境创建成功"
else
    echo "虚拟环境已存在，跳过创建"
fi

# 4. 激活虚拟环境并安装依赖
echo "[4/8] 安装 Python 依赖..."
source venv/bin/activate
pip install --upgrade pip -qq
pip install -r requirements.txt -qq
echo "依赖安装完成"

# 5. 配置环境变量文件
echo "[5/8] 配置环境变量..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo ""
    echo "============================================="
    echo "⚠️  重要提示：请编辑 .env 文件，填入你的 DeepSeek API Key"
    echo "   命令: nano $SCRIPT_DIR/.env"
    echo "============================================="
    echo ""
else
    echo ".env 文件已存在"
fi

# 6. 创建 systemd 服务和 timer
echo "[6/8] 配置 systemd 服务..."

# 获取当前用户
CURRENT_USER=$(whoami)

# 创建 agent service 文件
cat > /tmp/ai-agent.service << EOF
[Unit]
Description=AI Trader Agent Service
After=network.target

[Service]
Type=oneshot
User=$CURRENT_USER
WorkingDirectory=$SCRIPT_DIR
ExecStart=$SCRIPT_DIR/venv/bin/python $SCRIPT_DIR/agent.py AAPL
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 创建 agent timer 文件（每天上午 9 点运行）
cat > /tmp/ai-agent.timer << EOF
[Unit]
Description=AI Trader Agent Daily Timer

[Timer]
OnCalendar=*-*-* 09:00:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

# 创建 dashboard service 文件
cat > /tmp/ai-dashboard.service << EOF
[Unit]
Description=AI Trader Dashboard Service
After=network.target

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$SCRIPT_DIR
ExecStart=$SCRIPT_DIR/venv/bin/streamlit run $SCRIPT_DIR/dashboard.py --server.port 8501 --server.address 0.0.0.0
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 安装 service 文件
sudo cp /tmp/ai-agent.service /etc/systemd/system/
sudo cp /tmp/ai-agent.timer /etc/systemd/system/
sudo cp /tmp/ai-dashboard.service /etc/systemd/system/
sudo rm /tmp/ai-agent.service /tmp/ai-agent.timer /tmp/ai-dashboard.service

# 重载 systemd
sudo systemctl daemon-reload

# 7. 启动并启用服务
echo "[7/8] 启动服务..."

# 启用并启动 dashboard 服务
sudo systemctl enable ai-dashboard.service
sudo systemctl restart ai-dashboard.service

# 启用并启动 agent timer
sudo systemctl enable ai-agent.timer
sudo systemctl restart ai-agent.timer

# 8. 配置防火墙
echo "[8/8] 配置防火墙..."
if command -v ufw &> /dev/null; then
    if sudo ufw status | grep -q "active"; then
        sudo ufw allow 8501/tcp -qq
        echo "防火墙已开放 8501 端口"
    else
        echo "防火墙未启用，跳过配置"
    fi
else
    echo "ufw 未安装，跳过防火墙配置"
fi

echo ""
echo "============================================="
echo "✅ 部署完成！"
echo "============================================="
echo ""
echo "服务状态："
echo "  - Dashboard 服务: $(sudo systemctl is-active ai-dashboard.service)"
echo "  - Agent Timer:    $(sudo systemctl is-active ai-agent.timer)"
echo ""
echo "访问地址："
echo "  http://$(hostname -I | awk '{print $1}'):8501"
echo ""
echo "常用命令："
echo "  查看 dashboard 日志: sudo journalctl -u ai-dashboard.service -f"
echo "  查看 agent 日志:     sudo journalctl -u ai-agent.service -f"
echo "  手动运行 agent:      $SCRIPT_DIR/venv/bin/python $SCRIPT_DIR/agent.py AAPL"
echo "  重启 dashboard:      sudo systemctl restart ai-dashboard.service"
echo ""
if [ ! -f ".env" ] || grep -q "your_key_here" .env; then
    echo "⚠️  别忘了在 .env 文件中配置你的 DeepSeek API Key！"
fi
