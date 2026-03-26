import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getRequestContext } from '@cloudflare/next-on-pages'

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

    // 获取分页参数
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // 查询历史记录
    const historyResult = await db.prepare(
      `SELECT id, quota_type, original_filename, original_size, processed_size,
              is_hd_output, status, error_message, created_at
       FROM process_history
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    ).bind(userId, limit, offset).all()

    // 查询总数
    const countResult = await db.prepare(
      'SELECT COUNT(*) as total FROM process_history WHERE user_id = ?'
    ).bind(userId).first()

    return NextResponse.json({
      history: historyResult.results,
      pagination: {
        page,
        limit,
        total: (countResult?.total as number) || 0,
        totalPages: Math.ceil(((countResult?.total as number) || 0) / limit),
      },
    })
  } catch (e) {
    return NextResponse.json(
      { error: `获取历史失败: ${e instanceof Error ? e.message : String(e)}`, code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
