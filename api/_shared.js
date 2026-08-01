export function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', status === 200 ? 's-maxage=300, stale-while-revalidate=600' : 'no-store');
  res.end(JSON.stringify(body));
}

export async function fetchJson(url, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`上游服务返回 ${response.status}`);
    return await response.json();
  } finally { clearTimeout(timer); }
}

export async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = '';
  for await (const chunk of req) raw += chunk;
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}

export function requirePost(req, res) {
  if (req.method !== 'POST') {
    json(res, 405, { error: '仅支持 POST 请求' });
    return false;
  }
  return true;
}
