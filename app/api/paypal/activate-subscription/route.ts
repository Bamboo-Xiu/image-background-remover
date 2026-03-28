import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { getSubscriptionDetails } from '@/lib/paypal'
import { setSubscription } from '@/lib/quota'
import { createTransaction, createSubscriptionRecord } from '@/lib/db-utils'
import { SUBSCRIPTION_PLANS } from '@/lib/pricing'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '请先登录', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const body = await req.json() as { subscriptionId?: string }
    const { subscriptionId } = body

    if (!subscriptionId) {
      return NextResponse.json(
        { error: '缺少订阅ID', code: 'MISSING_SUBSCRIPTION_ID' },
        { status: 400 }
      )
    }

    const { env } = getRequestContext()
    const db = env.DB
    const userId = session.user.id

    // 查找本地订单记录
    const localOrder = await db.prepare(
      'SELECT * FROM paypal_orders WHERE order_id = ? AND user_id = ?'
    ).bind(subscriptionId, userId).first<{
      order_id: string
      user_id: string
      type: string
      plan_key: string
      amount: number
      quota: number
      status: string
    }>()

    if (!localOrder) {
      return NextResponse.json(
        { error: '订阅记录不存在', code: 'ORDER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 幂等性：已完成的订单直接返回成功
    if (localOrder.status === 'completed') {
      return NextResponse.json({ success: true, quota: localOrder.quota, alreadyProcessed: true })
    }

    // 查询 PayPal 订阅状态
    const subscription = await getSubscriptionDetails(subscriptionId)

    const activeStatuses = ['ACTIVE', 'APPROVED']
    if (!activeStatuses.includes(subscription.status)) {
      return NextResponse.json(
        { error: `订阅状态异常: ${subscription.status}`, code: 'SUBSCRIPTION_NOT_ACTIVE' },
        { status: 400 }
      )
    }

    const plan = SUBSCRIPTION_PLANS[localOrder.plan_key as keyof typeof SUBSCRIPTION_PLANS]

    // 发放订阅配额
    await setSubscription(db, userId, localOrder.plan_key as keyof typeof SUBSCRIPTION_PLANS)

    // 创建订阅记录
    await createSubscriptionRecord(
      db, userId, localOrder.plan_key,
      Math.round(localOrder.amount * 100), // 转为分存储
      localOrder.quota
    )

    // 记录交易
    await createTransaction(
      db, userId, 'subscription',
      Math.round(localOrder.amount * 100),
      localOrder.quota, 'paypal', subscriptionId
    )

    // 更新 subscriptions 表的 paypal_subscription_id
    await db.prepare(
      `UPDATE subscriptions SET paypal_subscription_id = ? WHERE user_id = ? AND status = 'active'`
    ).bind(subscriptionId, userId).run()

    // 更新 paypal_orders 状态
    await db.prepare(
      "UPDATE paypal_orders SET status = 'completed', completed_at = ? WHERE order_id = ?"
    ).bind(new Date().toISOString(), subscriptionId).run()

    return NextResponse.json({
      success: true,
      quota: localOrder.quota,
      planName: plan?.name,
      tier: localOrder.plan_key,
    })
  } catch (e) {
    return NextResponse.json(
      { error: `激活订阅失败: ${e instanceof Error ? e.message : String(e)}`, code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
