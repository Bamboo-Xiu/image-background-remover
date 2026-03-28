import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { captureOrder } from '@/lib/paypal'
import { addPayPerUseQuota } from '@/lib/quota'
import { createTransaction, formatAmount } from '@/lib/db-utils'
import { PAY_PER_USE_OPTIONS } from '@/lib/pricing'

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

    const body = await req.json() as { orderId?: string }
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { error: '缺少订单ID', code: 'MISSING_ORDER_ID' },
        { status: 400 }
      )
    }

    const { env } = getRequestContext()
    const db = env.DB
    const userId = session.user.id

    // 查找本地订单记录
    const localOrder = await db.prepare(
      'SELECT * FROM paypal_orders WHERE order_id = ? AND user_id = ?'
    ).bind(orderId, userId).first<{
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
        { error: '订单不存在', code: 'ORDER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 幂等性：已完成的订单直接返回成功
    if (localOrder.status === 'completed') {
      return NextResponse.json({ success: true, quota: localOrder.quota, alreadyProcessed: true })
    }

    // 调用 PayPal 捕获订单
    const captureResult = await captureOrder(orderId)

    if (captureResult.status !== 'COMPLETED') {
      await db.prepare(
        "UPDATE paypal_orders SET status = 'failed' WHERE order_id = ?"
      ).bind(orderId).run()

      return NextResponse.json(
        { error: '支付未完成', code: 'PAYMENT_NOT_COMPLETED' },
        { status: 400 }
      )
    }

    // 验证金额
    const expectedAmount = String(localOrder.amount)
    if (captureResult.amount !== expectedAmount) {
      await db.prepare(
        "UPDATE paypal_orders SET status = 'failed' WHERE order_id = ?"
      ).bind(orderId).run()

      return NextResponse.json(
        { error: '支付金额不匹配', code: 'AMOUNT_MISMATCH' },
        { status: 400 }
      )
    }

    // 发放按次购买配额
    await addPayPerUseQuota(db, userId, localOrder.quota)

    // 记录交易
    const plan = PAY_PER_USE_OPTIONS[localOrder.plan_key as keyof typeof PAY_PER_USE_OPTIONS]
    await createTransaction(
      db, userId, 'pay_per_use',
      Math.round(localOrder.amount * 100), // 转为分存储
      localOrder.quota, 'paypal', orderId
    )

    // 更新 paypal_orders 状态
    await db.prepare(
      "UPDATE paypal_orders SET status = 'completed', completed_at = ? WHERE order_id = ?"
    ).bind(new Date().toISOString(), orderId).run()

    return NextResponse.json({
      success: true,
      quota: localOrder.quota,
      planName: plan?.name,
    })
  } catch (e) {
    return NextResponse.json(
      { error: `处理订单失败: ${e instanceof Error ? e.message : String(e)}`, code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
