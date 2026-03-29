# Project File & Naming Conventions

## 文件命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 页面 | `page.tsx` | `app/pricing/page.tsx` |
| 客户端组件 | `*-client.tsx` | `pricing-client.tsx` |
| API 路由 | `route.ts` | `app/api/remove-bg/route.ts` |
| 工具函数 | `kebab-case.ts` | `db-utils.ts`, `d1-adapter.ts` |
| 迁移文件 | `NNNN_description.sql` | `0001_init.sql`, `0002_user_system.sql` |

## 目录组织

- 页面相关组件与页面放同一目录（co-location）
- 共享组件放 `app/components/`
- 业务逻辑放 `lib/`
- 数据库迁移放 `migrations/`

## 导入路径

- 使用 `@/` 别名映射 `src/` 根目录
- 示例: `import { auth } from '@/auth'`

## 文件类型约束

- 页面: `.tsx` (Server Component 默认)
- 客户端交互组件: `.tsx` + `'use client'` 指令
- API 路由: `.ts` (route.ts)
- 配置: `.ts` 或 `.mjs`
- 样式: `.css`
