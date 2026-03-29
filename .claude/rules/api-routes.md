# API Route Rules

## 路由结构规范

每个 API 路由文件必须是 `route.ts`，位于 `app/api/<feature>/route.ts`。

## 强制检查项

每个 API 路由必须包含：

1. **Runtime 声明**: `export const runtime = 'edge'`
2. **认证检查**: 所有需要登录的接口必须验证 session
3. **错误处理**: try-catch 包裹，返回标准错误格式
4. **参数验证**: 验证请求参数后才能使用

## 认证检查模板

```typescript
const session = await auth()
if (!session?.user?.id) {
  return NextResponse.json(
    { error: '请先登录', code: 'UNAUTHORIZED' },
    { status: 401 }
  )
}
```

## 错误响应标准

```typescript
// 成功
return NextResponse.json({ success: true, data })

// 错误
return NextResponse.json(
  { error: '错误描述', code: 'ERROR_CODE' },
  { status: 400 }
)
```

## 常用错误码

| Code | HTTP Status | 含义 |
|------|-------------|------|
| `UNAUTHORIZED` | 401 | 未登录 |
| `QUOTA_EXCEEDED` | 402 | 配额不足 |
| `INVALID_INPUT` | 400 | 参数无效 |
| `FILE_TOO_LARGE` | 400 | 文件过大 |
| `PROCESSING_FAILED` | 500 | 处理失败 |
| `INTERNAL_ERROR` | 500 | 服务器错误 |

## 数据库操作规范

- 始终使用参数化查询 (`.bind()`)，禁止字符串拼接 SQL
- 使用 `?` 占位符
- 查询结果使用泛型指定类型: `.first<User>()`
- 更新操作需同时更新 `updated_at` 字段

```typescript
// 正确
await db.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first()

// 错误 - SQL 注入风险
await db.prepare(`SELECT * FROM users WHERE id = '${userId}'`).first()
```

## 文件上传处理

- 使用 `FormData` 接收文件
- 通过 `req.formData()` 解析
- 检查文件大小和类型
