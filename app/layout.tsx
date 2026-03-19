import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Background Remover - 一键去除图片背景',
  description: '免费在线抠图工具，上传图片即可一键去除背景，无需注册，图片不存储。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
