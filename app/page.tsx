import { AuthHeader } from './components/auth-header'
import HomeClient from './home-client'

export const runtime = 'edge'

export default function Page() {
  return <HomeClient authHeader={<AuthHeader />} />
}
