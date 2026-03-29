import type { Metadata } from 'next'
import { DM_Sans, Sora } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
  weight: ['400', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Background Remover - 一键去除图片背景',
  description: '免费在线抠图工具，上传图片即可一键去除背景，无需注册，图片不存储。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${dmSans.variable} ${sora.variable}`}>
      <body>{children}</body>
    </html>
  )
}
