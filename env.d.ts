interface CloudflareEnv {
  DB: D1Database
  REMOVE_BG_API_KEY: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  AUTH_SECRET: string
  PAYPAL_CLIENT_ID: string
  PAYPAL_CLIENT_SECRET: string
  PAYPAL_BASE_URL: string
  PAYPAL_WEBHOOK_ID: string
  NEXT_PUBLIC_APP_URL: string
}

declare module "@cloudflare/next-on-pages" {
  export function getRequestContext(): {
    env: CloudflareEnv
    ctx: ExecutionContext
    cf: IncomingRequestCfProperties
  }
}
