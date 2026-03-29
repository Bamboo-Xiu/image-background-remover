import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { createProduct, createBillingPlan, createSubscription } from '@/lib/paypal'
import { SUBSCRIPTION_PLANS, type SubscriptionTier } from '@/lib/pricing'

export const runtime = 'edge'

const VALID_KEYS = Object.keys(SUBSCRIPTION_PLANS) as SubscriptionTier[]

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '请先登录', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const body = await req.json() as { planKey?: string }
    const { planKey } = body

    if (!planKey || !VALID_KEYS.includes(planKey as SubscriptionTier)) {
      return NextResponse.json(
        { error: '无效的订阅方案', code: 'INVALID_PLAN' },
        { status: 400 }
      )
    }

    const plan = SUBSCRIPTION_PLANS[planKey as SubscriptionTier]
    const { env } = getRequestContext()
    const db = env.DB
    const userId = session.user.id

    const appUrl = env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin

    // 1. 创建/获取 PayPal Product
    const productId = await createProduct()

    // 2. 创建/获取 Billing Plan
    const planName = `Background Remover - ${plan.name} (Monthly)`
    const billingPlanId = await createBillingPlan({
      productId,
      name: planName,
      amount: String(plan.priceUSD),
      currency: 'USD',
    })

    // 3. 创建 PayPal Subscription
    const returnUrl = `${appUrl}/payment/return`
    const result = await createSubscription({
      planId: billingPlanId,
      returnUrl,
      cancelUrl: `${appUrl}/payment/cancel`,
    })

    // 4. 写入 paypal_orders 表
    await db.prepare(
      `INSERT INTO paypal_orders (order_id, user_id, type, plan_key, amount, quota, status)
       VALUES (?, ?, 'subscription', ?, ?, ?, 'pending')`
    ).bind(result.id, userId, planKey, plan.priceUSD, plan.quota).run()

    return NextResponse.json({
      subscriptionId: result.id,
      approveUrl: result.approveLink,
    })
  } catch (e) {
    return NextResponse.json(
      { error: `创建订阅失败: ${e instanceof Error ? e.message : String(e)}`, code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
