'use client'

import { Session } from 'next-auth'
import { signIn, signOut } from 'next-auth/react'

export function AuthHeader({ session }: { session: Session | null }) {
  return (
    <div className="flex items-center gap-4">
      {session?.user ? (
        <>
          <div className="flex items-center gap-2">
            {session.user.image && (
              <img
                src={session.user.image}
                alt="Avatar"
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="text-sm text-gray-700">{session.user.name}</span>
          </div>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            登出
          </button>
        </>
      ) : (
        <button
          onClick={() => signIn("google")}
          className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Google 登录
        </button>
      )}
    </div>
  )
}
