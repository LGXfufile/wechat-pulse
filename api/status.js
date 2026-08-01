import { json } from "./_shared.js";

export default function handler(req, res) {
  json(res, 200, {
    services: {
      trends: true,
      deepseek: Boolean(process.env.DEEPSEEK_API_KEY),
      wechat: Boolean(
        process.env.WECHAT_APP_ID && process.env.WECHAT_APP_SECRET,
      ),
      feishu: Boolean(process.env.FEISHU_WEBHOOK_URL),
      monitor: Boolean(process.env.CRON_SECRET),
    },
    monitorKeywords: (process.env.MONITOR_KEYWORDS || "")
      .split(",")
      .filter(Boolean),
    checkedAt: new Date().toISOString(),
  });
}
