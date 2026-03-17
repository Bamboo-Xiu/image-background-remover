# Image Background Remover

一键去除图片背景，基于 Remove.bg API，部署在 Cloudflare Pages + Workers。

## 特性

- 🚀 一键去背景，秒级返回结果
- 🔒 API Key 保存在 Cloudflare Workers 环境变量，不暴露给前端
- 🗑️ 图片不存储，处理完即丢弃
- 📱 移动端友好
- 💸 Cloudflare 免费部署（Workers 10万次/天免费）

## 技术栈

- **前端**：纯静态 HTML + Tailwind CSS（CDN）
- **后端**：Cloudflare Workers（API 代理）
- **AI 服务**：[Remove.bg API](https://www.remove.bg/api)
- **部署**：Cloudflare Pages + Workers

## 本地开发

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 设置 Remove.bg API Key
wrangler secret put REMOVE_BG_API_KEY

# 本地预览
wrangler pages dev public --compatibility-date=2024-01-01
```

## 部署到 Cloudflare

### 方式一：Cloudflare Pages（推荐）

1. Fork 本仓库
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
3. 进入 **Pages** → **Create a project** → 连接 GitHub 仓库
4. 构建设置：
   - Framework preset: `None`
   - Build command: _(留空)_
   - Build output directory: `public`
5. 添加环境变量：`REMOVE_BG_API_KEY` = 你的 API Key
6. 部署完成后，在 **Functions** 中确认 `/api/*` 路由绑定到 Worker

### 方式二：Wrangler CLI

```bash
wrangler secret put REMOVE_BG_API_KEY
wrangler deploy
```

## 获取 Remove.bg API Key

1. 注册 [Remove.bg](https://www.remove.bg/users/sign_up)
2. 进入 [API Keys](https://www.remove.bg/api#remove-background) 页面
3. 复制 API Key

免费额度：50次/月。超出后按 $0.2/次 计费。

## 项目结构

```
├── public/
│   ├── index.html    # 前端页面
│   └── app.js        # 交互逻辑
├── workers/
│   └── remove-bg.js  # Cloudflare Workers 代理
├── wrangler.toml     # Workers 配置
└── README.md
```

## License

MIT
