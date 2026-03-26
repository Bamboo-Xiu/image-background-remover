// 配额管理工具

import { FREE_QUOTA, SUBSCRIPTION_DURATION_DAYS, SUBSCRIPTION_PLANS, type SubscriptionTier } from './pricing'

export interface UserQuota {
  id: string
  user_id: string
  free_quota: number
  free_used: number
  subscription_tier: string | null
  subscription_quota: number
  subscription_used: number
  subscription_expires_at: string | null
  pay_per_use_quota: number
  can_hd_output: number
  can_batch_process: number
  created_at: string
  updated_at: string
}

export interface QuotaStatus {
  total: number
  used: number
  remaining: number
  breakdown: {
    free: { total: number; used: number; remaining: number }
    subscription: { total: number; used: number; remaining: number; expiresAt: string | null; tier: string | null }
    payPerUse: { total: number; remaining: number }
  }
  features: {
    hdOutput: boolean
    batchProcess: boolean
  }
}

// 获取或创建用户配额记录
export async function getOrCreateUserQuota(db: D1Database, userId: string): Promise<UserQuota> {
  const existing = await db.prepare(
    'SELECT * FROM user_quotas WHERE user_id = ?'
  ).bind(userId).first<UserQuota>()

  if (existing) return existing

  // 创建新用户配额
  const id = crypto.randomUUID()
  await db.prepare(
    `INSERT INTO user_quotas
     (id, user_id, free_quota, free_used, subscription_quota, subscription_used, pay_per_use_quota)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, userId, FREE_QUOTA, 0, 0, 0, 0).run()

  return {
    id,
    user_id: userId,
    free_quota: FREE_QUOTA,
    free_used: 0,
    subscription_tier: null,
    subscription_quota: 0,
    subscription_used: 0,
    subscription_expires_at: null,
    pay_per_use_quota: 0,
    can_hd_output: 0,
    can_batch_process: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

// 检查并更新订阅状态（过期处理）
export async function checkSubscriptionStatus(db: D1Database, quota: UserQuota): Promise<UserQuota> {
  if (!quota.subscription_expires_at) return quota

  const now = new Date()
  const expiresAt = new Date(quota.subscription_expires_at)

  if (now >= expiresAt) {
    // 订阅已过期，重置订阅配额
    await db.prepare(
      `UPDATE user_quotas
       SET subscription_tier = NULL,
           subscription_quota = 0,
           subscription_used = 0,
           subscription_expires_at = NULL,
           can_hd_output = 0,
           can_batch_process = 0,
           updated_at = ?
       WHERE id = ?`
    ).bind(new Date().toISOString(), quota.id).run()

    return {
      ...quota,
      subscription_tier: null,
      subscription_quota: 0,
      subscription_used: 0,
      subscription_expires_at: null,
      can_hd_output: 0,
      can_batch_process: 0,
    }
  }

  return quota
}

// 获取用户配额状态
export async function getQuotaStatus(db: D1Database, userId: string): Promise<QuotaStatus> {
  let quota = await getOrCreateUserQuota(db, userId)
  quota = await checkSubscriptionStatus(db, quota)

  const freeRemaining = Math.max(0, quota.free_quota - quota.free_used)
  const subscriptionRemaining = Math.max(0, quota.subscription_quota - quota.subscription_used)
  const totalRemaining = freeRemaining + subscriptionRemaining + quota.pay_per_use_quota

  return {
    total: quota.free_quota + quota.subscription_quota + quota.pay_per_use_quota,
    used: quota.free_used + quota.subscription_used,
    remaining: totalRemaining,
    breakdown: {
      free: {
        total: quota.free_quota,
        used: quota.free_used,
        remaining: freeRemaining,
      },
      subscription: {
        total: quota.subscription_quota,
        used: quota.subscription_used,
        remaining: subscriptionRemaining,
        expiresAt: quota.subscription_expires_at,
        tier: quota.subscription_tier,
      },
      payPerUse: {
        total: quota.pay_per_use_quota,
        remaining: quota.pay_per_use_quota,
      },
    },
    features: {
      hdOutput: quota.can_hd_output === 1,
      batchProcess: quota.can_batch_process === 1,
    },
  }
}

// 检查用户是否有可用配额
export async function hasAvailableQuota(db: D1Database, userId: string): Promise<boolean> {
  const status = await getQuotaStatus(db, userId)
  return status.remaining > 0
}

// 消耗一次配额（按优先级：免费 > 订阅 > 按次）
export async function consumeQuota(
  db: D1Database,
  userId: string
): Promise<{ success: boolean; quotaType: 'free' | 'subscription' | 'pay_per_use' | null }> {
  let quota = await getOrCreateUserQuota(db, userId)
  quota = await checkSubscriptionStatus(db, quota)

  // 优先使用免费配额
  if (quota.free_used < quota.free_quota) {
    await db.prepare(
      'UPDATE user_quotas SET free_used = free_used + 1, updated_at = ? WHERE id = ?'
    ).bind(new Date().toISOString(), quota.id).run()
    return { success: true, quotaType: 'free' }
  }

  // 其次使用订阅配额
  if (quota.subscription_used < quota.subscription_quota) {
    await db.prepare(
      'UPDATE user_quotas SET subscription_used = subscription_used + 1, updated_at = ? WHERE id = ?'
    ).bind(new Date().toISOString(), quota.id).run()
    return { success: true, quotaType: 'subscription' }
  }

  // 最后使用按次配额
  if (quota.pay_per_use_quota > 0) {
    await db.prepare(
      'UPDATE user_quotas SET pay_per_use_quota = pay_per_use_quota - 1, updated_at = ? WHERE id = ?'
    ).bind(new Date().toISOString(), quota.id).run()
    return { success: true, quotaType: 'pay_per_use' }
  }

  return { success: false, quotaType: null }
}

// 添加按次配额
export async function addPayPerUseQuota(db: D1Database, userId: string, amount: number): Promise<void> {
  const quota = await getOrCreateUserQuota(db, userId)
  await db.prepare(
    'UPDATE user_quotas SET pay_per_use_quota = pay_per_use_quota + ?, updated_at = ? WHERE id = ?'
  ).bind(amount, new Date().toISOString(), quota.id).run()
}

// 设置订阅
export async function setSubscription(
  db: D1Database,
  userId: string,
  tier: SubscriptionTier
): Promise<void> {
  const plan = SUBSCRIPTION_PLANS[tier]
  const quota = await getOrCreateUserQuota(db, userId)

  const now = new Date()
  const expiresAt = new Date(now.getTime() + SUBSCRIPTION_DURATION_DAYS * 24 * 60 * 60 * 1000)

  const canHdOutput = tier === 'standard' || tier === 'professional' ? 1 : 0
  const canBatchProcess = tier === 'professional' ? 1 : 0

  await db.prepare(
    `UPDATE user_quotas
     SET subscription_tier = ?,
         subscription_quota = ?,
         subscription_used = 0,
         subscription_expires_at = ?,
         can_hd_output = ?,
         can_batch_process = ?,
         updated_at = ?
     WHERE id = ?`
  ).bind(
    tier,
    plan.quota,
    expiresAt.toISOString(),
    canHdOutput,
    canBatchProcess,
    new Date().toISOString(),
    quota.id
  ).run()
}
