'use client'

import { useState, useEffect } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SUBSCRIPTION_PLANS, PAY_PER_USE_OPTIONS, type SubscriptionTier, type PayPerUseOption } from '@/lib/pricing'

interface QuotaStatus {
  remaining: number
  breakdown: {
    free: { remaining: number }
    subscription: { remaining: number; tier: string | null }
    payPerUse: { remaining: number }
  }
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function PricingContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [quota, setQuota] = useState<QuotaStatus | null>(null)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/quota')
        .then(res => res.json())
        .then(data => {
          if (data && typeof data === 'object' && 'remaining' in data) {
            setQuota(data as QuotaStatus)
          }
        })
        .catch(() => {})
    }
  }, [status])

  const handleSubscribe = async (planKey: SubscriptionTier) => {
    if (status !== 'authenticated') {
      router.push('/')
      return
    }

    setLoadingPlan(`sub-${planKey}`)
    setError(null)

    try {
      const res = await fetch('/api/paypal/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey }),
      })

      const data = await res.json() as { subscriptionId?: string; approveUrl?: string; error?: string }

      if (!res.ok || !data.approveUrl) {
        setError(data.error || '创建订阅失败')
        return
      }

      window.location.href = data.approveUrl
    } catch (e) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoadingPlan(null)
    }
  }

  const handleBuy = async (planKey: PayPerUseOption) => {
    if (status !== 'authenticated') {
      router.push('/')
      return
    }

    setLoadingPlan(`buy-${planKey}`)
    setError(null)

    try {
      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey }),
      })

      const data = await res.json() as { orderId?: string; approveUrl?: string; error?: string }

      if (!res.ok || !data.approveUrl) {
        setError(data.error || '创建订单失败')
        return
      }

      window.location.href = data.approveUrl
    } catch (e) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="ambient-glow" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg-secondary/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-start to-accent-end flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" />
                <line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" />
              </svg>
            </div>
            <span className="font-[family-name:var(--font-sora)] font-semibold text-sm text-foreground">BG Remover</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/faq" className="text-xs text-text-secondary hover:text-foreground transition-colors">常见问题</Link>
            {session ? (
              <Link href="/profile" className="text-xs text-accent-start hover:text-accent-end transition-colors">个人中心</Link>
            ) : (
              <button
                onClick={() => router.push('/')}
                className="btn-accent text-xs px-4 py-2"
              >
                登录
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-16 relative z-10">
        {/* Title */}
        <div className="text-center mb-14 animate-fade-in-up">
          <h1 className="font-[family-name:var(--font-sora)] text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            选择适合您的方案
          </h1>
          <p className="text-text-secondary text-base">
            新用户注册即送 <span className="gradient-text font-semibold">5 次免费</span> 处理额度
          </p>
          {quota && quota.remaining > 0 && (
            <p className="mt-3 text-sm text-success">
              当前剩余 <span className="font-semibold">{quota.remaining}</span> 次处理额度
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 toast toast-error text-center animate-fade-in">
            {error}
          </div>
        )}

        {/* Subscription Plans */}
        <div className="mb-20">
          <h2 className="font-[family-name:var(--font-sora)] text-xl font-bold text-center mb-8 text-foreground">
            月度订阅
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan], index) => (
              <div
                key={key}
                className={`rounded-2xl p-7 transition-all duration-300 animate-fade-in-up stagger-${index + 1} ${
                  key === 'standard'
                    ? 'gradient-border featured ring-1 ring-accent-start/20'
                    : 'bg-bg-card border border-border-subtle hover:border-border-default'
                }`}
              >
                {key === 'standard' && (
                  <div className="inline-block px-3 py-1 bg-accent-start/10 text-accent-start text-[11px] font-semibold rounded-full mb-4 font-[family-name:var(--font-sora)] uppercase tracking-wider">
                    Popular
                  </div>
                )}
                <h3 className="font-[family-name:var(--font-sora)] text-lg font-bold text-foreground">{plan.name}</h3>
                <div className="mt-5 mb-3">
                  <span className="font-[family-name:var(--font-sora)] text-4xl font-bold text-foreground">${plan.priceUSD}</span>
                  <span className="text-text-muted text-sm ml-1">/月</span>
                </div>
                <p className="font-[family-name:var(--font-sora)] text-xl font-semibold gradient-text mb-6">
                  {plan.quota} 次
                  <span className="text-xs text-text-muted font-normal ml-2">
                    ${plan.unitPriceUSD}/次
                  </span>
                </p>
                <ul className="space-y-3 mb-7">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-text-secondary">
                      <span className="text-success flex-shrink-0"><CheckIcon /></span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(key as SubscriptionTier)}
                  disabled={loadingPlan === `sub-${key}`}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    key === 'standard'
                      ? 'btn-accent'
                      : 'bg-bg-hover text-foreground border border-border-default hover:bg-bg-elevated hover:border-border-strong'
                  }`}
                >
                  {loadingPlan === `sub-${key}` ? (
                    <>
                      <span className="spinner w-4 h-4 !border-2" />
                      处理中...
                    </>
                  ) : (
                    'Subscribe Now'
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Pay Per Use */}
        <div className="mb-20">
          <div className="text-center mb-8">
            <h2 className="font-[family-name:var(--font-sora)] text-xl font-bold text-foreground">按次购买</h2>
            <p className="text-text-muted text-sm mt-2">永不过期，用完再买</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {Object.entries(PAY_PER_USE_OPTIONS).map(([key, option], index) => (
              <div
                key={key}
                className={`bg-bg-card rounded-2xl p-6 border border-border-subtle text-center hover:border-border-default transition-all animate-fade-in-up stagger-${index + 1}`}
              >
                <h3 className="font-[family-name:var(--font-sora)] font-bold text-foreground">{option.name}</h3>
                <div className="mt-4 mb-3">
                  <span className="font-[family-name:var(--font-sora)] text-3xl font-bold text-foreground">${option.priceUSD}</span>
                </div>
                <p className="text-xs text-text-muted mb-5">
                  ${option.unitPriceUSD}/次
                </p>
                <button
                  onClick={() => handleBuy(key as PayPerUseOption)}
                  disabled={loadingPlan === `buy-${key}`}
                  className="w-full py-2.5 rounded-xl font-medium text-sm bg-bg-hover text-foreground border border-border-default hover:bg-bg-elevated hover:border-border-strong transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loadingPlan === `buy-${key}` ? (
                    <>
                      <span className="spinner w-4 h-4 !border-2" />
                      处理中...
                    </>
                  ) : (
                    'Buy Now'
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="glass-card p-8 max-w-3xl mx-auto animate-fade-in-up">
          <h2 className="font-[family-name:var(--font-sora)] text-lg font-bold text-foreground mb-6">与其他产品对比</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="text-left py-3 px-4 font-medium text-text-muted text-xs uppercase tracking-wider">产品</th>
                  <th className="text-left py-3 px-4 font-medium text-text-muted text-xs uppercase tracking-wider">单次价格</th>
                  <th className="text-left py-3 px-4 font-medium text-text-muted text-xs uppercase tracking-wider">订阅优惠</th>
                  <th className="text-left py-3 px-4 font-medium text-text-muted text-xs uppercase tracking-wider">优势</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                <tr className="hover:bg-bg-hover/50 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-foreground">Remove.bg</td>
                  <td className="py-3.5 px-4 text-text-secondary">~$0.20</td>
                  <td className="py-3.5 px-4 text-text-secondary">有</td>
                  <td className="py-3.5 px-4 text-success">便宜 2-5 倍</td>
                </tr>
                <tr className="hover:bg-bg-hover/50 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-foreground">Canva Pro</td>
                  <td className="py-3.5 px-4 text-text-secondary">$12.99/月</td>
                  <td className="py-3.5 px-4 text-text-secondary">-</td>
                  <td className="py-3.5 px-4 text-success">更便宜更专注</td>
                </tr>
                <tr className="hover:bg-bg-hover/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold gradient-text">我们</td>
                  <td className="py-3.5 px-4 gradient-text font-semibold">$0.04-0.15</td>
                  <td className="py-3.5 px-4 text-accent-start">有</td>
                  <td className="py-3.5 px-4 text-success">性价比最高</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Link */}
        <div className="text-center mt-12 animate-fade-in-up">
          <p className="text-text-muted text-sm">
            还有疑问？查看 <Link href="/faq" className="text-accent-start hover:underline">常见问题</Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export function PricingClient() {
  return (
    <SessionProvider>
      <PricingContent />
    </SessionProvider>
  )
}
