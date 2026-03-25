import { SessionProvider } from 'next-auth/react'
import HomeClient from './home-client'

export const runtime = 'edge'

export default function Page() {
  return (
    <SessionProvider>
      <HomeClient />
    </SessionProvider>
  )
}
