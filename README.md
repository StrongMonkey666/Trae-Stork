# 私人股票交易策略平台

## 项目简介

这是一个功能完整的私人股票交易策略平台，采用现代化的前后端分离架构。平台集成了策略回测、实时行情、技术分析和组合管理等功能，帮助用户科学化、系统化地执行交易策略。

## 技术栈

### 前端
- React 18 + TypeScript
- Vite 5 (构建工具)
- TailwindCSS 3 (样式框架)
- ECharts 5 (图表库)
- Monaco Editor (代码编辑器)
- Zustand (状态管理)
- React Router 6 (路由)

### 后端
- Python FastAPI
- SQLAlchemy 2 (ORM)
- MySQL 8 (数据库)
- Redis 7 (缓存)
- akshare (财经数据接口)

## 快速开始

### 方法一：Docker 部署（推荐）

```bash
# 1. 启动所有服务
chmod +x deploy.sh
./deploy.sh

# 2. 访问应用
# 前端: http://localhost
# 后端API: http://localhost:8000
# API文档: http://localhost:8000/docs
```

### 方法二：本地开发

#### 前端开发

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置 VITE_API_BASE_URL

# 启动开发服务器
npm run dev
```

#### 后端开发

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 初始化数据库
mysql -u root -p < migrations/001_init.sql

# 启动服务器
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 功能模块

### 1. 用户认证
- 用户注册和登录
- JWT Token 认证
- 安全的密码加密存储

### 2. 策略管理
- 创建、编辑、删除交易策略
- Python 代码编辑器（Monaco Editor）
- 策略模板库
- 策略状态管理

### 3. 回测分析
- 自定义回测参数
- 历史数据回测
- 绩效指标分析
  - 总收益率
  - 年化收益
  - 夏普比率
  - 最大回撤
  - 胜率
- 收益曲线可视化

### 4. 实时行情
- 股票实时行情监控
- 多股票同时追踪
- 市场快讯

### 5. 技术分析
- K线图表展示
- 均线指标 (MA5, MA10, MA20)
- MACD、KDJ、RSI、布林带等指标
- 交互式图表操作

### 6. 组合管理
- 多组合管理
- 持仓明细追踪
- 交易历史记录
- 收益统计分析
- 持仓分布可视化

## 项目结构

```
workspace/
├── frontend/                    # 前端项目
│   ├── src/
│   │   ├── components/        # React 组件
│   │   │   ├── common/        # 通用组件
│   │   │   ├── layout/        # 布局组件
│   │   │   ├── charts/        # 图表组件
│   │   │   └── trading/       # 交易组件
│   │   ├── pages/             # 页面组件
│   │   │   ├── Auth/          # 认证页面
│   │   │   ├── Dashboard/     # 仪表盘
│   │   │   ├── Strategy/      # 策略管理
│   │   │   ├── Backtest/      # 回测分析
│   │   │   ├── Market/        # 实时行情
│   │   │   ├── Technical/     # 技术分析
│   │   │   ├── Portfolio/     # 组合管理
│   │   │   └── User/          # 用户中心
│   │   ├── stores/            # Zustand 状态管理
│   │   ├── api/               # API 客户端
│   │   ├── types/             # TypeScript 类型定义
│   │   └── utils/             # 工具函数
│   ├── public/                # 静态资源
│   ├── package.json           # 前端依赖
│   ├── tailwind.config.js     # TailwindCSS 配置
│   └── Dockerfile             # 前端 Docker 配置
│
├── backend/                   # 后端项目
│   ├── app/
│   │   ├── api/               # API 路由
│   │   ├── models/            # 数据库模型
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # 业务逻辑层
│   │   ├── core/              # 核心功能
│   │   │   ├── security.py    # JWT 和密码加密
│   │   │   └── dependencies.py
│   │   ├── utils/             # 工具函数
│   │   │   ├── akshare_helper.py  # akshare 封装
│   │   │   └── backtest_engine.py # 回测引擎
│   │   ├── config.py          # 配置文件
│   │   ├── database.py        # 数据库连接
│   │   └── main.py            # FastAPI 应用入口
│   ├── migrations/            # 数据库迁移脚本
│   │   └── 001_init.sql       # 初始化脚本
│   ├── tests/                 # 测试文件
│   ├── requirements.txt       # Python 依赖
│   ├── Dockerfile             # 后端 Docker 配置
│   └── .env.example           # 环境变量示例
│
├── docker-compose.yml         # Docker Compose 配置
└── deploy.sh                  # 部署脚本
```

## 数据库

### 主要数据表

1. **users** - 用户表
2. **strategies** - 策略表
3. **backtest_records** - 回测记录表
4. **portfolios** - 组合表
5. **positions** - 持仓表
6. **trades** - 交易记录表
7. **watchlists** - 自选股表
8. **watchlist_stocks** - 自选股明细表

详细表结构请参考 `backend/migrations/001_init.sql`

## API 接口

所有 API 都遵循 RESTful 规范，通过 `/api/v1` 前缀访问。

### 认证接口
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录

### 策略接口
- `GET /api/v1/strategies` - 获取策略列表
- `POST /api/v1/strategies` - 创建策略
- `GET /api/v1/strategies/{id}` - 获取策略详情
- `PUT /api/v1/strategies/{id}` - 更新策略
- `DELETE /api/v1/strategies/{id}` - 删除策略

### 回测接口
- `POST /api/v1/backtest` - 创建回测任务
- `GET /api/v1/backtest/{task_id}` - 获取回测状态
- `GET /api/v1/backtest/{task_id}/result` - 获取回测结果

### 行情接口
- `GET /api/v1/market/realtime` - 获取实时行情
- `GET /api/v1/market/kline` - 获取K线数据
- `GET /api/v1/market/search` - 搜索股票

### 组合接口
- `GET /api/v1/portfolio` - 获取组合列表
- `GET /api/v1/portfolio/{id}` - 获取组合详情
- `POST /api/v1/portfolio` - 创建组合
- `GET /api/v1/portfolio/{id}/positions` - 获取持仓
- `POST /api/v1/portfolio/{id}/positions` - 添加持仓
- `GET /api/v1/portfolio/{id}/trades` - 获取交易记录

详细 API 文档请访问 http://localhost:8000/docs

## 测试账号

部署后会创建一个测试账号：

- 邮箱: `test@example.com`
- 密码: `test123`

## 数据源

平台使用 [akshare](https://github.com/akfamily/akshare) 作为数据源，支持：

- A股实时行情
- A股历史K线
- 股票基本面数据
- 期货、基金等数据

## 开发说明

### 前端开发

- 使用 TypeScript 确保类型安全
- 遵循 React Hooks 最佳实践
- 使用 TailwindCSS 进行快速样式开发
- 组件遵循单一职责原则

### 后端开发

- 使用 FastAPI 的依赖注入系统
- Pydantic 用于数据验证
- SQLAlchemy ORM 进行数据库操作
- JWT 用于身份认证

## 生产部署

### 环境要求

- Docker & Docker Compose
- MySQL 8.0+
- Redis 7.0+

### 部署步骤

1. 克隆项目代码
2. 配置环境变量
3. 运行部署脚本
4. 配置反向代理（可选）
5. 配置 SSL 证书（可选）

## 许可证

MIT License

## 联系方式

如有问题，请提交 Issue 或联系开发者。
