/**
 * Cloudflare Workers — Remove.bg API 代理
 * 保护 API Key，转发请求到 Remove.bg
 *
 * 环境变量：REMOVE_BG_API_KEY
 * 设置方式：wrangler secret put REMOVE_BG_API_KEY
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(),
      });
    }

    // 只处理 POST /api/remove-bg
    if (request.method !== 'POST' || url.pathname !== '/api/remove-bg') {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    // 检查 API Key 是否配置
    if (!env.REMOVE_BG_API_KEY) {
      return jsonError('Server misconfiguration: API key not set', 500);
    }

    // 获取上传的图片
    let formData;
    try {
      formData = await request.formData();
    } catch {
      return jsonError('Invalid form data', 400);
    }

    const imageFile = formData.get('image_file');
    if (!imageFile) {
      return jsonError('Missing image_file field', 400);
    }

    // 检查文件大小（10MB）
    const bytes = await imageFile.arrayBuffer();
    if (bytes.byteLength > 10 * 1024 * 1024) {
      return jsonError('图片超过 10MB 限制', 400);
    }

    // 构建转发请求
    const upstream = new FormData();
    upstream.append('image_file', new Blob([bytes], { type: imageFile.type }), imageFile.name);
    upstream.append('size', 'auto');

    let removeBgRes;
    try {
      removeBgRes = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': env.REMOVE_BG_API_KEY,
        },
        body: upstream,
      });
    } catch (e) {
      return jsonError('无法连接到 Remove.bg，请稍后重试', 502);
    }

    if (!removeBgRes.ok) {
      const errBody = await removeBgRes.json().catch(() => ({}));
      const msg = errBody?.errors?.[0]?.title || 'Remove.bg 处理失败';

      // 常见错误友好化
      const codeMap = {
        'Insufficient credits': '免费额度已用完，请稍后再试',
        'File too large': '图片文件过大',
        'Invalid image': '无效的图片格式',
      };
      const friendly = Object.entries(codeMap).find(([k]) => msg.includes(k));

      return jsonError(friendly ? friendly[1] : msg, removeBgRes.status, 'API_ERROR');
    }

    // 返回图片流
    const imgData = await removeBgRes.arrayBuffer();
    return new Response(imgData, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline',
        ...corsHeaders(),
      },
    });
  },
};

function jsonError(message, status = 400, code = 'ERROR') {
  return new Response(JSON.stringify({ error: message, code }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
