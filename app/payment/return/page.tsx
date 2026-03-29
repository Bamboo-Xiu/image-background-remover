'use client'

import { useState, useEffect, Suspense } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function PaymentReturnContent() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [processing, setProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    success: boolean
    quota?: number
    planName?: string
    tier?: string
  } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
      return
    }
    if (status !== 'authenticated') return

    processPayment()
  }, [status, router])

  const processPayment = async () => {
    const token = searchParams.get('token')
    const subscriptionId = searchParams.get('subscription_id') || searchParams.get('ba_token')

    if (subscriptionId) {
      try {
        const res = await fetch('/api/paypal/activate-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscriptionId }),
        })

        const data = await res.json() as {
          success?: boolean
          quota?: number
          planName?: string
          tier?: string
          error?: string
        }

        if (res.ok && data.success) {
          setResult({ success: true, quota: data.quota, planName: data.planName, tier: data.tier })
          setTimeout(() => {
            router.push('/profile?payment=success')
          }, 2000)
        } else {
          setError(data.error || '激活订阅失败')
        }
      } catch (e) {
        setError('网络错误，请稍后重试')
      } finally {
        setProcessing(false)
      }
    } else if (token) {
      try {
        const res = await fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: token }),
        })

        const data = await res.json() as {
          success?: boolean
          quota?: number
          planName?: string
          error?: string
        }

        if (res.ok && data.success) {
          setResult({ success: true, quota: data.quota, planName: data.planName })
          setTimeout(() => {
            router.push('/profile?payment=success')
          }, 2000)
        } else {
          setError(data.error || '捕获订单失败')
        }
      } catch (e) {
        setError('网络错误，请稍后重试')
      } finally {
        setProcessing(false)
      }
    } else {
      setError('缺少支付参数')
      setProcessing(false)
    }
  }

  if (status === 'loading' || processing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="ambient-glow" />
        <div className="text-center relative z-10 animate-fade-in">
          <div className="spinner mx-auto mb-5" />
          <h1 className="font-[family-name:var(--font-sora)] text-lg font-semibold text-foreground">正在处理支付结果...</h1>
          <p className="text-text-muted text-sm mt-2">请稍候</p>
        </div>
      </div>
    )
  }

  if (result?.success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="ambient-glow" />
        <div className="max-w-md w-full glass-card p-10 text-center relative z-10 animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-bold text-success mb-3">支付成功！</h1>
          {result.quota && (
            <p className="text-text-secondary mb-2">
              已获得 <span className="font-semibold gradient-text">{result.quota}</span> 次处理额度
            </p>
          )}
          {result.planName && (
            <p className="text-text-muted text-sm mb-4">{result.planName}</p>
          )}
          <p className="text-xs text-text-muted">正在跳转到个人中心...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="ambient-glow" />
        <div className="max-w-md w-full glass-card p-10 text-center relative z-10 animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center mx-auto mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-bold text-error mb-3">支付处理异常</h1>
          <p className="text-text-secondary text-sm mb-7">{error}</p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/pricing"
              className="btn-accent text-sm"
            >
              返回定价页面
            </Link>
            <Link
              href="/profile"
              className="btn-ghost text-sm"
            >
              个人中心
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default function PaymentReturnPage() {
  return (
    <SessionProvider>
      <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="spinner" /></div>}>
        <PaymentReturnContent />
      </Suspense>
    </SessionProvider>
  )
}
