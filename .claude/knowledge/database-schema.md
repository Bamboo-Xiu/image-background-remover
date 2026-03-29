# Database Schema

## 数据库: Cloudflare D1 (SQLite)

访问方式:
```typescript
const { env } = getRequestContext()
const db = env.DB
```

## 表结构

### users (NextAuth)
```sql
id TEXT PRIMARY KEY,
email TEXT UNIQUE NOT NULL,
emailVerified TEXT,
name TEXT,
image TEXT,
createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
```

### accounts (NextAuth)
```sql
id TEXT PRIMARY KEY,
userId TEXT NOT NULL REFERENCES users(id),
type TEXT NOT NULL,
provider TEXT NOT NULL,
providerAccountId TEXT NOT NULL,
refresh_token TEXT,
access_token TEXT,
expires_at INTEGER,
token_type TEXT,
scope TEXT,
id_token TEXT,
session_state TEXT,
UNIQUE(provider, providerAccountId)
```

### sessions (NextAuth)
```sql
id TEXT PRIMARY KEY,
sessionToken TEXT UNIQUE NOT NULL,
userId TEXT NOT NULL REFERENCES users(id),
expires TEXT NOT NULL
```

### verification_tokens (NextAuth)
```sql
token TEXT UNIQUE NOT NULL,
identifier TEXT NOT NULL,
expires TEXT NOT NULL,
UNIQUE(token, identifier)
```

### user_quotas
```sql
id TEXT PRIMARY KEY,
user_id TEXT UNIQUE NOT NULL REFERENCES users(id),
free_total INTEGER DEFAULT 5,
free_used INTEGER DEFAULT 0,
subscription_plan TEXT,
subscription_quota INTEGER DEFAULT 0,
subscription_used INTEGER DEFAULT 0,
subscription_expires_at TEXT,
pay_per_use_quota INTEGER DEFAULT 0,
created_at TEXT DEFAULT CURRENT_TIMESTAMP,
updated_at TEXT DEFAULT CURRENT_TIMESTAMP
```

### subscriptions
```sql
id TEXT PRIMARY KEY,
user_id TEXT NOT NULL REFERENCES users(id),
plan TEXT NOT NULL,
status TEXT DEFAULT 'active',
paypal_subscription_id TEXT,
current_period_start TEXT,
current_period_end TEXT,
created_at TEXT DEFAULT CURRENT_TIMESTAMP,
updated_at TEXT DEFAULT CURRENT_TIMESTAMP
```

### transactions
```sql
id TEXT PRIMARY KEY,
user_id TEXT NOT NULL REFERENCES users(id),
type TEXT NOT NULL,
amount REAL NOT NULL,
quota INTEGER NOT NULL,
status TEXT DEFAULT 'completed',
paypal_order_id TEXT,
description TEXT,
created_at TEXT DEFAULT CURRENT_TIMESTAMP
```

### process_history
```sql
id TEXT PRIMARY KEY,
user_id TEXT NOT NULL REFERENCES users(id),
original_filename TEXT,
result_size INTEGER,
bg_color TEXT,
created_at TEXT DEFAULT CURRENT_TIMESTAMP
```

### paypal_orders
```sql
id TEXT PRIMARY KEY,
order_id TEXT UNIQUE NOT NULL,
user_id TEXT NOT NULL REFERENCES users(id),
type TEXT NOT NULL,
plan_key TEXT,
amount REAL,
quota INTEGER,
status TEXT DEFAULT 'pending',
created_at TEXT DEFAULT CURRENT_TIMESTAMP,
updated_at TEXT DEFAULT CURRENT_TIMESTAMP
```

## 索引

- `idx_user_quotas_user_id` ON user_quotas(user_id)
- `idx_process_history_user_id` ON process_history(user_id)
- `idx_transactions_user_id` ON transactions(user_id)
- `idx_subscriptions_user_id` ON subscriptions(user_id)
- `idx_paypal_orders_user` ON paypal_orders(user_id)

## 常用查询模式

```typescript
// 单行查询
const user = await db.prepare("SELECT * FROM users WHERE id = ?")
  .bind(userId)
  .first<User>()

// 多行查询
const { results } = await db.prepare("SELECT * FROM process_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?")
  .bind(userId, limit)
  .all()

// 写入
await db.prepare("INSERT INTO user_quotas (id, user_id) VALUES (?, ?)")
  .bind(quotaId, userId)
  .run()

// 更新
await db.prepare("UPDATE user_quotas SET free_used = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
  .bind(freeUsed, quotaId)
  .run()

// 计数
const { total } = await db.prepare("SELECT COUNT(*) as total FROM process_history WHERE user_id = ?")
  .bind(userId)
  .first()
```
