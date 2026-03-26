import { Metadata } from 'next'
import { ProfileClient } from './profile-client'

export const metadata: Metadata = {
  title: '个人中心 - Background Remover',
  description: '查看您的配额状态、使用统计和处理历史',
}

export default function ProfilePage() {
  return <ProfileClient />
}
