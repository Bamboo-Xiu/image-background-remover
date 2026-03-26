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
    <Link href="/profile" className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity">
      <span className="text-gray-500">剩余:</span>
      <span className={`font-medium ${quota.remaining > 0 ? 'text-green-600' : 'text-red-500'}`}>
        {quota.remaining} 次
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

  // 不在服务器端渲染时显示登录状态，避免水合不匹配
  if (!mounted) {
    return <div className="flex items-center gap-4" />
  }

  if (status === 'loading') {
    return <div className="flex items-center gap-4 text-sm text-gray-400">加载中...</div>
  }

  return (
    <div className="flex items-center gap-4">
      {session?.user ? (
        <>
          <QuotaBadge />
          <Link
            href="/profile"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {session.user.image && (
              <img
                src={session.user.image}
                alt="Avatar"
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="text-sm text-gray-700 hidden sm:inline">{session.user.name}</span>
          </Link>
          <button
            onClick={() => signOut()}
            className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            登出
          </button>
        </>
      ) : (
        <button
          onClick={() => signIn('google')}
          className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Google 登录
        </button>
      )}
    </div>
  )
}
