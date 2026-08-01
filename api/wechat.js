import { fetchJson, json, readBody, requirePost } from './_shared.js';

async function token() {
  const appid = process.env.WECHAT_APP_ID, secret = process.env.WECHAT_APP_SECRET;
  if (!appid || !secret) throw Object.assign(new Error('尚未配置微信公众号 AppID/AppSecret'), { code: 'MISSING_WECHAT_CONFIG' });
  const data = await fetchJson(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(appid)}&secret=${encodeURIComponent(secret)}`);
  if (!data.access_token) throw new Error(data.errmsg || '无法获取微信 access_token');
  return data.access_token;
}

export function toWechatHtml(markdown = '') {
  return markdown.split('\n').map(line => {
    const safe = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    if (safe.startsWith('### ')) return `<h3>${safe.slice(4)}</h3>`;
    if (safe.startsWith('## ')) return `<h2>${safe.slice(3)}</h2>`;
    if (safe.startsWith('# ')) return `<h1>${safe.slice(2)}</h1>`;
    if (!safe.trim()) return '<p><br/></p>';
    return `<p>${safe}</p>`;
  }).join('');
}

export default async function handler(req, res) {
  if (!requirePost(req, res)) return;
  const body = await readBody(req);
  if (!body.title || !body.content) return json(res, 400, { error: '标题和正文不能为空' });
  if (!body.thumbMediaId) return json(res, 400, { error: '公众号发布需要封面素材 thumbMediaId' });
  try {
    const accessToken = await token();
    const draft = await fetchJson(`https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${accessToken}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ articles: [{ title: body.title.slice(0, 64), author: body.author || '', digest: (body.digest || '').slice(0, 120), content: toWechatHtml(body.content), content_source_url: body.sourceUrl || '', thumb_media_id: body.thumbMediaId, need_open_comment: 1, only_fans_can_comment: 0 }] }) });
    if (!draft.media_id) throw new Error(draft.errmsg || '保存草稿失败');
    if (body.action !== 'publish') return json(res, 200, { status: 'draft', mediaId: draft.media_id });
    const publish = await fetchJson(`https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=${accessToken}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ media_id: draft.media_id }) });
    if (!publish.publish_id) throw new Error(publish.errmsg || '提交发布失败');
    json(res, 200, { status: 'submitted', mediaId: draft.media_id, publishId: publish.publish_id });
  } catch (error) { json(res, error.code === 'MISSING_WECHAT_CONFIG' ? 503 : 502, { error: error.message, code: error.code }); }
}
