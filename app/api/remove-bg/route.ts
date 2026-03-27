import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { hasAvailableQuota, consumeQuota } from '@/lib/quota'
import { createProcessHistory } from '@/lib/db-utils'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    // 验证用户登录状态
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录后再使用此功能', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { env } = getRequestContext()
    const db = env.DB
    const userId = session.user.id

    // 检查配额
    const hasQuota = await hasAvailableQuota(db, userId)
    if (!hasQuota) {
      return NextResponse.json(
        { error: '您的配额已用完，请前往个人中心充值', code: 'QUOTA_EXCEEDED' },
        { status: 402 }
      )
    }

    // 由于启用了 nodejs_compat，直接使用 process.env
    const apiKey = process.env.REMOVE_BG_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured', code: 'API_ERROR' }, { status: 500 })
    }

    let formData: FormData
    try {
      formData = await req.formData()
    } catch (e) {
      return NextResponse.json({ error: `请求格式错误: ${e instanceof Error ? e.message : String(e)}`, code: 'INVALID_FORMAT' }, { status: 400 })
    }

    const imageFile = formData.get('image_file')
    if (!imageFile || !(imageFile instanceof Blob)) {
      return NextResponse.json({ error: '未找到图片文件', code: 'INVALID_FORMAT' }, { status: 400 })
    }

    const originalFilename = (imageFile as File).name || 'unknown.jpg'
    const originalSize = imageFile.size

    const upstream = new FormData()
    upstream.append('image_file', imageFile)
    upstream.append('size', 'auto')

    const res = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: upstream,
    })

    if (!res.ok) {
      const text = await res.text()
      // 记录失败历史
      await createProcessHistory(db, userId, 'free', originalFilename, originalSize, null, 'failed', text)

      if (res.status === 402) {
        return NextResponse.json({ error: '免费额度已用完', code: 'QUOTA_EXCEEDED' }, { status: 402 })
      }
      if (res.status === 400) {
        return NextResponse.json({ error: `图片格式不支持: ${text}`, code: 'INVALID_FORMAT' }, { status: 400 })
      }
      return NextResponse.json({ error: text || 'API 调用失败', code: 'API_ERROR' }, { status: res.status })
    }

    const buffer = await res.arrayBuffer()
    const processedSize = buffer.byteLength

    // 消耗配额
    const consumeResult = await consumeQuota(db, userId)

    // 记录成功历史
    await createProcessHistory(
      db,
      userId,
      consumeResult.quotaType || 'free',
      originalFilename,
      originalSize,
      processedSize,
      'success'
    )

    return new NextResponse(buffer, {
      status: 200,
      headers: { 'Content-Type': 'image/png' },
    })
  } catch (e) {
    return NextResponse.json({ error: `服务器内部错误: ${e instanceof Error ? e.message : String(e)}`, code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
