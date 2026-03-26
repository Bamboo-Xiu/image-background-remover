# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

```bash
npm run dev          # 启动开发服务器 (localhost:3000)
npm run build        # 构建生产版本
npm run lint         # 运行 ESLint
npm run pages:build  # 构建 Cloudflare Pages 版本

# 数据库迁移
npx wrangler d1 migrations apply image-bg-remover-db --remote

# 部署
npx wrangler pages deploy .vercel/output/static
```

## 架构概览

- **前端**: Next.js 15 + React 19 + Tailwind CSS 4
- **认证**: NextAuth v5 (Google OAuth)
- **数据库**: Cloudflare D1 (SQLite)
- **部署**: Cloudflare Pages (`@cloudflare/next-on-pages`)
- **API**: Edge Runtime，调用 Remove.bg API

### 核心功能

1. **图片背景去除** - 核心功能，调用 Remove.bg API
2. **用户体系** - 配额管理（免费5次 + 订阅 + 按次购买）
3. **个人中心** - 配额状态、使用统计、处理历史

### 目录结构

```text
app/
├── api/
│   ├── auth/[...nextauth]/  # 认证路由
│   ├── quota/               # 配额状态 API
│   ├── remove-bg/           # 背景去除 API
│   └── user/
│       ├── history/         # 处理历史
│       └── stats/           # 用户统计
├── pricing/                 # 定价页面
├── faq/                     # FAQ 页面
├── profile/                 # 个人中心
├── home-client.tsx          # 首页客户端组件
└── components/
    └── auth-header-client.tsx  # 认证头部（含配额显示）

lib/
├── quota.ts                 # 配额管理核心逻辑
├── db-utils.ts              # 数据库工具函数
├── pricing.ts               # 定价配置
└── d1-adapter.ts            # NextAuth D1 适配器

migrations/
├── 0001_init.sql            # 用户、会话表
└── 0002_user_system.sql     # 配额、订阅、交易、历史表
```

### 用户配额系统

| 配额类型     | 说明                                       |
| ------------ | ------------------------------------------ |
| 免费配额     | 新用户 5 次，一次性                         |
| 订阅配额     | 按月重置（轻量50次/标准200次/专业500次）    |
| 按次购买     | 永不过期                                   |

配额消耗优先级：免费 > 订阅 > 按次购买

### 环境变量

在 Cloudflare Dashboard 设置：

- `REMOVE_BG_API_KEY` - Remove.bg API 密钥
- `GOOGLE_CLIENT_ID` - Google OAuth 客户端 ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth 密钥
- `AUTH_SECRET` - NextAuth 密钥

## Edge Runtime 约定

本项目 API 路由使用 Edge Runtime：

```typescript
export const runtime = 'edge'

// 访问 Cloudflare 环境变量和数据库
import { getRequestContext } from '@cloudflare/next-on-pages'

const { env } = getRequestContext()
const db = env.DB  // D1 数据库
```

**注意**：

- 不支持 Node.js 原生模块
- 使用 Web 标准 API（fetch、Request、Response 等）
- 参考 `@nextjs-rules.md` 了解 Next.js 15 的特殊约定
