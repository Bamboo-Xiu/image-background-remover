'use client'

import { useState, useEffect } from 'react'

export function AuthHeader() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render auth buttons until client-side hydration is complete
  // This prevents hydration mismatch and allows the app to work without auth configured
  if (!mounted) {
    return <div className="flex items-center gap-4" />
  }

  return (
    <div className="flex items-center gap-4">
      <button
        className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        onClick={() => {
          // For now, just show a message that auth is optional
          alert('登录功能暂未开放')
        }}
      >
        Google 登录
      </button>
    </div>
  )
}
