import { fetchJson, json } from './_shared.js';

const colors = ['#ff7657', '#c7f55c', '#72a7ff', '#ceb0ff', '#61d5c6'];
const categories = {
  ai: 'AI 科技', tech: '科技前沿', business: '商业观察', career: '职场', startup: '创业', design: '设计'
};

function classify(title) {
  const text = title.toLowerCase();
  if (/ai|人工智能|模型|agent|机器人/.test(text)) return 'AI 科技';
  if (/公司|融资|收入|market|startup|business/.test(text)) return '商业观察';
  if (/工作|职场|招聘|裁员|job/.test(text)) return '职场';
  return categories.tech;
}

export function normalize(items) {
  return items.map((item, index) => {
    const engagement = Number(item.engagement || 0);
    const recencyHours = Math.max(0, (Date.now() - new Date(item.createdAt).getTime()) / 3600000);
    const velocity = Math.max(0, engagement / Math.max(1, recencyHours + 1));
    const score = Math.min(99, Math.round(48 + Math.log10(engagement + 1) * 14 + Math.min(20, velocity / 3)));
    return { id: item.id, title: item.title, url: item.url, source: item.source, tag: classify(item.title), score,
      growth: `+${Math.max(12, Math.round(velocity * 4))}%`, time: recencyHours < 1 ? `${Math.max(1, Math.round(recencyHours * 60))} 分钟前` : `${Math.round(recencyHours)} 小时前`,
      tone: score > 88 ? '快速升温' : score > 78 ? '持续上行' : '值得关注', color: colors[index % colors.length] };
  }).sort((a, b) => b.score - a.score);
}

async function hackerNews() {
  const ids = await fetchJson('https://hacker-news.firebaseio.com/v0/topstories.json');
  const stories = await Promise.all(ids.slice(0, 12).map(id => fetchJson(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)));
  return stories.filter(Boolean).map(x => ({ id: `hn-${x.id}`, title: x.title, url: x.url || `https://news.ycombinator.com/item?id=${x.id}`, source: 'Hacker News', engagement: (x.score || 0) + (x.descendants || 0) * 2, createdAt: new Date(x.time * 1000).toISOString() }));
}

async function v2ex() {
  const data = await fetchJson('https://www.v2ex.com/api/topics/hot.json', { headers: { 'User-Agent': 'wechat-pulse/1.0' } });
  return data.slice(0, 12).map(x => ({ id: `v2-${x.id}`, title: x.title, url: x.url, source: `V2EX · ${x.node?.title || '热门'}`, engagement: (x.replies || 0) * 4 + 20, createdAt: new Date((x.last_touched || x.created) * 1000).toISOString() }));
}

export default async function handler(req, res) {
  try {
    const settled = await Promise.allSettled([hackerNews(), v2ex()]);
    const raw = settled.flatMap(x => x.status === 'fulfilled' ? x.value : []);
    if (!raw.length) throw new Error('热点源暂时不可用');
    const topics = normalize(raw).slice(0, 12);
    json(res, 200, { updatedAt: new Date().toISOString(), total: raw.length, rising: topics.filter(x => x.score >= 80).length, topics, sources: settled.map((x, i) => ({ name: i ? 'V2EX' : 'Hacker News', ok: x.status === 'fulfilled' })) });
  } catch (error) { json(res, 502, { error: error.message }); }
}
