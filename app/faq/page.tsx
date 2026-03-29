import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '常见问题 - Background Remover',
  description: 'Background Remover 常见问题解答',
}

const faqs = [
  {
    question: '新用户有什么福利？',
    answer: '新用户注册即送 5 次免费处理额度，无需任何付费即可体验我们的服务。',
  },
  {
    question: '订阅套餐和按次购买有什么区别？',
    answer: '订阅套餐每月重置配额，适合有固定使用需求的用户；按次购买永不过期，用完再买，适合偶尔使用的用户。',
  },
  {
    question: '支持哪些图片格式？',
    answer: '目前支持 JPG、PNG、WebP 格式的图片，单张图片最大 10MB。',
  },
  {
    question: '处理后的图片质量如何？',
    answer: '我们使用专业级 AI 算法处理，输出高质量透明背景 PNG 图片。订阅用户还可享受高清分辨率输出。',
  },
  {
    question: '我的图片会被存储吗？',
    answer: '不会。图片仅在内存中处理，处理完成后立即返回给您，我们不会存储您的任何图片。',
  },
  {
    question: '处理需要多长时间？',
    answer: '通常需要 30-60 秒，具体时间取决于图片大小和网络状况。',
  },
  {
    question: '如何购买套餐？',
    answer: '目前需要联系客服购买。请通过页面底部的联系方式与我们取得联系，我们会尽快为您处理。',
  },
  {
    question: '可以退款吗？',
    answer: '虚拟商品一经使用不支持退款。如有特殊情况，请联系客服协商处理。',
  },
  {
    question: '支持批量处理吗？',
    answer: '批量处理功能目前仅对专业版订阅用户开放。如有大量图片处理需求，建议升级到专业版。',
  },
  {
    question: '遇到问题怎么办？',
    answer: '如遇到任何问题，请联系客服，我们会尽快为您解决。',
  },
]

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="ambient-glow" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg-secondary/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto flex items-center justify-between h-14 px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-start to-accent-end flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" />
                <line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" />
              </svg>
            </div>
            <span className="font-[family-name:var(--font-sora)] font-semibold text-sm text-foreground">BG Remover</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-xs text-text-secondary hover:text-foreground transition-colors">定价</Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-14 relative z-10">
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="font-[family-name:var(--font-sora)] text-3xl font-bold tracking-tight mb-3">常见问题</h1>
          <p className="text-text-secondary text-sm">快速找到您需要的答案</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className={`faq-item animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}
            >
              <summary>
                <span>{faq.question}</span>
              </summary>
              <div className="faq-answer">{faq.answer}</div>
            </details>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-14 glass-card p-8 text-center animate-fade-in-up">
          <h2 className="font-[family-name:var(--font-sora)] text-lg font-bold text-foreground mb-3">还有其他问题？</h2>
          <p className="text-text-secondary text-sm mb-6">请联系客服，我们会尽快回复您</p>
          <a
            href="mailto:support@example.com"
            className="btn-accent text-sm"
          >
            发送邮件
          </a>
        </div>
      </main>
    </div>
  )
}
