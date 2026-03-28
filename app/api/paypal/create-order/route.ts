import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { createOrder } from '@/lib/paypal'
import { PAY_PER_USE_OPTIONS, type PayPerUseOption } from '@/lib/pricing'

export const runtime = 'edge'

const VALID_KEYS = Object.keys(PAY_PER_USE_OPTIONS) as PayPerUseOption[]

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

    if (!planKey || !VALID_KEYS.includes(planKey as PayPerUseOption)) {
      return NextResponse.json(
        { error: '无效的购买方案', code: 'INVALID_PLAN' },
        { status: 400 }
      )
    }

    const plan = PAY_PER_USE_OPTIONS[planKey as PayPerUseOption]
    const { env } = getRequestContext()
    const db = env.DB
    const userId = session.user.id

    const appUrl = env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin

    const result = await createOrder({
      amount: String(plan.priceUSD),
      currency: 'USD',
      description: `Background Remover - ${plan.name} (${plan.quota} credits)`,
      returnUrl: `${appUrl}/payment/return`,
      cancelUrl: `${appUrl}/payment/cancel`,
    })

    // 写入 paypal_orders 表
    await db.prepare(
      `INSERT INTO paypal_orders (order_id, user_id, type, plan_key, amount, quota, status)
       VALUES (?, ?, 'pay_per_use', ?, ?, ?, 'pending')`
    ).bind(result.id, userId, planKey, plan.priceUSD, plan.quota).run()

    return NextResponse.json({
      orderId: result.id,
      approveUrl: result.approveLink,
    })
  } catch (e) {
    return NextResponse.json(
      { error: `创建订单失败: ${e instanceof Error ? e.message : String(e)}`, code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
