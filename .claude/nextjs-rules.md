# Next.js 15 特殊约定

> 此版本有 breaking changes，API、约定和文件结构可能与训练数据不同。

## 开发前必读

在编写代码前，阅读 `node_modules/next/dist/docs/` 中的相关指南。

## Edge Runtime

本项目 API 路由使用 Edge Runtime：

```typescript
export const runtime = 'edge'
```

### 环境变量访问

在 Cloudflare Pages 环境中，使用以下方式访问环境变量：

```typescript
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST() {
  const { env } = getRequestContext()
  const apiKey = env.REMOVE_BG_API_KEY
  // ...
}
```

### 注意事项

- 不支持 Node.js 原生模块
- 使用 Web 标准 API（fetch、Request、Response 等）
- 弃用警告必须重视
