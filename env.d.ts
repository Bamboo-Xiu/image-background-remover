interface CloudflareEnv {
  DB: D1Database
  REMOVE_BG_API_KEY: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  AUTH_SECRET: string
}

declare module "@cloudflare/next-on-pages" {
  export function getRequestContext(): {
    env: CloudflareEnv
    ctx: ExecutionContext
    cf: IncomingRequestCfProperties
  }
}
