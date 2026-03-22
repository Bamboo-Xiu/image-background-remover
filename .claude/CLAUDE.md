# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

```bash
npm run dev          # 启动开发服务器 (localhost:3000)
npm run build        # 构建生产版本
npm run lint         # 运行 ESLint
npm run pages:build  # 构建 Cloudflare Pages 版本
```

## 架构概览

- **前端**: Next.js 15 + React 19 + Tailwind CSS 4
- **部署**: Cloudflare Pages (`@cloudflare/next-on-pages`)
- **API**: Edge Runtime，调用 Remove.bg API

### 关键文件

| 文件 | 说明 |
|------|------|
| `app/page.tsx` | 单页应用，图片上传与处理逻辑 |
| `app/api/remove-bg/route.ts` | Edge API 路由，代理 Remove.bg API |
| `wrangler.toml` | Cloudflare Workers 配置 |

### 环境变量

在 Cloudflare Dashboard 设置 `REMOVE_BG_API_KEY`，不要提交到代码仓库。

## 注意事项

- API Route 使用 `export const runtime = 'edge'`
- 使用 `getRequestContext().env` 访问 Cloudflare 环境变量
- 参考 `@nextjs-rules.md` 了解 Next.js 15 的特殊约定
