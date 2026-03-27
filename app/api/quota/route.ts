import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { getQuotaStatus } from '@/lib/quota'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '请先登录', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const { env } = getRequestContext()
    const db = env.DB
    const userId = session.user.id

    const status = await getQuotaStatus(db, userId)

    return NextResponse.json(status)
  } catch (e) {
    return NextResponse.json(
      { error: `获取配额失败: ${e instanceof Error ? e.message : String(e)}`, code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
