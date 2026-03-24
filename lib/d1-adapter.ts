import type { Adapter, AdapterUser, AdapterAccount, AdapterSession } from "next-auth/adapters"

export function D1Adapter(db: D1Database): Adapter {
  return {
    async createUser(user) {
      const id = crypto.randomUUID()
      await db.prepare(
        "INSERT INTO users (id, name, email, emailVerified, image) VALUES (?, ?, ?, ?, ?)"
      ).bind(id, user.name ?? null, user.email, user.emailVerified?.toISOString() ?? null, user.image ?? null).run()
      return { ...user, id } as AdapterUser
    },

    async getUser(id) {
      const row = await db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first()
      return row ? formatUser(row) : null
    },

    async getUserByEmail(email) {
      const row = await db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first()
      return row ? formatUser(row) : null
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const row = await db.prepare(
        "SELECT u.* FROM users u JOIN accounts a ON u.id = a.userId WHERE a.provider = ? AND a.providerAccountId = ?"
      ).bind(provider, providerAccountId).first()
      return row ? formatUser(row) : null
    },

    async updateUser(user) {
      const fields: string[] = []
      const values: unknown[] = []
      if (user.name !== undefined) { fields.push("name = ?"); values.push(user.name) }
      if (user.email !== undefined) { fields.push("email = ?"); values.push(user.email) }
      if (user.image !== undefined) { fields.push("image = ?"); values.push(user.image) }
      if (user.emailVerified !== undefined) { fields.push("emailVerified = ?"); values.push(user.emailVerified?.toISOString() ?? null) }
      if (fields.length > 0) {
        values.push(user.id)
        await db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run()
      }
      const row = await db.prepare("SELECT * FROM users WHERE id = ?").bind(user.id).first()
      return formatUser(row!)
    },

    async linkAccount(account) {
      await db.prepare(
        "INSERT INTO accounts (userId, type, provider, providerAccountId, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(
        account.userId, account.type, account.provider, account.providerAccountId,
        account.refresh_token ?? null, account.access_token ?? null, account.expires_at ?? null,
        account.token_type ?? null, account.scope ?? null, account.id_token ?? null, account.session_state ?? null
      ).run()
      return account as AdapterAccount
    },

    async createSession(session) {
      await db.prepare(
        "INSERT INTO sessions (sessionToken, userId, expires) VALUES (?, ?, ?)"
      ).bind(session.sessionToken, session.userId, session.expires.toISOString()).run()
      return session as AdapterSession
    },

    async getSessionAndUser(sessionToken) {
      const row = await db.prepare(
        "SELECT s.*, u.id as uid, u.name, u.email, u.emailVerified, u.image FROM sessions s JOIN users u ON s.userId = u.id WHERE s.sessionToken = ?"
      ).bind(sessionToken).first() as Record<string, unknown> | null
      if (!row) return null
      return {
        session: {
          sessionToken: row.sessionToken as string,
          userId: row.userId as string,
          expires: new Date(row.expires as string),
        },
        user: formatUser({ id: row.uid, name: row.name, email: row.email, emailVerified: row.emailVerified, image: row.image }),
      }
    },

    async updateSession(session) {
      if (session.expires) {
        await db.prepare("UPDATE sessions SET expires = ? WHERE sessionToken = ?")
          .bind(session.expires.toISOString(), session.sessionToken).run()
      }
      return session as AdapterSession
    },

    async deleteSession(sessionToken) {
      await db.prepare("DELETE FROM sessions WHERE sessionToken = ?").bind(sessionToken).run()
    },

    async deleteUser(userId) {
      await db.prepare("DELETE FROM accounts WHERE userId = ?").bind(userId).run()
      await db.prepare("DELETE FROM sessions WHERE userId = ?").bind(userId).run()
      await db.prepare("DELETE FROM users WHERE id = ?").bind(userId).run()
    },

    async unlinkAccount({ providerAccountId, provider }) {
      await db.prepare("DELETE FROM accounts WHERE provider = ? AND providerAccountId = ?")
        .bind(provider, providerAccountId).run()
    },

    async createVerificationToken(token) {
      await db.prepare(
        "INSERT INTO verification_tokens (identifier, token, expires) VALUES (?, ?, ?)"
      ).bind(token.identifier, token.token, token.expires.toISOString()).run()
      return token
    },

    async useVerificationToken({ identifier, token }) {
      const row = await db.prepare(
        "SELECT * FROM verification_tokens WHERE identifier = ? AND token = ?"
      ).bind(identifier, token).first()
      if (!row) return null
      await db.prepare("DELETE FROM verification_tokens WHERE identifier = ? AND token = ?")
        .bind(identifier, token).run()
      return { identifier: row.identifier as string, token: row.token as string, expires: new Date(row.expires as string) }
    },
  }
}

function formatUser(row: Record<string, unknown>): AdapterUser {
  return {
    id: row.id as string,
    name: row.name as string | null,
    email: row.email as string,
    emailVerified: row.emailVerified ? new Date(row.emailVerified as string) : null,
    image: row.image as string | null,
  }
}
