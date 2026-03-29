# Database Query Rules

## 查询安全

- **强制参数化查询**: 所有查询必须使用 `.bind()`，绝对不允许字符串拼接
- **禁止原始 SQL 拼接**: 不使用模板字符串构建 SQL

```typescript
// 正确
db.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first()

// 错误
db.prepare(`SELECT * FROM users WHERE id = '${userId}'`).first()
```

## 查询方法

| 方法 | 用途 | 返回 |
|------|------|------|
| `.first<T>()` | 查询单行 | `T \| null` |
| `.all()` | 查询多行 | `{ results: T[] }` |
| `.run()` | 执行写入 | `{ success: boolean }` |

## ID 生成

使用 `crypto.randomUUID()` 生成 ID（Edge Runtime 兼容）：

```typescript
const id = crypto.randomUUID()
```

## 时间戳

- 使用 ISO 8601 格式: `new Date().toISOString()`
- 数据库默认: `CURRENT_TIMESTAMP`
- 手动更新时: `updated_at = CURRENT_TIMESTAMP`

## 事务

D1 支持 `db.batch()` 进行批量操作：

```typescript
await db.batch([
  db.prepare("UPDATE ...").bind(...),
  db.prepare("INSERT ...").bind(...),
])
```

## 错误处理

数据库操作应有 try-catch，失败时返回 500 错误：

```typescript
try {
  await db.prepare("...").bind(...).run()
} catch (error) {
  console.error('DB Error:', error)
  return NextResponse.json({ error: '数据库操作失败' }, { status: 500 })
}
```
