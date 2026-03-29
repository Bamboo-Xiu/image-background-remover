# TypeScript & React Rules

## TypeScript

- 严格模式: `"strict": true`
- 目标: ES2017
- 模块: ESNext
- JSX: preserve
- 路径别名: `@/*` → 根目录

### 类型规范

- 使用 `interface` 定义对象类型（不使用 `type`）
- 泛型查询结果: `.first<UserType>()` 显式指定返回类型
- 不允许隐式 `any`
- 环境变量类型定义在 `env.d.ts` 中的 `CloudflareEnv` interface

### 类型导入

```typescript
// 使用 type 关键字导入类型
import type { NextRequest } from 'next/server'
```

## React 组件规范

### Server Component (默认)

```typescript
// app/example/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '页面标题',
  description: '页面描述',
}

export default function ExamplePage() {
  return <ExampleClient />
}
```

### Client Component

```typescript
'use client'  // 必须在文件顶部

import { useState, useEffect, useCallback } from 'react'
import { useSession, SessionProvider } from 'next-auth/react'

function ExampleContent() {
  const { data: session, status } = useSession()
  // ... 组件逻辑
}

// 导出包裹了 SessionProvider 的组件
export default function ExampleClient() {
  return (
    <SessionProvider>
      <ExampleContent />
    </SessionProvider>
  )
}
```

### 状态管理模式

```typescript
const [data, setData] = useState<DataType>(initialValue)
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
```

### 事件处理

```typescript
const handleAction = useCallback(async () => {
  setLoading(true)
  try {
    const res = await fetch('/api/endpoint', { method: 'POST' })
    const result = await res.json()
    if (res.ok) {
      setData(result)
    }
  } finally {
    setLoading(false)
  }
}, [dependencies])
```

## 页面-组件分离原则

1. Server Component (`page.tsx`): 负责 metadata、数据获取、渲染 Client Component
2. Client Component (`*-client.tsx`): 负责交互、状态、API 调用
3. 需要认证的 Client Component 必须包裹在 `SessionProvider` 中
