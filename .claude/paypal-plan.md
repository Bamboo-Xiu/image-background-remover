# PayPal 支付集成方案（含 Subscriptions API）

## Context

定价页面已有订阅和按次购买两种模式，购买按钮是"联系客服购买"。需要接入 PayPal 实现在线支付：
- **月度订阅** → 使用 PayPal Subscriptions API（自动按月扣款）
- **按次购买** → 使用 PayPal Orders API（一次性支付）
- 币种 USD，先 Sandbox 测试
- 个人账户先试，Subscriptions API 不支持再升级 Business

## USD 定价

| 方案 | USD | 次数 | 单价 |
|------|-----|------|------|
| Light | $4.99/月 | 50 | $0.10 |
| Standard | $9.99/月 | 200 | $0.05 |
| Professional | $19.99/月 | 500 | $0.04 |
| 20次卡 | $2.99 | 20 | $0.15 |
| 50次卡 | $5.99 | 50 | $0.12 |
| 100次卡 | $9.99 | 100 | $0.10 |

## 两条支付流程

### 流程A: 按次购买 (Orders API)
```
点击 Buy Now → POST /api/paypal/create-order
→ 重定向到 PayPal → 用户付款
→ PayPal 回调 return_url → capture-order → 发放配额
→ /profile?payment=success
```

### 流程B: 月度订阅 (Subscriptions API)
```
点击 Subscribe → POST /api/paypal/create-subscription
→ 重定向到 PayPal → 用户同意订阅
→ PayPal 回调 return_url → activate-subscription → 发放配额
→ /profile?payment=success
→ PayPal 每月自动扣款 → Webhook BILLING.SUBSCRIPTION.ACTIVATED 续期
```

## 实现步骤

### Phase 1: 基础设施

**1. `migrations/0003_paypal_support.sql`** — 新建 paypal_orders 表
```sql
CREATE TABLE IF NOT EXISTS paypal_orders (
  order_id TEXT PRIMARY KEY,         -- PayPal Order/Subscription ID
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,                -- 'subscription' | 'pay_per_use'
  plan_key TEXT NOT NULL,            -- 'light'|'standard'|'professional'|'small'|'medium'|'large'
  amount REAL NOT NULL,              -- USD 金额 (如 4.99)
  quota INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',     -- pending|completed|failed
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_paypal_orders_user ON paypal_orders(user_id);
```
同时给 subscriptions 表加 `paypal_subscription_id` 列，用于关联 PayPal 订阅 ID。

**2. 修改 `lib/pricing.ts`** — 增加 USD 定价
- 每个计划增加 `priceUSD`, `unitPriceUSD` 字段

**3. 修改 `lib/db-utils.ts`** — paymentMethod 类型加 `'paypal'`

**4. 新建 `lib/paypal.ts`** — PayPal API 封装（全用 fetch）
- `getAccessToken()` — OAuth2
- `createProduct()` — 创建 PayPal 产品（如不存在）
- `createPlan(productId, price, name)` — 创建计费计划
- `createSubscription(planId, returnUrl, cancelUrl)` — 创建订阅
- `createOrder(amount, description, returnUrl, cancelUrl)` — 创建订单
- `captureOrder(orderId)` — 捕获订单
- `verifyWebhookSignature(headers, body, webhookId)` — Webhook 验证

### Phase 2: 后端 API

**5. 新建 `app/api/paypal/create-order/route.ts`**
- POST, 需登录, Body: `{ type: 'pay_per_use', planKey }`
- → create-order → 写 paypal_orders → 返回 `{ orderId, approveUrl }`

**6. 新建 `app/api/paypal/capture-order/route.ts`**
- POST, 需登录, Body: `{ orderId }`
- → 幂等检查 → capture → addPayPerUseQuota → 更新状态 → 返回成功

**7. 新建 `app/api/paypal/create-subscription/route.ts`**
- POST, 需登录, Body: `{ planKey: 'light'|'standard'|'professional' }`
- → 获取/创建 PayPal Product → 获取/创建 Plan → createSubscription
- → 写 paypal_orders → 返回 `{ subscriptionId, approveUrl }`

**8. 新建 `app/api/paypal/activate-subscription/route.ts`**
- POST, 需登录, Body: `{ subscriptionId }`
- → 幂等检查 → 查询 PayPal 订阅状态
- → setSubscription + createSubscriptionRecord + createTransaction → 返回成功

**9. 新建 `app/api/paypal/webhook/route.ts`**
- POST, 无需登录
- 验证签名 → 处理事件:
  - `BILLING.SUBSCRIPTION.ACTIVATED` — 新订阅激活 → 发放配额
  - `BILLING.SUBSCRIPTION.RENEWED` — 月度续费 → 重置配额
  - `BILLING.SUBSCRIPTION.CANCELLED` — 取消订阅
  - `PAYMENT.CAPTURE.COMPLETED` — 按次支付完成（兜底）

### Phase 3: 前端

**10. 新建 `app/payment/return/page.tsx`** — PayPal 回调处理页
- 检测 URL 参数 `token` (order) 或 `subscription_id` (subscription)
- 自动调用对应 capture/activate API
- 成功 → `/profile?payment=success`
- 失败 → 错误提示 + 重试

**11. 新建 `app/payment/cancel/page.tsx`** — 取消页

**12. 修改 `app/pricing/pricing-client.tsx`**
- 价格显示改为 USD ($)
- 订阅按钮 → "Subscribe" → 调用 create-subscription API
- 按次按钮 → "Buy Now" → 调用 create-order API
- 添加 loading 状态和错误提示

**13. 修改 `app/profile/profile-client.tsx`**
- 检测 `?payment=success` → 显示成功横幅
- 横幅显示获得的配额和有效期

### Phase 4: 配置

**14. Cloudflare 环境变量**
```
PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.cn
```

## 关键文件

| 操作 | 文件 |
|------|------|
| 新建 | `lib/paypal.ts`, `migrations/0003_paypal_support.sql` |
| 新建 | `app/api/paypal/create-order/route.ts` |
| 新建 | `app/api/paypal/capture-order/route.ts` |
| 新建 | `app/api/paypal/create-subscription/route.ts` |
| 新建 | `app/api/paypal/activate-subscription/route.ts` |
| 新建 | `app/api/paypal/webhook/route.ts` |
| 新建 | `app/payment/return/page.tsx`, `app/payment/cancel/page.tsx` |
| 修改 | `lib/pricing.ts` — 增加 USD 字段 |
| 修改 | `lib/db-utils.ts` — paymentMethod 加 'paypal' |
| 修改 | `app/pricing/pricing-client.tsx` — 购买按钮改造 |
| 修改 | `app/profile/profile-client.tsx` — 成功提示 |

## 验证

1. `npm run dev` 启动本地
2. Cloudflare 配置 PayPal sandbox 凭证
3. 登录 → /pricing → 点击 Subscribe/Buy Now
4. PayPal sandbox 账号完成支付
5. 检查 /profile 配额更新
6. 检查 D1 paypal_orders/transactions 表
