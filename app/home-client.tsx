'use client'

import { useState, useRef, useCallback, useEffect, DragEvent, ChangeEvent, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { AuthHeader } from './components/auth-header-client'

type Status = 'idle' | 'processing' | 'done' | 'error'
type BgMode = 'checkerboard' | 'white' | 'black'

const MAX_SIZE = 10 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

export default function HomeClient() {
  const { data: session } = useSession()
  const [status, setStatus] = useState<Status>('idle')
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [originalUrl, setOriginalUrl] = useState<string>('')
  const [resultUrl, setResultUrl] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [bgMode, setBgMode] = useState<BgMode>('checkerboard')
  const [isDragging, setIsDragging] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (status !== 'processing') { setElapsed(0); return }
    const t = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [status])
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-dismiss toast (info stays until replaced)
  useEffect(() => {
    if (!toast || toast.type === 'info') return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const showToast = (type: 'success' | 'error' | 'info', msg: string) => {
    setToast({ type, msg })
  }

  const removeBg = useCallback(async (file: File) => {
    setStatus('processing')
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
      setStatus('done')
      showToast('success', '背景去除成功！')
    } catch (err) {
      const msg = err instanceof Error ? err.message : '处理失败，请重试'
      setErrorMsg(msg)
      setStatus('error')
      showToast('error', msg)
    }
  }, [])

  const handleFile = useCallback((file: File) => {
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
    // 选完图片自动开始处理
    removeBg(file)
  }, [removeBg])

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
    setStatus('idle')
    setOriginalFile(null)
    setOriginalUrl('')
    setResultUrl('')
    setErrorMsg('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const bgClass: Record<BgMode, string> = {
    checkerboard: 'bg-checkerboard',
    white: 'bg-white',
    black: 'bg-gray-900',
  }

  const toastColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg transition-all ${toastColor[toast.type]}`}>
          {toast.type === 'success' && '✅ '}
          {toast.type === 'error' && '❌ '}
          {toast.type === 'info' && '⏳ '}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✂️</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Background Remover</h1>
              <p className="text-sm text-gray-500">一键去除图片背景，免费、快速</p>
            </div>
          </div>
          <AuthHeader session={session} />
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 flex flex-col gap-8">
        {/* Upload Area */}
        {status === 'idle' && (
          <label
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors block ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-100'
            }`}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
          >
            <div className="text-5xl mb-4">🖼️</div>
            <p className="text-lg font-medium text-gray-700">拖拽图片到这里，或点击上传</p>
            <p className="text-sm text-gray-400 mt-2">支持 JPG / PNG / WebP，最大 10MB</p>
            <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={onInputChange} />
          </label>
        )}

        {/* Processing / Done / Error */}
        {status !== 'idle' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-gray-500 text-center">原图</p>
                <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-100 aspect-square flex items-center justify-center">
                  {originalUrl && <img src={originalUrl} alt="原图" className="max-w-full max-h-full object-contain" />}
                </div>
              </div>

              {/* Result */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-gray-500 text-center">去背景后</p>
                <div className={`rounded-xl overflow-hidden border border-gray-200 aspect-square flex items-center justify-center ${status === 'done' ? bgClass[bgMode] : 'bg-gray-100'}`}>
                  {status === 'processing' && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-gray-500">AI 处理中...</p>
                      <p className="text-xs text-gray-400">{elapsed}s（通常需要 30-60 秒）</p>
                    </div>
                  )}
                  {status === 'error' && (
                    <div className="flex flex-col items-center gap-2 px-4 text-center">
                      <span className="text-4xl">❌</span>
                      <p className="text-sm text-red-500 font-medium">{errorMsg}</p>
                    </div>
                  )}
                  {status === 'done' && resultUrl && (
                    <img src={resultUrl} alt="去背景后" className="max-w-full max-h-full object-contain" />
                  )}
                </div>
              </div>
            </div>

            {/* Background toggle */}
            {status === 'done' && (
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-gray-500">预览背景：</span>
                {(['checkerboard', 'white', 'black'] as BgMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setBgMode(mode)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      bgMode === mode ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {mode === 'checkerboard' ? '棋盘格' : mode === 'white' ? '白色' : '黑色'}
                  </button>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {status === 'done' && (
                <>
                  <button
                    onClick={handleDownload}
                    className="px-8 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
                  >
                    ⬇️ 下载 PNG
                  </button>
                  <button
                    onClick={() => originalFile && removeBg(originalFile)}
                    className="px-8 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
                  >
                    🔄 重新处理
                  </button>
                </>
              )}
              <button
                onClick={reset}
                className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
              >
                重新上传
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 py-4 px-6 text-center text-sm text-gray-400">
        Powered by <a href="https://www.remove.bg" className="underline hover:text-gray-600" target="_blank" rel="noopener noreferrer">Remove.bg</a>
        &nbsp;·&nbsp;图片仅在内存中处理，不会被存储
      </footer>
    </div>
  )
}
