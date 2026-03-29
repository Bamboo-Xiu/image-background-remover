# Quota & Pricing System

## 配额类型

| 类型 | 说明 | 有效期 |
|------|------|--------|
| 免费配额 | 新用户 5 次，一次性 | 永久（用完即止） |
| 订阅配额 | 按月重置 | 30 天周期 |
| 按次购买 | 永不过期 | 永久 |

## 消耗优先级

**免费 → 订阅 → 按次购买**

逻辑实现在 `lib/quota.ts` 中。

## 订阅计划

| 计划 | 价格 | 月配额 | 特性 |
|------|------|--------|------|
| 轻量 (light) | ¥19.9 | 50 次 | 基础分辨率 |
| 标准 (standard) | ¥49.9 | 200 次 | HD 输出 + 优先队列 |
| 专业 (professional) | ¥99.9 | 500 次 | HD 输出 + 批量 + 支持 |

## 按次购买

| 套餐 | 价格 | 配额 |
|------|------|------|
| 小 (small) | ¥9.9 | 20 次 |
| 中 (medium) | ¥19.9 | 50 次 |
| 大 (large) | ¥29.9 | 100 次 |

## 订阅生命周期

1. 用户选择计划 → 创建 PayPal 订阅
2. PayPal 批准 → 激活订阅 → 写入 `subscriptions` 表
3. 每月自动续费 → Webhook `BILLING.SUBSCRIPTION.RENEWED` → 重置配额
4. 取消 → Webhook `BILLING.SUBSCRIPTION.CANCELLED` → 标记取消

## 配额检查流程

```
1. 检查免费配额 (free_total - free_used > 0)
2. 检查订阅配额 (未过期 + subscription_quota - subscription_used > 0)
3. 检查按次购买配额 (pay_per_use_quota > 0)
4. 全部为 0 → 返回 402 (配额不足)
```

## 配额重置

- 订阅配额在续费时自动重置（通过 Webhook）
- 免费配额不重置
- 按次购买配额不重置（只消耗）
