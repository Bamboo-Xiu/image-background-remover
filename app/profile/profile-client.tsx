'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { formatBytes } from '@/lib/db-utils'

interface QuotaStatus {
  total: number
  used: number
  remaining: number
  breakdown: {
    free: { total: number; used: number; remaining: number }
    subscription: { total: number; used: number; remaining: number; expiresAt: string | null; tier: string | null }
    payPerUse: { total: number; remaining: number }
  }
  features: {
    hdOutput: boolean
    batchProcess: boolean
  }
}

interface UserStats {
  totalProcessed: number
  totalSizeSaved: number
  memberSince: string | null
}

interface HistoryItem {
  id: string
  quota_type: string
  original_filename: string
  original_size: number
  processed_size: number | null
  is_hd_output: number
  status: string
  error_message: string | null
  created_at: string
}

function ProfileContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [quota, setQuota] = useState<QuotaStatus | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [historyPage, setHistoryPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)

  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      setShowPaymentSuccess(true)
      // 清除 URL 参数
      router.replace('/profile')
    }
  }, [searchParams, router])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
      return
    }
    if (status === 'authenticated') {
      fetchData()
    }
  }, [status, router, historyPage])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [quotaRes, statsRes, historyRes] = await Promise.all([
        fetch('/api/quota'),
        fetch('/api/user/stats'),
        fetch(`/api/user/history?page=${historyPage}&limit=10`),
      ])

      if (quotaRes.ok) setQuota(await quotaRes.json() as QuotaStatus)
      if (statsRes.ok) setStats(await statsRes.json() as UserStats)
      if (historyRes.ok) {
        const historyData = await historyRes.json() as { history: HistoryItem[], pagination: { totalPages: number } }
        setHistory(historyData.history)
        setTotalPages(historyData.pagination.totalPages)
      }
    } catch (e) {
      console.error('Failed to fetch data:', e)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN')
  }

  const getQuotaTypeLabel = (type: string) => {
    switch (type) {
      case 'free': return '免费额度'
      case 'subscription': return '订阅额度'
      case 'pay_per_use': return '按次购买'
      default: return type
    }
  }

  const getTierLabel = (tier: string | null) => {
    switch (tier) {
      case 'light': return '轻量版'
      case 'standard': return '标准版'
      case 'professional': return '专业版'
      default: return null
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session?.user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-blue-500 hover:text-blue-600">
            <span className="text-xl">✂️</span>
            <span className="font-medium">Background Remover</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">定价</Link>
            <Link href="/faq" className="text-sm text-gray-600 hover:text-gray-900">常见问题</Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* 支付成功提示 */}
        {showPaymentSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-green-500 text-xl">&#9989;</span>
              <div>
                <p className="font-medium text-green-800">支付成功！</p>
                <p className="text-sm text-green-600">您的配额已更新，感谢您的购买。</p>
              </div>
            </div>
            <button
              onClick={() => setShowPaymentSuccess(false)}
              className="text-green-500 hover:text-green-700 text-lg"
            >
              &#10005;
            </button>
          </div>
        )}

        {/* 用户信息卡片 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            {session.user.image && (
              <img src={session.user.image} alt="Avatar" className="w-16 h-16 rounded-full" />
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{session.user.name}</h2>
              <p className="text-sm text-gray-500">{session.user.email}</p>
              {stats?.memberSince && (
                <p className="text-xs text-gray-400 mt-1">
                  加入于 {formatDate(stats.memberSince)}
                </p>
              )}
            </div>
            <button
              onClick={() => router.push('/pricing')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              购买额度
            </button>
          </div>
        </div>

        {/* 配额卡片 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">配额状态</h3>
          {quota && (
            <div className="space-y-4">
              {/* 总配额 */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">剩余配额</span>
                <span className="text-2xl font-bold text-blue-600">{quota.remaining} 次</span>
              </div>

              {/* 配额详情 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                {/* 免费配额 */}
                <div className="p-4 bg-green-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">免费额度</p>
                  <p className="text-xl font-bold text-green-600">
                    {quota.breakdown.free.remaining} / {quota.breakdown.free.total}
                  </p>
                </div>

                {/* 订阅配额 */}
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">
                    订阅额度
                    {quota.breakdown.subscription.tier && (
                      <span className="ml-1 text-blue-600">({getTierLabel(quota.breakdown.subscription.tier)})</span>
                    )}
                  </p>
                  <p className="text-xl font-bold text-blue-600">
                    {quota.breakdown.subscription.remaining} / {quota.breakdown.subscription.total}
                  </p>
                  {quota.breakdown.subscription.expiresAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      到期: {formatDate(quota.breakdown.subscription.expiresAt)}
                    </p>
                  )}
                </div>

                {/* 按次购买 */}
                <div className="p-4 bg-purple-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">按次购买</p>
                  <p className="text-xl font-bold text-purple-600">
                    {quota.breakdown.payPerUse.remaining}
                  </p>
                  <p className="text-xs text-gray-400">永不过期</p>
                </div>
              </div>

              {/* 功能权限 */}
              {(quota.features.hdOutput || quota.features.batchProcess) && (
                <div className="flex gap-4 pt-4 border-t border-gray-100">
                  {quota.features.hdOutput && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                      高清输出
                    </span>
                  )}
                  {quota.features.batchProcess && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                      批量处理
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 统计卡片 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">使用统计</h3>
          {stats && (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-3xl font-bold text-blue-600">{stats.totalProcessed}</p>
                <p className="text-sm text-gray-600 mt-1">累计处理图片</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <p className="text-3xl font-bold text-green-600">{formatBytes(stats.totalSizeSaved)}</p>
                <p className="text-sm text-gray-600 mt-1">节省空间</p>
              </div>
            </div>
          )}
        </div>

        {/* 历史记录 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">处理历史</h3>
          {history.length === 0 ? (
            <p className="text-center text-gray-400 py-8">暂无处理记录</p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={item.status === 'success' ? 'text-green-500' : 'text-red-500'}>
                      {item.status === 'success' ? '✅' : '❌'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.original_filename}</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(item.created_at)} · {getQuotaTypeLabel(item.quota_type)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{formatBytes(item.original_size)}</p>
                    {item.processed_size && (
                      <p className="text-xs text-green-500">→ {formatBytes(item.processed_size)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                disabled={historyPage === 1}
                className="px-3 py-1 rounded bg-gray-200 text-sm disabled:opacity-50"
              >
                上一页
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">{historyPage} / {totalPages}</span>
              <button
                onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                disabled={historyPage === totalPages}
                className="px-3 py-1 rounded bg-gray-200 text-sm disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export function ProfileClient() {
  return (
    <SessionProvider>
      <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
        <ProfileContent />
      </Suspense>
    </SessionProvider>
  )
}
