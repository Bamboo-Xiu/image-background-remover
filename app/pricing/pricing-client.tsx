'use client'

import { useState, useEffect } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SUBSCRIPTION_PLANS, PAY_PER_USE_OPTIONS } from '@/lib/pricing'

interface QuotaStatus {
  remaining: number
  breakdown: {
    free: { remaining: number }
    subscription: { remaining: number; tier: string | null }
    payPerUse: { remaining: number }
  }
}

function PricingContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [quota, setQuota] = useState<QuotaStatus | null>(null)

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-blue-500 hover:text-blue-600">
            <span className="text-xl">✂️</span>
            <span className="font-medium">Background Remover</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/faq" className="text-sm text-gray-600 hover:text-gray-900">常见问题</Link>
            {session ? (
              <Link href="/profile" className="text-sm text-blue-500 hover:text-blue-600">个人中心</Link>
            ) : (
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                登录
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">选择适合您的方案</h1>
          <p className="text-lg text-gray-600">
            新用户注册即送 <span className="text-blue-600 font-semibold">5 次免费</span> 处理额度
          </p>
          {quota && quota.remaining > 0 && (
            <p className="mt-2 text-sm text-green-600">
              您当前剩余 <span className="font-semibold">{quota.remaining}</span> 次处理额度
            </p>
          )}
        </div>

        {/* 订阅套餐 */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">月度订阅</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
              <div
                key={key}
                className={`bg-white rounded-2xl p-6 border-2 ${
                  key === 'standard' ? 'border-blue-500 shadow-lg relative' : 'border-gray-200'
                }`}
              >
                {key === 'standard' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                    最受欢迎
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold text-gray-900">¥{plan.priceYuan}</span>
                  <span className="text-gray-500">/月</span>
                </div>
                <p className="text-2xl font-semibold text-blue-600 mb-4">
                  {plan.quota} 次
                  <span className="text-sm text-gray-500 font-normal ml-2">
                    (¥{plan.unitPrice}/次)
                  </span>
                </p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-500">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-3 rounded-xl font-medium transition-colors bg-blue-500 text-white hover:bg-blue-600">
                  联系客服购买
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 按次购买 */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">按次购买</h2>
          <p className="text-center text-gray-500 mb-6">永不过期，用完再买</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {Object.entries(PAY_PER_USE_OPTIONS).map(([key, option]) => (
              <div
                key={key}
                className="bg-white rounded-2xl p-6 border border-gray-200 text-center"
              >
                <h3 className="text-lg font-bold text-gray-900">{option.name}</h3>
                <div className="mt-4 mb-4">
                  <span className="text-3xl font-bold text-gray-900">¥{option.priceYuan}</span>
                </div>
                <p className="text-sm text-gray-500">
                  ¥{option.unitPrice}/次
                </p>
                <button className="w-full mt-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200">
                  联系客服
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 对比表格 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">与其他产品对比</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">产品</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">单次价格</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">订阅优惠</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">我们的优势</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 px-4 font-medium">Remove.bg</td>
                  <td className="py-3 px-4">~¥1.4</td>
                  <td className="py-3 px-4">有</td>
                  <td className="py-3 px-4 text-green-600">便宜 3-5 倍</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">美图秀秀</td>
                  <td className="py-3 px-4">¥0.5-1</td>
                  <td className="py-3 px-4">有</td>
                  <td className="py-3 px-4 text-green-600">价格相当，体验更好</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-blue-600">我们</td>
                  <td className="py-3 px-4 text-blue-600 font-semibold">¥0.20-0.50</td>
                  <td className="py-3 px-4 text-blue-600">有</td>
                  <td className="py-3 px-4 text-green-600">性价比最高</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ 链接 */}
        <div className="text-center mt-12">
          <p className="text-gray-500">
            还有疑问？查看 <Link href="/faq" className="text-blue-500 hover:underline">常见问题</Link>
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
