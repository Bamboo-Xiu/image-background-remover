import { Metadata } from 'next'
import { PricingClient } from './pricing-client'

export const metadata: Metadata = {
  title: '定价方案 - Background Remover',
  description: '选择适合您的定价方案，新用户注册即送 5 次免费处理额度',
}

export default function PricingPage() {
  return <PricingClient />
}
