# Architecture

## 目录结构

```text
app/
├── api/
│   ├── auth/[...nextauth]/    # NextAuth 认证路由
│   ├── paypal/                # PayPal 支付 (5 个路由)
│   │   ├── create-order/      # 创建一次性订单
│   │   ├── capture-order/     # 捕获支付
│   │   ├── create-subscription/ # 创建订阅
│   │   ├── activate-subscription/ # 激活订阅
│   │   └── webhook/           # PayPal Webhook
│   ├── remove-bg/             # 背景去除 API
│   ├── quota/                 # 配额状态 API
│   └── user/
│       ├── history/           # 处理历史
│       └── stats/             # 用户统计
├── pricing/                   # 定价页
├── profile/                   # 个人中心
├── payment/                   # 支付回调页
├── faq/                       # FAQ 页
├── home-client.tsx            # 首页客户端组件
├── components/
│   └── auth-header-client.tsx # 认证头部（含配额显示）
├── layout.tsx                 # 根布局
└── globals.css                # 全局样式

lib/
├── quota.ts                   # 配额管理核心逻辑
├── db-utils.ts                # 数据库工具函数
├── pricing.ts                 # 定价配置（订阅计划+按次购买）
├── paypal.ts                  # PayPal API 封装
└── d1-adapter.ts              # NextAuth D1 适配器

migrations/
├── 0001_init.sql              # NextAuth 表 (users, accounts, sessions, verification_tokens)
├── 0002_user_system.sql       # 用户系统 (user_quotas, subscriptions, transactions, process_history)
└── 0003_paypal_support.sql    # PayPal 支持 (paypal_orders)

workers/
└── remove-bg.js               # 旧版 Cloudflare Worker 代理

auth.ts                        # NextAuth 配置入口
env.d.ts                       # CloudflareEnv 类型定义
```

## 架构分层

1. **页面层** (`app/*/page.tsx`) - Server Component，导出 metadata，委托给 Client Component
2. **客户端组件层** (`*-client.tsx`) - 交互逻辑、状态管理、API 调用
3. **API 路由层** (`app/api/*/route.ts`) - Edge Runtime，处理请求
4. **业务逻辑层** (`lib/`) - 配额管理、定价配置、数据库工具
5. **数据层** (Cloudflare D1) - SQL 查询，通过 `getRequestContext().env.DB` 访问

## 请求处理流程

```
用户请求 → NextAuth 认证检查 → 配额验证 → 业务处理 → 数据库操作 → 响应
```

## NextAuth 配置

- 入口: `auth.ts`
- Provider: Google OAuth
- Adapter: 自定义 D1 Adapter (`lib/d1-1adapter.ts`)
- Session: Database 策略（D1 可用时），否则 JWT
- 使用方式:
  - API 路由: `const session = await auth()`
  - 客户端: `const { data: session, status } = useSession()`
