import { Metadata } from 'next'

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-blue-500 hover:text-blue-600">
            <span className="text-xl">✂️</span>
            <span className="font-medium">Background Remover</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">定价</a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-12">常见问题</h1>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {index + 1}. {faq.question}
              </h3>
              <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>

        {/* 联系方式 */}
        <div className="mt-12 bg-blue-50 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">还有其他问题？</h2>
          <p className="text-gray-600 mb-4">请联系客服，我们会尽快回复您</p>
          <div className="flex justify-center gap-4">
            <a
              href="mailto:support@example.com"
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              发送邮件
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
