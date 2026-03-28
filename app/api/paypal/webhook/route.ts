import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { verifyWebhookSignature } from '@/lib/paypal'
import { setSubscription, addPayPerUseQuota } from '@/lib/quota'
import { createTransaction, createSubscriptionRecord } from '@/lib/db-utils'
import { SUBSCRIPTION_PLANS, PAY_PER_USE_OPTIONS } from '@/lib/pricing'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { env } = getRequestContext()
    const db = env.DB
    const webhookId = env.PAYPAL_WEBHOOK_ID

    const body = await req.text()
    const headers: Record<string, string> = {}
    req.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value
    })

    // 验证 Webhook 签名（如果配置了 webhookId）
    if (webhookId) {
      const isValid = await verifyWebhookSignature({ headers, body, webhookId })
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    }

    const event = JSON.parse(body) as {
      event_type: string
      resource: {
        id: string
        status: string
        amount?: { value: string; currency_code: string }
        billing_agreement_id?: string
        // Subscription fields
        plan_id?: string
        start_time?: string
      }
      // Link resource (for subscriptions)
      links?: Array<{ href: string; rel: string }>
    }

    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        // 按次支付完成（兜底）
        const orderId = event.resource.id
        const localOrder = await db.prepare(
          "SELECT * FROM paypal_orders WHERE order_id = ? AND status = 'pending'"
        ).bind(orderId).first<{
          order_id: string
          user_id: string
          type: string
          plan_key: string
          amount: number
          quota: number
          status: string
        }>()

        if (localOrder) {
          if (localOrder.type === 'pay_per_use') {
            await addPayPerUseQuota(db, localOrder.user_id, localOrder.quota)
          }

          await createTransaction(
            db, localOrder.user_id, localOrder.type as 'subscription' | 'pay_per_use',
            Math.round(localOrder.amount * 100),
            localOrder.quota, 'paypal', orderId
          )

          await db.prepare(
            "UPDATE paypal_orders SET status = 'completed', completed_at = ? WHERE order_id = ?"
          ).bind(new Date().toISOString(), orderId).run()
        }
        break
      }

      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        // 新订阅激活或续费
        const subscriptionId = event.resource.id

        const localOrder = await db.prepare(
          'SELECT * FROM paypal_orders WHERE order_id = ?'
        ).bind(subscriptionId).first<{
          order_id: string
          user_id: string
          type: string
          plan_key: string
          amount: number
          quota: number
          status: string
        }>()

        if (localOrder && localOrder.status !== 'completed') {
          const planKey = localOrder.plan_key as keyof typeof SUBSCRIPTION_PLANS

          await setSubscription(db, localOrder.user_id, planKey)
          await createSubscriptionRecord(
            db, localOrder.user_id, planKey,
            Math.round(localOrder.amount * 100),
            localOrder.quota
          )
          await createTransaction(
            db, localOrder.user_id, 'subscription',
            Math.round(localOrder.amount * 100),
            localOrder.quota, 'paypal', subscriptionId
          )

          await db.prepare(
            `UPDATE subscriptions SET paypal_subscription_id = ? WHERE user_id = ? AND status = 'active'`
          ).bind(subscriptionId, localOrder.user_id).run()

          await db.prepare(
            "UPDATE paypal_orders SET status = 'completed', completed_at = ? WHERE order_id = ?"
          ).bind(new Date().toISOString(), subscriptionId).run()
        }
        break
      }

      case 'BILLING.SUBSCRIPTION.RENEWED': {
        // 月度续费：重置配额
        const subscriptionId = event.resource.id

        // 通过 paypal_subscription_id 查找用户和订阅信息
        const subRecord = await db.prepare(
          "SELECT * FROM subscriptions WHERE paypal_subscription_id = ? AND status = 'active'"
        ).bind(subscriptionId).first<{
          id: string
          user_id: string
          tier: string
          price: number
          quota: number
        }>()

        if (subRecord) {
          const planKey = subRecord.tier as keyof typeof SUBSCRIPTION_PLANS
          const plan = SUBSCRIPTION_PLANS[planKey]

          // 重置订阅配额
          await setSubscription(db, subRecord.user_id, planKey)

          // 创建新的订阅记录
          await createSubscriptionRecord(
            db, subRecord.user_id, planKey,
            subRecord.price, plan.quota
          )

          // 记录交易
          await createTransaction(
            db, subRecord.user_id, 'subscription',
            subRecord.price, plan.quota, 'paypal',
            `${subscriptionId}-renewal-${Date.now()}`
          )

          // 创建新的 paypal_orders 记录用于跟踪
          await db.prepare(
            `INSERT INTO paypal_orders (order_id, user_id, type, plan_key, amount, quota, status)
             VALUES (?, ?, 'subscription', ?, ?, ?, 'completed')`
          ).bind(
            `${subscriptionId}-renewal-${Date.now()}`,
            subRecord.user_id, planKey,
            plan.priceUSD, plan.quota
          ).run()
        }
        break
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        const subscriptionId = event.resource.id
        // 标记订阅为取消
        await db.prepare(
          "UPDATE subscriptions SET status = 'cancelled' WHERE paypal_subscription_id = ?"
        ).bind(subscriptionId).run()
        break
      }

      default:
        console.log('Unhandled webhook event:', event.event_type)
    }

    return NextResponse.json({ received: true })
  } catch (e) {
    console.error('Webhook error:', e)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
