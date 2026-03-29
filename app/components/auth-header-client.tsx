'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import Link from 'next/link'

interface QuotaStatus {
  remaining: number
  breakdown: {
    free: { remaining: number }
    subscription: { remaining: number }
    payPerUse: { remaining: number }
  }
}

function QuotaBadge() {
  const { data: session } = useSession()
  const [quota, setQuota] = useState<QuotaStatus | null>(null)

  useEffect(() => {
    if (session?.user) {
      fetch('/api/quota')
        .then(res => res.json())
        .then(data => {
          if (data && typeof data === 'object' && 'remaining' in data) {
            setQuota(data as QuotaStatus)
          }
        })
        .catch(() => {})
    }
  }, [session])

  if (!session?.user || !quota) return null

  return (
    <Link
      href="/profile"
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-subtle hover:border-border-default transition-all text-sm"
    >
      <span className="text-text-muted">剩余</span>
      <span className={`font-semibold tabular-nums ${quota.remaining > 0 ? 'text-success' : 'text-error'}`}>
        {quota.remaining}
      </span>
    </Link>
  )
}

export function AuthHeader() {
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="flex items-center gap-3" />
  }

  if (status === 'loading') {
    return <div className="flex items-center gap-3 text-sm text-text-muted">加载中...</div>
  }

  return (
    <div className="flex items-center gap-3">
      {session?.user ? (
        <>
          <QuotaBadge />
          <Link
            href="/profile"
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-bg-hover transition-colors"
          >
            {session.user.image && (
              <img
                src={session.user.image}
                alt="Avatar"
                className="w-7 h-7 rounded-full ring-2 ring-border-subtle"
              />
            )}
            <span className="text-sm text-text-secondary hidden sm:inline">{session.user.name}</span>
          </Link>
          <button
            onClick={() => signOut()}
            className="px-3 py-1.5 text-xs text-text-muted hover:text-text-primary rounded-lg hover:bg-bg-hover transition-all"
          >
            登出
          </button>
        </>
      ) : (
        <button
          onClick={() => signIn('google')}
          className="btn-accent text-xs px-4 py-2"
        >
          Google 登录
        </button>
      )}
    </div>
  )
}
