// 数据库通用工具

// 创建处理历史记录
export async function createProcessHistory(
  db: D1Database,
  userId: string,
  quotaType: 'free' | 'subscription' | 'pay_per_use',
  originalFilename: string,
  originalSize: number,
  processedSize: number | null,
  status: 'success' | 'failed',
  errorMessage?: string | null,
  isHdOutput: boolean = false
): Promise<string> {
  const id = crypto.randomUUID()

  await db.prepare(
    `INSERT INTO process_history
     (id, user_id, quota_type, original_filename, original_size, processed_size, is_hd_output, status, error_message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    userId,
    quotaType,
    originalFilename,
    originalSize,
    processedSize,
    isHdOutput ? 1 : 0,
    status,
    errorMessage || null
  ).run()

  return id
}

// 获取用户统计信息
export async function getUserStats(db: D1Database, userId: string) {
  // 总处理次数
  const totalResult = await db.prepare(
    "SELECT COUNT(*) as count FROM process_history WHERE user_id = ? AND status = 'success'"
  ).bind(userId).first()

  // 总节省空间
  const savedResult = await db.prepare(
    `SELECT SUM(original_size - COALESCE(processed_size, 0)) as saved
     FROM process_history
     WHERE user_id = ? AND status = 'success' AND processed_size IS NOT NULL`
  ).bind(userId).first()

  // 首次使用时间
  const firstResult = await db.prepare(
    'SELECT MIN(created_at) as first_date FROM process_history WHERE user_id = ?'
  ).bind(userId).first()

  return {
    totalProcessed: (totalResult?.count as number) || 0,
    totalSizeSaved: (savedResult?.saved as number) || 0,
    memberSince: firstResult?.first_date as string | null,
  }
}

// 创建交易记录
export async function createTransaction(
  db: D1Database,
  userId: string,
  type: 'subscription' | 'pay_per_use' | 'admin_grant',
  amount: number,
  quotaAdded: number,
  paymentMethod?: 'alipay' | 'wechat' | 'stripe' | 'admin',
  paymentId?: string,
  adminNote?: string
): Promise<string> {
  const id = crypto.randomUUID()

  await db.prepare(
    `INSERT INTO transactions
     (id, user_id, type, amount, quota_added, status, payment_method, payment_id, admin_note, completed_at)
     VALUES (?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?)`
  ).bind(
    id,
    userId,
    type,
    amount,
    quotaAdded,
    paymentMethod || null,
    paymentId || null,
    adminNote || null,
    new Date().toISOString()
  ).run()

  return id
}

// 创建订阅记录
export async function createSubscriptionRecord(
  db: D1Database,
  userId: string,
  tier: string,
  price: number,
  quota: number
): Promise<string> {
  const id = crypto.randomUUID()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30天后

  await db.prepare(
    `INSERT INTO subscriptions
     (id, user_id, tier, price, quota, status, started_at, expires_at)
     VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`
  ).bind(
    id,
    userId,
    tier,
    price,
    quota,
    now.toISOString(),
    expiresAt.toISOString()
  ).run()

  return id
}

// 获取用户交易历史
export async function getUserTransactions(db: D1Database, userId: string, limit: number = 10) {
  const result = await db.prepare(
    `SELECT id, type, amount, quota_added, status, payment_method, created_at, completed_at
     FROM transactions
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ?`
  ).bind(userId, limit).all()

  return result.results
}

// 格式化字节大小
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

// 格式化金额（分转元）
export function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2)
}
