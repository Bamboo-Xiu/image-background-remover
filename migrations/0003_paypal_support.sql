-- PayPal 支付支持

-- PayPal 订单/订阅跟踪表
CREATE TABLE IF NOT EXISTS paypal_orders (
  order_id TEXT PRIMARY KEY,         -- PayPal Order ID 或 Subscription ID
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,                -- 'subscription' | 'pay_per_use'
  plan_key TEXT NOT NULL,            -- 'light'|'standard'|'professional'|'small'|'medium'|'large'
  amount REAL NOT NULL,              -- USD 金额 (如 4.99)
  quota INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',     -- pending | completed | failed
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_paypal_orders_user ON paypal_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_paypal_orders_status ON paypal_orders(status);

-- subscriptions 表增加 PayPal 订阅 ID 列
ALTER TABLE subscriptions ADD COLUMN paypal_subscription_id TEXT;
