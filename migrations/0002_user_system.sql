-- User System Schema

-- 用户配额表
CREATE TABLE IF NOT EXISTS user_quotas (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,

  -- 免费配额（一次性）
  free_quota INTEGER DEFAULT 5,
  free_used INTEGER DEFAULT 0,

  -- 订阅配额（每月重置）
  subscription_tier TEXT,
  subscription_quota INTEGER DEFAULT 0,
  subscription_used INTEGER DEFAULT 0,
  subscription_expires_at TEXT,

  -- 按次配额（永不过期）
  pay_per_use_quota INTEGER DEFAULT 0,

  -- 高级功能权限
  can_hd_output INTEGER DEFAULT 0,
  can_batch_process INTEGER DEFAULT 0,

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 订阅记录表
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tier TEXT NOT NULL,
  price INTEGER NOT NULL,
  quota INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  started_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 交易记录表
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  quota_added INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  payment_id TEXT,
  admin_note TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 处理历史表
CREATE TABLE IF NOT EXISTS process_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  quota_type TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  original_size INTEGER NOT NULL,
  processed_size INTEGER,
  is_hd_output INTEGER DEFAULT 0,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  created_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_user_quotas_user_id ON user_quotas(user_id);
CREATE INDEX IF NOT EXISTS idx_process_history_user_id ON process_history(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
