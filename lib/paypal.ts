// PayPal API 封装（Edge Runtime 兼容，全用 fetch）

import { getRequestContext } from '@cloudflare/next-on-pages'

interface PayPalConfig {
  clientId: string
  clientSecret: string
  baseUrl: string
}

function getConfig(): PayPalConfig {
  const { env } = getRequestContext()
  return {
    clientId: env.PAYPAL_CLIENT_ID,
    clientSecret: env.PAYPAL_CLIENT_SECRET,
    baseUrl: env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.cn',
  }
}

// 获取 Access Token
export async function getAccessToken(): Promise<string> {
  const config = getConfig()
  const credentials = btoa(`${config.clientId}:${config.clientSecret}`)

  const res = await fetch(`${config.baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'en_US',
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PayPal auth failed: ${res.status} ${text}`)
  }

  const data = (await res.json()) as { access_token: string }
  return data.access_token
}

// 创建 PayPal Order（一次性支付）
export async function createOrder(params: {
  amount: string
  currency: string
  description: string
  returnUrl: string
  cancelUrl: string
}): Promise<{ id: string; approveLink: string }> {
  const config = getConfig()
  const accessToken = await getAccessToken()

  const res = await fetch(`${config.baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: params.currency,
            value: params.amount,
          },
          description: params.description,
        },
      ],
      application_context: {
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
        brand_name: 'Background Remover',
        user_action: 'PAY_NOW',
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PayPal create order failed: ${res.status} ${text}`)
  }

  const data = (await res.json()) as {
    id: string
    links: Array<{ rel: string; href: string }>
  }

  const approveLink = data.links.find((l) => l.rel === 'approve')?.href
  if (!approveLink) throw new Error('No approve link in PayPal response')

  return { id: data.id, approveLink }
}

// 捕获 PayPal Order
export async function captureOrder(orderId: string): Promise<{
  status: string
  captureId: string
  amount: string
  currency: string
}> {
  const config = getConfig()
  const accessToken = await getAccessToken()

  const res = await fetch(`${config.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PayPal capture failed: ${res.status} ${text}`)
  }

  const data = (await res.json()) as {
    status: string
    purchase_units: Array<{
      payments: {
        captures: Array<{
          id: string
          status: string
          amount: { value: string; currency_code: string }
        }>
      }
    }>
  }

  const capture = data.purchase_units[0]?.payments?.captures?.[0]
  if (!capture) throw new Error('No capture data in PayPal response')

  return {
    status: capture.status,
    captureId: capture.id,
    amount: capture.amount.value,
    currency: capture.amount.currency_code,
  }
}

// 创建 PayPal Product（订阅前提条件）
export async function createProduct(): Promise<string> {
  const config = getConfig()
  const accessToken = await getAccessToken()

  // 先尝试查找已存在的产品
  const listRes = await fetch(
    `${config.baseUrl}/v1/catalogs/products?page_size=10&page=1&total_required=true`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  if (listRes.ok) {
    const listData = (await listRes.json()) as {
      products: Array<{ id: string; name: string }>
    }
    const existing = listData.products?.find((p) => p.name === 'Background Remover Service')
    if (existing) return existing.id
  }

  const res = await fetch(`${config.baseUrl}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'PayPal-Request-Id': `product-bg-remover-${Date.now()}`,
    },
    body: JSON.stringify({
      name: 'Background Remover Service',
      description: 'AI-powered image background removal service',
      type: 'SERVICE',
      category: 'SOFTWARE',
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PayPal create product failed: ${res.status} ${text}`)
  }

  const data = (await res.json()) as { id: string }
  return data.id
}

