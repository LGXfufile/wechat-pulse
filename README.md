# 澎湃台 · 微信公众号热点发布助手

面向中文内容团队的热点决策与创作工作台。聚合 Hacker News 与 V2EX 实时热点，按时效、互动与增速评分；使用 DeepSeek 生成多风格、有信源的公众号文章，并通过微信官方 API 保存草稿或提交发布。

## 本地运行

```bash
npm install
npm run dev
```

## 生产配置

在 Vercel 项目环境变量中配置：

- `DEEPSEEK_API_KEY`：文章生成
- `WECHAT_APP_ID` / `WECHAT_APP_SECRET`：微信公众号官方 API
- `CRON_SECRET`：定时监控鉴权
- `FEISHU_WEBHOOK_URL`：热点预警机器人
- `ALERT_SCORE`：预警阈值，默认 88

密钥仅由服务端读取，不写入前端或 Git。发布时服务端自动准备并上传封面素材；默认保存草稿，用户明确确认后才提交发布。
