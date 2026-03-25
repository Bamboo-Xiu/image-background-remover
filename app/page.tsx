import HomeClient from './home-client'

// 移除 edge runtime，让页面静态生成
// API 路由仍然使用 edge runtime

export default function Page() {
  return <HomeClient />
}
