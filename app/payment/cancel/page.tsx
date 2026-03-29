import Link from 'next/link'

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="ambient-glow" />
      <div className="max-w-md w-full glass-card p-10 text-center relative z-10 animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </div>
        <h1 className="font-[family-name:var(--font-sora)] text-2xl font-bold text-foreground mb-2">支付已取消</h1>
        <p className="text-text-secondary text-sm mb-8">您取消了本次支付，未产生任何费用。</p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/pricing"
            className="btn-accent text-sm"
          >
            返回定价页面
          </Link>
          <Link
            href="/"
            className="btn-ghost text-sm"
          >
            首页
          </Link>
        </div>
      </div>
    </div>
  )
}
