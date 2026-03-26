import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { getUserStats } from '@/lib/db-utils'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req })
    if (!token) {
      return NextResponse.json(
        { error: '请先登录', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const { env } = getRequestContext()
    const db = env.DB
    const userId = token.sub as string

    const stats = await getUserStats(db, userId)

    return NextResponse.json(stats)
  } catch (e) {
    return NextResponse.json(
      { error: `获取统计失败: ${e instanceof Error ? e.message : String(e)}`, code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
