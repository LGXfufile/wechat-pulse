import { fetchJson, json } from "./_shared.js";

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`)
    return json(res, 401, { error: "未授权" });
  try {
    const origin = `https://${req.headers.host}`;
    const trends = await fetchJson(`${origin}/api/trends`);
    const keywords = (process.env.MONITOR_KEYWORDS || "")
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);
    const hot = trends.topics
      .filter(
        (x) =>
          x.score >= Number(process.env.ALERT_SCORE || 88) &&
          (!keywords.length ||
            keywords.some((k) =>
              `${x.title} ${x.tag}`.toLowerCase().includes(k),
            )),
      )
      .slice(0, 5);
    if (hot.length && process.env.FEISHU_WEBHOOK_URL) {
      const text = `谷歌长尾词监控｜热点预警\n${hot.map((x, i) => `${i + 1}. ${x.title}（${x.score}分，${x.growth}）\n${x.url}`).join("\n")}\n监控词：${keywords.join("、") || "全部领域"}`;
      await fetchJson(process.env.FEISHU_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ msg_type: "text", content: { text } }),
      });
    }
    json(res, 200, {
      checked: trends.topics.length,
      alerted: hot.length,
      keywordCount: keywords.length,
    });
  } catch (error) {
    json(res, 502, { error: error.message });
  }
}
