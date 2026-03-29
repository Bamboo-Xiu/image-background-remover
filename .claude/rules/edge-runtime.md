# Edge Runtime Rules

## 强制规则

所有 API 路由必须声明 Edge Runtime:

```typescript
export const runtime = 'edge'
```

## 环境访问

必须通过 `getRequestContext` 访问 Cloudflare 绑定:

```typescript
import { getRequestContext } from '@cloudflare/next-on-pages'

const { env } = getRequestContext()
const db = env.DB          // D1 数据库
const apiKey = env.REMOVE_BG_API_KEY  // 环境变量
```

## 禁止事项

- **禁止** 使用 Node.js 原生模块 (`fs`, `path`, `crypto` 等)
- **禁止** 使用 Node.js 专用 API (`Buffer`, `process`, `__dirname` 等)
- **禁止** 使用同步 I/O 操作
- **禁止** 使用 `require()`，使用 ES Module `import`

## 允许的 API

- Web 标准 API: `fetch`, `Request`, `Response`, `URL`, `URLSearchParams`
- Web Crypto API: `crypto.subtle`
- Web Streams API
- `console.log` / `console.error`
- `setTimeout` / `setInterval`
- `TextEncoder` / `TextDecoder`
- `btoa` / `atob`

## 构建约束

- Next.js 配置中 `serverActions.bodySizeLimit` 设为 `2mb`
- 输出格式: `.vercel/output/static` (Vercel Build Output API)
- 构建后需要运行 post-build 脚本修复根路由映射
