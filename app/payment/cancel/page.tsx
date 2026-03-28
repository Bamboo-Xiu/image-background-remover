import Link from 'next/link'

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-sm border border-gray-200 text-center">
        <div className="text-5xl mb-4">&#128683;</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">支付已取消</h1>
        <p className="text-gray-600 mb-6">您取消了本次支付，未产生任何费用。</p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/pricing"
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            返回定价页面
          </Link>
          <Link
            href="/"
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            首页
          </Link>
        </div>
      </div>
    </div>
  )
}
