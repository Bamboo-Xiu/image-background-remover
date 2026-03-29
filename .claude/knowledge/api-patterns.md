# API Patterns

## 通用 API 路由模板

所有 API 路由遵循以下模式：

```typescript
export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getRequestContext } from '@cloudflare/next-on-pages'

export async function POST(req: NextRequest) {
  try {
    // 1. 认证检查
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    // 2. 获取数据库
    const { env } = getRequestContext()
    const db = env.DB

    // 3. 参数验证
    const body = await req.json()
    // ...验证逻辑

    // 4. 业务处理
    // ...

    // 5. 返回成功响应
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: '服务器错误', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
```

## 错误响应格式

```json
{
  "error": "人类可读的错误消息",
  "code": "ERROR_CODE"
}
```

## HTTP 状态码约定

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 | 成功 | 正常响应 |
| 400 | 请求错误 | 参数无效、文件格式错误 |
| 401 | 未认证 | 未登录 |
| 402 | 需要付费 | 配额不足 |
| 404 | 未找到 | 资源不存在 |
| 500 | 服务器错误 | 异常捕获 |

## 核心 API 端点

### POST /api/remove-bg
- 接收 FormData (image_file)
- 检查配额 → 调用 Remove.bg API → 扣减配额 → 记录历史
- 返回: 二进制 PNG 图片 (Content-Type: image/png)

### GET /api/quota
- 返回当前用户配额状态 (free/subscription/payPerUse)

### GET /api/user/history
- 返回处理历史列表 (支持分页)

### GET /api/user/stats
- 返回用户统计信息

### POST /api/paypal/create-order
- 创建 PayPal 一次性购买订单

### POST /api/paypal/capture-order
- 捕获已批准的 PayPal 支付，增加配额

### POST /api/paypal/create-subscription
- 创建 PayPal 订阅

### POST /api/paypal/activate-subscription
- 激活已批准的订阅

### POST /api/paypal/webhook
- 处理 PayPal Webhook 事件
- 事件: PAYMENT.CAPTURE.COMPLETED, BILLING.SUBSCRIPTION.ACTIVATED/RENEWED/CANCELLED
