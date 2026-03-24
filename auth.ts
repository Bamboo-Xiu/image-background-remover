import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { D1Adapter } from "@/lib/d1-adapter"
import { getRequestContext } from "@cloudflare/next-on-pages"

function getDB(): D1Database | null {
  try {
    const { env } = getRequestContext()
    return (env as unknown as Record<string, unknown>).DB as D1Database
  } catch {
    return null
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth(() => {
  const db = getDB()
  return {
    providers: [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    ],
    ...(db ? { adapter: D1Adapter(db) } : {}),
    session: {
      strategy: db ? "database" : "jwt",
    },
    trustHost: true,
  }
})
