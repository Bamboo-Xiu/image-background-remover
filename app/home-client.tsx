'use client'

import { useState, useRef, useCallback, useEffect, DragEvent, ChangeEvent } from 'react'
import { SessionProvider, useSession, signIn } from 'next-auth/react'
import Link from 'next/link'
import { AuthHeader } from './components/auth-header-client'

type Status = 'idle' | 'processing' | 'done' | 'error'
type BgMode = 'checkerboard' | 'white' | 'black'

const MAX_SIZE = 10 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

function UploadIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  )
}

function HomeContent() {
  const { data: session, status: sessionStatus } = useSession()
  const [statusState, setStatusState] = useState<Status>('idle')
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [originalUrl, setOriginalUrl] = useState<string>('')
  const [resultUrl, setResultUrl] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [bgMode, setBgMode] = useState<BgMode>('checkerboard')
  const [isDragging, setIsDragging] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (statusState !== 'processing') { setElapsed(0); return }
    const t = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [statusState])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!toast || toast.type === 'info') return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const showToast = (type: 'success' | 'error' | 'info', msg: string) => {
    setToast({ type, msg })
  }

  const removeBg = useCallback(async (file: File) => {
    setStatusState('processing')
    setErrorMsg('')
    showToast('info', '正在处理，请稍候...')
    try {
      const form = new FormData()
      form.append('image_file', file)
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 90000)
      const res = await fetch('/api/remove-bg', { method: 'POST', body: form, signal: controller.signal }).finally(() => clearTimeout(timer))
      if (!res.ok) {
        let errorMsg = '处理失败'
        const text = await res.text()
        try {
          const data = JSON.parse(text)
          errorMsg = data.error || errorMsg
        } catch {
          errorMsg = text || `服务器错误 (${res.status})`
        }
        throw new Error(errorMsg)
      }
      const blob = await res.blob()
      setResultUrl(URL.createObjectURL(blob))
      setStatusState('done')
      showToast('success', '背景去除成功！')
    } catch (err) {
      const msg = err instanceof Error ? err.message : '处理失败，请重试'
      setErrorMsg(msg)
      setStatusState('error')
      showToast('error', msg)
    }
  }, [])

  const handleFile = useCallback((file: File) => {
    if (sessionStatus === 'loading') {
      showToast('info', '正在加载登录状态，请稍候...')
      return
    }
    if (sessionStatus === 'unauthenticated' || !session?.user) {
      showToast('error', '请先登录后再使用背景去除功能')
      setTimeout(() => signIn('google'), 1500)
      return
    }
    if (!ACCEPTED.includes(file.type)) {
      showToast('error', '仅支持 JPG、PNG、WebP 格式')
      return
    }
    if (file.size > MAX_SIZE) {
      showToast('error', '文件大小不能超过 10MB')
      return
    }
    setOriginalFile(file)
    setOriginalUrl(URL.createObjectURL(file))
    setResultUrl('')
    setErrorMsg('')
    removeBg(file)
  }, [removeBg, session, sessionStatus])

  const onDrop = useCallback((e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDownload = () => {
    if (!resultUrl || !originalFile) return
    const a = document.createElement('a')
    a.href = resultUrl
    a.download = `removed_bg_${originalFile.name.replace(/\.[^.]+$/, '')}.png`
    a.click()
  }

  const reset = () => {
    setStatusState('idle')
    setOriginalFile(null)
    setOriginalUrl('')
    setResultUrl('')
    setErrorMsg('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const bgClass: Record<BgMode, string> = {
    checkerboard: 'bg-checkerboard',
    white: 'bg-white',
    black: 'bg-black',
  }

  const toastClass = {
    success: 'toast-success',
    error: 'toast-error',
    info: 'toast-info',
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Ambient glow */}
      <div className="ambient-glow" />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 toast ${toastClass[toast.type]}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg-secondary/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-14 px-5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-start to-accent-end flex items-center justify-center shadow-lg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" />
                <line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" />
              </svg>
            </div>
            <span className="font-[family-name:var(--font-sora)] font-semibold text-sm text-foreground tracking-tight">
              BG Remover
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-xs text-text-secondary hover:text-foreground transition-colors hidden sm:block">定价</Link>
            <Link href="/faq" className="text-xs text-text-secondary hover:text-foreground transition-colors hidden sm:block">常见问题</Link>
            <AuthHeader />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-10 flex flex-col gap-8 relative z-10">
        {statusState === 'idle' && (
          <div className="animate-fade-in-up flex flex-col items-center gap-6">
            {/* Hero */}
            <div className="text-center space-y-3 max-w-lg">
              <h1 className="font-[family-name:var(--font-sora)] text-3xl sm:text-4xl font-bold tracking-tight">
                一键去除<span className="gradient-text">图片背景</span>
              </h1>
              <p className="text-text-secondary text-sm leading-relaxed">
                上传图片，AI 自动移除背景。快速、专业、隐私安全。
              </p>
            </div>

            {/* Upload Zone */}
            <label
              className={`drop-zone w-full max-w-xl p-12 sm:p-16 text-center block ${isDragging ? 'dragging' : ''}`}
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
            >
              <div className="relative z-10 flex flex-col items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-border-default flex items-center justify-center text-accent-start">
                  <UploadIcon />
                </div>
                <div>
                  <p className="font-[family-name:var(--font-sora)] font-semibold text-foreground">
                    拖拽图片到此处，或点击上传
                  </p>
                  <p className="text-text-muted text-xs mt-2">
                    支持 JPG / PNG / WebP · 最大 10MB
                  </p>
                </div>
              </div>
              <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={onInputChange} />
            </label>

            {/* Features hint */}
            <div className="flex items-center gap-6 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                隐私安全
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                无需注册体验
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                高清输出
              </span>
            </div>
          </div>
        )}

        {statusState !== 'idle' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Original */}
              <div className="space-y-2.5">
                <p className="text-[11px] font-[family-name:var(--font-sora)] font-semibold text-text-muted uppercase tracking-widest">
                  Original
                </p>
                <div className="preview-container">
                  {originalUrl && <img src={originalUrl} alt="原图" />}
                </div>
              </div>

              {/* Result */}
              <div className="space-y-2.5">
                <p className="text-[11px] font-[family-name:var(--font-sora)] font-semibold text-text-muted uppercase tracking-widest">
                  Result
                </p>
                <div className={`preview-container ${statusState === 'done' ? bgClass[bgMode] : ''}`}>
                  {statusState === 'processing' && (
                    <div className="flex flex-col items-center gap-4">
                      <div className="spinner" />
                      <p className="text-sm text-text-secondary font-medium">AI 处理中</p>
                      <p className="text-xs text-text-muted tabular-nums">{elapsed}s</p>
                    </div>
                  )}
                  {statusState === 'error' && (
                    <div className="flex flex-col items-center gap-3 px-6 text-center">
                      <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </div>
                      <p className="text-sm text-error font-medium">{errorMsg}</p>
                    </div>
                  )}
                  {statusState === 'done' && resultUrl && (
                    <img src={resultUrl} alt="去背景后" />
                  )}
                </div>
              </div>
            </div>

            {/* Background mode selector */}
            {statusState === 'done' && (
              <div className="flex items-center justify-center gap-2 animate-fade-in">
                <span className="text-xs text-text-muted mr-1">预览背景</span>
                {(['checkerboard', 'white', 'black'] as BgMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setBgMode(mode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      bgMode === mode
                        ? 'bg-accent-start/15 text-accent-start border border-accent-start/30'
                        : 'bg-bg-hover text-text-secondary border border-border-subtle hover:text-text-primary hover:border-border-default'
                    }`}
                  >
                    {mode === 'checkerboard' ? '棋盘格' : mode === 'white' ? '白色' : '黑色'}
                  </button>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {statusState === 'done' && (
                <>
                  <button onClick={handleDownload} className="btn-accent animate-pulse-glow">
                    <DownloadIcon />
                    下载 PNG
                  </button>
                  <button
                    onClick={() => originalFile && removeBg(originalFile)}
                    className="btn-ghost"
                  >
                    <RefreshIcon />
                    重新处理
                  </button>
                </>
              )}
              <button onClick={reset} className="btn-ghost">
                重新上传
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-4">
          <div className="flex flex-wrap justify-center gap-6 text-xs text-text-muted">
            <Link href="/pricing" className="hover:text-text-secondary transition-colors">定价方案</Link>
            <Link href="/faq" className="hover:text-text-secondary transition-colors">常见问题</Link>
            <a href="mailto:support@example.com" className="hover:text-text-secondary transition-colors">联系我们</a>
          </div>
          <p className="text-[11px] text-text-muted">
            Powered by Remove.bg · 图片仅在内存中处理，不会被存储
          </p>
        </div>
      </footer>
    </div>
  )
}

export default function HomeClient() {
  return (
    <SessionProvider>
      <HomeContent />
    </SessionProvider>
  )
}
