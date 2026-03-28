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
      // 订阅回调
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
      // 一次性支付回调
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900">正在处理支付结果...</h1>
          <p className="text-gray-500 mt-2">请稍候</p>
        </div>
      </div>
    )
  }

  if (result?.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-sm border border-gray-200 text-center">
          <div className="text-5xl mb-4">&#9989;</div>
          <h1 className="text-2xl font-bold text-green-600 mb-2">支付成功！</h1>
          {result.quota && (
            <p className="text-gray-600 mb-2">
              已获得 <span className="font-semibold text-blue-600">{result.quota}</span> 次处理额度
            </p>
          )}
          {result.planName && (
            <p className="text-gray-500 text-sm mb-4">{result.planName}</p>
          )}
          <p className="text-sm text-gray-400">正在跳转到个人中心...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-sm border border-gray-200 text-center">
          <div className="text-5xl mb-4">&#9888;&#65039;</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">支付处理异常</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/pricing"
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              返回定价页面
            </Link>
            <Link
              href="/profile"
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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
      <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
        <PaymentReturnContent />
      </Suspense>
    </SessionProvider>
  )
}
