import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const apiKey = process.env.REMOVE_BG_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured', code: 'API_ERROR' }, { status: 500 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: '请求格式错误', code: 'INVALID_FORMAT' }, { status: 400 })
  }

  const imageFile = formData.get('image_file')
  if (!imageFile || !(imageFile instanceof Blob)) {
    return NextResponse.json({ error: '未找到图片文件', code: 'INVALID_FORMAT' }, { status: 400 })
  }

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
    if (res.status === 402) {
      return NextResponse.json({ error: '免费额度已用完', code: 'QUOTA_EXCEEDED' }, { status: 402 })
    }
    if (res.status === 400) {
      return NextResponse.json({ error: '图片格式不支持', code: 'INVALID_FORMAT' }, { status: 400 })
    }
    return NextResponse.json({ error: text || 'API 调用失败', code: 'API_ERROR' }, { status: res.status })
  }

  const buffer = await res.arrayBuffer()
  return new NextResponse(buffer, {
    status: 200,
    headers: { 'Content-Type': 'image/png' },
  })
}
