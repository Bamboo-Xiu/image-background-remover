import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  // 调试：记录所有可能的获取方式
  const debug: Record<string, unknown> = {}

  // 1. 检查 process.env
  debug['process.env.REMOVE_BG_API_KEY'] = process.env.REMOVE_BG_API_KEY ? 'exists (length: ' + process.env.REMOVE_BG_API_KEY.length + ')' : 'undefined'

  // 2. 检查全局 env
  try {
    // @ts-ignore
    if (typeof globalThis !== 'undefined' && globalThis.cloudflare?.env) {
      // @ts-ignore
      debug['globalThis.cloudflare.env'] = Object.keys(globalThis.cloudflare.env)
    }
  } catch (e) {
    debug['globalThis.cloudflare.env.error'] = String(e)
  }

  // 3. 尝试 getRequestContext
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages')
    const ctx = getRequestContext()
    debug['getRequestContext'] = 'success'
    debug['ctx.env keys'] = ctx?.env ? Object.keys(ctx.env) : 'no env'
    debug['ctx.env.REMOVE_BG_API_KEY'] = ctx?.env?.REMOVE_BG_API_KEY ? 'exists' : 'undefined'
  } catch (e) {
    debug['getRequestContext.error'] = e instanceof Error ? e.message : String(e)
  }

  // 返回调试信息
  return NextResponse.json({ debug })
}
