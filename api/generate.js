import { fetchJson, json, readBody, requirePost } from './_shared.js';

const stylePrompts = {
  '深度洞察': '逻辑严密、观点鲜明，解释现象背后的机制，避免空泛结论',
  '故事叙事': '以真实感场景开篇，用人物和冲突推进，结尾留下余味',
  '犀利评论': '判断直接、短句有力，敢于指出反常识之处，但不攻击个人',
  '温暖共鸣': '克制、真诚、有生活细节，理解读者处境而不说教',
  '知识科普': '概念准确、结构清晰，多用类比，帮助普通读者真正理解'
};

export function buildPrompt({ topic, style, sources = [] }) {
  const refs = sources.slice(0, 8).map((s, i) => `[${i + 1}] ${s.title}｜${s.source}｜${s.url}`).join('\n');
  return `你是资深微信公众号主编。围绕“${topic}”写一篇可供编辑审阅的原创文章。\n风格：${stylePrompts[style] || stylePrompts['深度洞察']}。\n要求：1200-1800字；给出3个标题备选、摘要、正文和文末互动问题；正文使用Markdown；不得编造数据；涉及事实时用[数字]标注对应信源；不确定的信息明确说明；不要使用“首先/其次/最后”的模板化结构；禁止标题党和洗稿。\n参考信源：\n${refs || '用户未提供信源，请仅进行一般性分析并明确事实边界。'}\n仅返回JSON：{"titles":[""],"digest":"","content":"","riskNotes":[""],"citations":[{"index":1,"title":"","url":""}]}`;
}

export default async function handler(req, res) {
  if (!requirePost(req, res)) return;
  const body = await readBody(req);
  if (!body.topic?.trim()) return json(res, 400, { error: '请输入文章主题' });
  if (!process.env.DEEPSEEK_API_KEY) return json(res, 503, { error: '尚未配置 DEEPSEEK_API_KEY', code: 'MISSING_DEEPSEEK_KEY' });
  try {
    const result = await fetchJson('https://api.deepseek.com/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` }, body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.75, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: '你输出专业、可核验的中文内容，不虚构事实。' }, { role: 'user', content: buildPrompt(body) }] }) }, 60000);
    const article = JSON.parse(result.choices?.[0]?.message?.content || '{}');
    json(res, 200, { article, usage: result.usage, generatedAt: new Date().toISOString() });
  } catch (error) { json(res, 502, { error: `生成失败：${error.message}` }); }
}
