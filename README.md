# NDZY App

一个基于 Next.js 和 PostgreSQL 的用户认证系统。

## 功能特性

- 🔐 用户注册和登录
- 🍪 JWT Token 认证
- 🔄 React Context 全局状态管理
- 🗄️ PostgreSQL 数据库集成
- 🎨 Tailwind CSS 样式
- 📱 响应式设计
- 🌙 深色模式支持
- 🚀 自动重定向和状态管理
- 🗃️ 数据库重置功能

## 技术栈

- **前端**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: PostgreSQL
- **认证**: JWT, bcryptjs
- **开发工具**: ESLint, TypeScript

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.local` 文件并配置数据库连接：

```env
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/ndzy_app"

# JWT 密钥
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# 应用环境
NODE_ENV="development"
```

### 3. 设置 PostgreSQL 数据库

确保您的 PostgreSQL 数据库正在运行，并创建一个数据库供应用使用。应用启动时会自动初始化数据库表结构。

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

```
├── app/
│   ├── api/auth/          # 认证 API 路由
│   │   ├── login/         # 登录接口
│   │   ├── register/      # 注册接口
│   │   ├── me/            # 获取用户信息接口
│   │   └── reset-db/      # 数据库重置接口
│   ├── auth/              # 认证页面 (登录/注册)
│   ├── dashboard/         # 用户仪表盘（受保护）
│   ├── layout.tsx         # 根布局（包含 AuthProvider）
│   └── page.tsx           # 首页（智能显示）
├── lib/
│   ├── auth-context.tsx   # React 认证上下文
│   ├── with-auth.tsx      # 高阶组件（额外保护）
│   ├── auth.ts            # JWT 工具函数
│   ├── db.ts              # 数据库连接
│   ├── init-db.ts         # 数据库初始化
│   ├── reset-tables.ts    # 数据库表重置
│   └── user.ts            # 用户相关操作
└── public/                # 静态资源
```

## API 接口

### 认证接口

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/reset-db` - 重置数据库表结构

### 请求示例

#### 用户注册
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"张三","email":"zhang@example.com","password":"123456"}'
```

#### 用户登录
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"zhang@example.com","password":"123456"}'
```

#### 获取用户信息
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 重置数据库
```bash
curl -X POST http://localhost:3000/api/auth/reset-db
```

## 部署

### Vercel 部署

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 部署

### 环境变量配置

生产环境需要配置以下环境变量：

- `DATABASE_URL`: PostgreSQL 连接字符串
- `JWT_SECRET`: JWT 密钥（请使用强密码）
- `NODE_ENV`: 设置为 "production"

## 安全性

- **JWT 认证**：基于 JSON Web Token 的认证机制
- **密码加密**：使用 bcryptjs 进行哈希加密
- **JWT 令牌**：包含用户基本信息，用于客户端状态管理
- **数据库安全**：连接池和参数化查询
- **输入验证**：前后端验证和错误处理

## 开发

### 添加新的 API 路由

在 `app/api/` 目录下创建新的路由文件。

### 数据库操作

在 `lib/` 目录下添加新的数据模型和操作函数。

## 认证系统

本项目采用 React Context 和 JWT 令牌的认证系统：

### � React Context 状态管理
- 全局用户状态管理
- 自动用户信息获取和更新
- 统一的登录、注册、登出接口

### 🛡️ 路由保护
- 使用高阶组件 `withAuth` 保护敏感页面
- 客户端路由级别的认证检查
- 自动重定向到登录页面

### � 智能重定向
- 未认证用户自动重定向到登录页
- 已认证用户访问认证页面时重定向到仪表盘
- 流畅的用户体验

## 许可证

MIT License
