# Tech Stack

## 核心框架

- **Next.js**: 15.2.4 (App Router)
- **React**: 19.0.0
- **TypeScript**: 5+ (strict mode)
- **Tailwind CSS**: 4 + @tailwindcss/postcss

## 认证

- **NextAuth.js**: 5.0.0-beta.30 (v5)
- Provider: Google OAuth
- Session Strategy: Database (D1) with JWT fallback
- 自定义 D1 Adapter: `lib/d1-adapter.ts`

## 数据库

- **Cloudflare D1**: SQLite 兼容的 Serverless 数据库
- Database binding: `DB`
- Database name: `image-bg-remover-db`
- 3 个迁移文件: `migrations/0001_init.sql` ~ `0003_paypal_support.sql`

## 部署

- **Cloudflare Pages**: 通过 `@cloudflare/next-on-pages` (1.13.16) 构建
- Compatibility flags: `nodejs_compat_v2`
- 输出格式: `.vercel/output/static`
- 所有 API 路由使用 Edge Runtime

## 支付

- **PayPal API**: Orders API + Subscriptions API + Webhooks
- Sandbox: `api-m.sandbox.paypal.com`
- Production: 通过 `PAYPAL_BASE_URL` 环境变量配置

## 环境变量

在 Cloudflare Dashboard 设置，类型定义在 `env.d.ts`：

| 变量 | 用途 |
|------|------|
| `REMOVE_BG_API_KEY` | Remove.bg API 密钥 |
| `GOOGLE_CLIENT_ID` | Google OAuth 客户端 ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 密钥 |
| `AUTH_SECRET` | NextAuth 密钥 |
| `PAYPAL_CLIENT_ID` | PayPal 客户端 ID |
| `PAYPAL_CLIENT_SECRET` | PayPal 密钥 |
| `PAYPAL_BASE_URL` | PayPal API 端点 |
| `PAYPAL_WEBHOOK_ID` | PayPal Webhook ID |
| `NEXT_PUBLIC_APP_URL` | 应用 URL（支付回调用） |