// 创建 PayPal Billing Plan（订阅前提条件）
export async function createBillingPlan(params: {
  productId: string
  name: string
  amount: string
  currency: string
}): Promise<string> {
  const config = getConfig()
  const accessToken = await getAccessToken()

  // 先尝试查找已存在的 plan
  const listRes = await fetch(
    `${config.baseUrl}/v1/billing/plans?product_id=${params.productId}&page_size=20`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  if (listRes.ok) {
    const listData = (await listRes.json()) as {
      plans: Array<{ id: string; name: string; status: string }>
    }
    const existing = listData.plans?.find(
      (p) => p.name === params.name && p.status === 'ACTIVE'
    )
    if (existing) return existing.id
  }

  const res = await fetch(`${config.baseUrl}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'PayPal-Request-Id': `plan-${params.name.replace(/\s/g, '-')}-${Date.now()}`,
    },
    body: JSON.stringify({
      product_id: params.productId,
      name: params.name,
      description: `Monthly subscription: ${params.name}`,
      status: 'ACTIVE',
      billing_cycles: [
        {
          frequency: {
            interval_unit: 'MONTH',
            interval_count: 1,
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0, // 无限循环
          pricing_scheme: {
            fixed_price: {
              value: params.amount,
              currency_code: params.currency,
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: '0',
          currency_code: params.currency,
        },
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
      taxes: {
        percentage: '0',
        inclusive: false,
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PayPal create plan failed: ${res.status} ${text}`)
  }

  const data = (await res.json()) as { id: string }
  return data.id
}

// 创建 PayPal Subscription
export async function createSubscription(params: {
  planId: string
  returnUrl: string
  cancelUrl: string
}): Promise<{ id: string; approveLink: string }> {
  const config = getConfig()
  const accessToken = await getAccessToken()

  const res = await fetch(`${config.baseUrl}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'PayPal-Request-Id': `sub-${Date.now()}`,
    },
    body: JSON.stringify({
      plan_id: params.planId,
      application_context: {
        brand_name: 'Background Remover',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
        },
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PayPal create subscription failed: ${res.status} ${text}`)
  }

  const data = (await res.json()) as {
    id: string
    status: string
    links: Array<{ rel: string; href: string }>
  }

  const approveLink = data.links.find((l) => l.rel === 'approve')?.href
  if (!approveLink) throw new Error('No approve link in PayPal subscription response')

  return { id: data.id, approveLink }
}

// 获取 PayPal Subscription 详情
export async function getSubscriptionDetails(subscriptionId: string): Promise<{
  id: string
  status: string
  plan_id: string
  start_time: string
  billing_info: {
    next_billing_time: string
    cycle_executions: Array<{
      tenure_type: string
      sequence: number
      cycles_completed: number
    }>
  }
}> {
  const config = getConfig()
  const accessToken = await getAccessToken()

  const res = await fetch(`${config.baseUrl}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PayPal get subscription failed: ${res.status} ${text}`)
  }

  return (await res.json()) as ReturnType<typeof getSubscriptionDetails> extends Promise<infer T> ? T : never
}

// 验证 Webhook 签名
export async function verifyWebhookSignature(params: {
  headers: Record<string, string>
  body: string
  webhookId: string
}): Promise<boolean> {
  const config = getConfig()
  const accessToken = await getAccessToken()

  const res = await fetch(`${config.baseUrl}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      webhook_id: params.webhookId,
      webhook_event: JSON.parse(params.body),
      auth_algo: params.headers['paypal-auth-algo'] || params.headers['PAYPAL-AUTH-ALGO'],
      cert_url: params.headers['paypal-cert-url'] || params.headers['PAYPAL-CERT-URL'],
      transmission_id: params.headers['paypal-transmission-id'] || params.headers['PAYPAL-TRANSMISSION-ID'],
      transmission_sig: params.headers['paypal-transmission-sig'] || params.headers['PAYPAL-TRANSMISSION-SIG'],
      transmission_time: params.headers['paypal-transmission-time'] || params.headers['PAYPAL-TRANSMISSION-TIME'],
    }),
  })

  if (!res.ok) {
    console.error('Webhook verification request failed:', res.status)
    return false
  }

  const data = (await res.json()) as { verification_status: string }
  return data.verification_status === 'SUCCESS'
}
