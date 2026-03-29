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

## 快速参考

- **技术栈**: Next.js 15 + React 19 + Tailwind CSS 4 + TypeScript 5 (strict)
- **认证**: NextAuth v5 (Google OAuth) → 详见 `.claude/knowledge/architecture.md`
- **数据库**: Cloudflare D1 (SQLite) → 详见 `.claude/knowledge/database-schema.md`
- **部署**: Cloudflare Pages (Edge Runtime) → 详见 `.claude/rules/edge-runtime.md`
- **支付**: PayPal Orders + Subscriptions API → 详见 `.claude/knowledge/paypal-integration.md`

## 核心功能

1. **图片背景去除** - 调用 Remove.bg API
2. **用户体系** - 配额管理（免费5次 + 订阅 + 按次购买）→ 详见 `.claude/knowledge/quota-pricing.md`
3. **个人中心** - 配额状态、使用统计、处理历史

## 关键目录

```text
app/api/          → API 路由 (Edge Runtime)
app/*/            → 页面 + 客户端组件
lib/              → 业务逻辑 (quota, pricing, paypal, db-utils)
migrations/       → D1 数据库迁移 (0001~0003)
auth.ts           → NextAuth 配置入口
env.d.ts          → 环境变量类型
```

## 详细文档索引

- 架构与目录结构 → `.claude/knowledge/architecture.md`
- 技术栈与环境变量 → `.claude/knowledge/tech-stack.md`
- API 模式与端点 → `.claude/knowledge/api-patterns.md`
- 数据库 Schema → `.claude/knowledge/database-schema.md`
- 配额与定价系统 → `.claude/knowledge/quota-pricing.md`
- PayPal 集成 → `.claude/knowledge/paypal-integration.md`

## 代码规范索引

- 命名与文件组织 → `.claude/rules/naming-conventions.md`
- Edge Runtime 约束 → `.claude/rules/edge-runtime.md`
- TypeScript & React → `.claude/rules/typescript-react.md`
- API 路由规范 → `.claude/rules/api-routes.md`
- 数据库查询规范 → `.claude/rules/database-queries.md`
- 样式规范 → `.claude/rules/styling.md`

## Edge Runtime 提示

本项目所有 API 路由使用 Edge Runtime，访问数据库通过：

```typescript
export const runtime = 'edge'
import { getRequestContext } from '@cloudflare/next-on-pages'
const { env } = getRequestContext()
const db = env.DB
```

完整约束见 `.claude/rules/edge-runtime.md`
