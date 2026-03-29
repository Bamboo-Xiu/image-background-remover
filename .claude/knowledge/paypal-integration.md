# PayPal Integration

## 支付流程

### 一次性购买

```
用户选择套餐 → POST /api/paypal/create-order
→ PayPal 返回 approval_url → 用户跳转 PayPal 授权
→ 回调 /payment/return?token=<orderId>
→ POST /api/paypal/capture-order → 捕获支付 → 增加配额
```

### 订阅

```
用户选择计划 → POST /api/paypal/create-subscription
→ PayPal 返回 approval_url → 用户跳转 PayPal 授权
→ 回调 /payment/return?subscription_id=<subId>
→ POST /api/paypal/activate-subscription → 激活订阅
```

## PayPal API 封装

实现在 `lib/paypal.ts`：
- `getAccessToken()` - 获取 OAuth Token
- `createOrder(amount)` - 创建订单
- `captureOrder(orderId)` - 捕获支付
- `createSubscription(planId)` - 创建订阅
- `activateSubscription(subId)` - 激活订阅
- `verifyWebhookSignature(headers, body)` - 验证 Webhook 签名

## Webhook 事件处理

| 事件 | 处理 |
|------|------|
| `PAYMENT.CAPTURE.COMPLETED` | 一次性购买完成，增加按次购买配额 |
| `BILLING.SUBSCRIPTION.ACTIVATED` | 新订阅激活，设置订阅配额 |
| `BILLING.SUBSCRIPTION.RENEWED` | 订阅续费，重置月度配额 |
| `BILLING.SUBSCRIPTION.CANCELLED` | 订阅取消，标记状态 |

## 数据追踪

`paypal_orders` 表追踪所有 PayPal 交易：
- `order_id`: PayPal Order/Subscription ID
- `type`: `order` 或 `subscription`
- `plan_key`: 套餐标识
- `amount`: 金额
- `quota`: 增加的配额数量
- `status`: `pending` → `completed` / `failed`

## 幂等处理

Webhook 处理中会先检查 `paypal_orders.status`，避免重复处理已完成的订单。
