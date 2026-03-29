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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  if (!session?.user) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="ambient-glow" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg-secondary/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between h-14 px-5">
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
            <Link href="/pricing" className="text-xs text-text-secondary hover:text-foreground transition-colors">定价</Link>
            <Link href="/faq" className="text-xs text-text-secondary hover:text-foreground transition-colors">常见问题</Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 py-8 space-y-5 relative z-10">
        {/* Payment Success */}
        {showPaymentSuccess && (
          <div className="toast toast-success flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              <div>
                <p className="font-semibold text-sm">支付成功！</p>
                <p className="text-xs opacity-80">您的配额已更新，感谢购买。</p>
              </div>
            </div>
            <button onClick={() => setShowPaymentSuccess(false)} className="opacity-60 hover:opacity-100 text-lg">&times;</button>
          </div>
        )}

        {/* User Card */}
        <div className="glass-card p-6 animate-fade-in-up">
          <div className="flex items-center gap-5">
            {session.user.image && (
              <img src={session.user.image} alt="Avatar" className="w-14 h-14 rounded-full ring-2 ring-border-subtle" />
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-[family-name:var(--font-sora)] text-lg font-bold text-foreground truncate">{session.user.name}</h2>
              <p className="text-sm text-text-secondary truncate">{session.user.email}</p>
              {stats?.memberSince && (
                <p className="text-xs text-text-muted mt-0.5">加入于 {formatDate(stats.memberSince)}</p>
              )}
            </div>
            <button
              onClick={() => router.push('/pricing')}
              className="btn-accent text-xs px-4 py-2"
            >
              购买额度
            </button>
          </div>
        </div>

        {/* Quota Card */}
        <div className="glass-card p-6 animate-fade-in-up stagger-1">
          <h3 className="font-[family-name:var(--font-sora)] text-sm font-bold text-foreground mb-5 uppercase tracking-wider">配额状态</h3>
          {quota && (
            <div className="space-y-5">
              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-text-secondary text-sm">剩余配额</span>
                <span className="font-[family-name:var(--font-sora)] text-2xl font-bold gradient-text tabular-nums">
                  {quota.remaining} 次
                </span>
              </div>

              {/* Progress Bar */}
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${quota.total > 0 ? Math.max((quota.remaining / quota.total) * 100, 2) : 0}%` }}
                />
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {/* Free */}
                <div className="p-4 bg-bg-elevated rounded-xl border border-border-subtle">
                  <p className="text-xs text-text-muted mb-2">免费额度</p>
                  <p className="font-[family-name:var(--font-sora)] text-lg font-bold text-success tabular-nums">
                    {quota.breakdown.free.remaining}
                    <span className="text-xs text-text-muted font-normal"> / {quota.breakdown.free.total}</span>
                  </p>
                </div>

                {/* Subscription */}
                <div className="p-4 bg-bg-elevated rounded-xl border border-border-subtle">
                  <p className="text-xs text-text-muted mb-2">
                    订阅额度
                    {quota.breakdown.subscription.tier && (
                      <span className="text-accent-start ml-1">({getTierLabel(quota.breakdown.subscription.tier)})</span>
                    )}
                  </p>
                  <p className="font-[family-name:var(--font-sora)] text-lg font-bold text-accent-start tabular-nums">
                    {quota.breakdown.subscription.remaining}
                    <span className="text-xs text-text-muted font-normal"> / {quota.breakdown.subscription.total}</span>
                  </p>
                  {quota.breakdown.subscription.expiresAt && (
                    <p className="text-[11px] text-text-muted mt-1">
                      到期: {formatDate(quota.breakdown.subscription.expiresAt)}
                    </p>
                  )}
                </div>

                {/* Pay Per Use */}
                <div className="p-4 bg-bg-elevated rounded-xl border border-border-subtle">
                  <p className="text-xs text-text-muted mb-2">按次购买</p>
                  <p className="font-[family-name:var(--font-sora)] text-lg font-bold text-warning tabular-nums">
                    {quota.breakdown.payPerUse.remaining}
                  </p>
                  <p className="text-[11px] text-text-muted">永不过期</p>
                </div>
              </div>

              {/* Feature Tags */}
              {(quota.features.hdOutput || quota.features.batchProcess) && (
                <div className="flex gap-2 pt-1">
                  {quota.features.hdOutput && (
                    <span className="px-3 py-1 bg-accent-start/10 text-accent-start text-xs rounded-lg border border-accent-start/20 font-medium">
                      HD 高清输出
                    </span>
                  )}
                  {quota.features.batchProcess && (
                    <span className="px-3 py-1 bg-accent-end/10 text-accent-end text-xs rounded-lg border border-accent-end/20 font-medium">
                      批量处理
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats Card */}
        <div className="glass-card p-6 animate-fade-in-up stagger-2">
          <h3 className="font-[family-name:var(--font-sora)] text-sm font-bold text-foreground mb-5 uppercase tracking-wider">使用统计</h3>
          {stats && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-bg-elevated rounded-xl border border-border-subtle text-center">
                <p className="font-[family-name:var(--font-sora)] text-3xl font-bold gradient-text tabular-nums">{stats.totalProcessed}</p>
                <p className="text-xs text-text-muted mt-1.5">累计处理图片</p>
              </div>
              <div className="p-5 bg-bg-elevated rounded-xl border border-border-subtle text-center">
                <p className="font-[family-name:var(--font-sora)] text-3xl font-bold text-success tabular-nums">{formatBytes(stats.totalSizeSaved)}</p>
                <p className="text-xs text-text-muted mt-1.5">节省空间</p>
              </div>
            </div>
          )}
        </div>

        {/* History Card */}
        <div className="glass-card p-6 animate-fade-in-up stagger-3">
          <h3 className="font-[family-name:var(--font-sora)] text-sm font-bold text-foreground mb-5 uppercase tracking-wider">处理历史</h3>
          {history.length === 0 ? (
            <p className="text-center text-text-muted py-10 text-sm">暂无处理记录</p>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3.5 bg-bg-elevated rounded-xl border border-border-subtle hover:border-border-default transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${item.status === 'success' ? 'bg-success/10' : 'bg-error/10'}`}>
                      {item.status === 'success' ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.original_filename}</p>
                      <p className="text-[11px] text-text-muted">
                        {formatDate(item.created_at)} · {getQuotaTypeLabel(item.quota_type)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-xs text-text-secondary tabular-nums">{formatBytes(item.original_size)}</p>
                    {item.processed_size && (
                      <p className="text-[11px] text-success tabular-nums">&rarr; {formatBytes(item.processed_size)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-5">
              <button
                onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                disabled={historyPage === 1}
                className="px-3 py-1.5 rounded-lg bg-bg-hover text-xs text-text-secondary border border-border-subtle disabled:opacity-30 hover:border-border-default transition-all"
              >
                上一页
              </button>
              <span className="px-3 py-1.5 text-xs text-text-muted tabular-nums">{historyPage} / {totalPages}</span>
              <button
                onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                disabled={historyPage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-bg-hover text-xs text-text-secondary border border-border-subtle disabled:opacity-30 hover:border-border-default transition-all"
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
      <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="spinner" /></div>}>
        <ProfileContent />
      </Suspense>
    </SessionProvider>
  )
}
