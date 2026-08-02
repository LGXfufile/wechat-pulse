import test from "node:test";
import assert from "node:assert/strict";
import { normalize } from "../api/trends.js";
import { buildPrompt } from "../api/generate.js";
import { toWechatHtml, getTemplates } from "../src/format.js";
test("热点评分生成完整字段", () => {
  const [x] = normalize([
    {
      id: "1",
      title: "AI Agent 新进展",
      source: "测试",
      url: "https://example.com",
      engagement: 120,
      createdAt: new Date().toISOString(),
    },
  ]);
  assert.equal(x.tag, "AI 科技");
  assert.ok(x.score >= 70);
  assert.match(x.growth, /^传播指数 \d+$/);
  assert.equal(x.engagement, 120);
});
test("生成提示词包含风格、信源与事实约束", () => {
  const x = buildPrompt({
    topic: "测试主题",
    style: "犀利评论",
    sources: [{ title: "来源", source: "官方", url: "https://example.com" }],
  });
  assert.match(x, /测试主题/);
  assert.match(x, /不得编造数据/);
  assert.match(x, /https:\/\/example.com/);
});
test("微信 HTML 转义危险标签", () => {
  const x = toWechatHtml("## 标题\n<script>alert(1)</script>\n**重点**");
  assert.match(x, /<h2[^>]*>标题<\/h2>/);
  assert.doesNotMatch(x, /<script>/);
  assert.match(x, /<strong>重点<\/strong>/);
  assert.match(x, /data-template="minimal"/);
});
test("微信排版模板均可生成内联样式", () => {
  for (const template of getTemplates()) {
    const html = toWechatHtml("## 标题\n> 引用", template.id);
    assert.match(html, /style=/);
    assert.match(html, new RegExp(`data-template="${template.id}"`));
  }
});
