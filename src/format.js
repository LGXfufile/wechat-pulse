const themes = {
  minimal: {
    accent: "#111111",
    muted: "#777777",
    bg: "#ffffff",
    label: "极简留白",
  },
  editorial: {
    accent: "#9b2c2c",
    muted: "#76675f",
    bg: "#fffaf3",
    label: "编辑杂志",
  },
  insight: {
    accent: "#31572c",
    muted: "#64705f",
    bg: "#f7faf4",
    label: "深度洞察",
  },
};
const escape = (value = "") =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (value) =>
  escape(value)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[(\d+)\]/g, '<sup style="color:#999;font-size:10px">[$1]</sup>');
export function toWechatHtml(markdown = "", template = "minimal", illustrations = []) {
  const theme = themes[template] || themes.minimal;
  const illustrationMap = new Map(illustrations.map((item) => [item.id, item]));
  const body = markdown
    .split("\n")
    .map((line) => {
      const value = line.trim();
      const marker = value.match(/^\{\{IMAGE:([^}]+)\}\}$/);
      if (marker) {
        const illustration = illustrationMap.get(marker[1]);
        if (!illustration) return `<!--IMAGE:${marker[1]}-->`;
        const src = illustration.url || illustration.dataUrl || "";
        if (!/^(data:image\/(?:png|jpeg);base64,|https:\/\/)/.test(src)) return "";
        return `<figure data-image-id="${escape(illustration.id)}" style="margin:24px 0 28px"><img src="${src}" alt="${escape(illustration.headline || illustration.caption || "文章配图")}" style="display:block;width:100%;height:auto;border-radius:10px"/><figcaption style="margin-top:8px;color:${theme.muted};font-size:11px;line-height:1.6;text-align:center">${inline(illustration.caption || "")}</figcaption></figure>`;
      }
      if (value.startsWith("### "))
        return `<h3 style="margin:26px 0 10px;color:${theme.accent};font-size:17px;line-height:1.5">${inline(value.slice(4))}</h3>`;
      if (value.startsWith("## "))
        return `<h2 style="margin:34px 0 14px;padding-left:12px;border-left:4px solid ${theme.accent};color:${theme.accent};font-size:20px;line-height:1.45">${inline(value.slice(3))}</h2>`;
      if (value.startsWith("# "))
        return `<h1 style="margin:10px 0 24px;color:${theme.accent};font-size:25px;line-height:1.4;text-align:center">${inline(value.slice(2))}</h1>`;
      if (value.startsWith("> "))
        return `<blockquote style="margin:20px 0;padding:14px 16px;background:${theme.bg};border-left:3px solid ${theme.accent};color:${theme.muted};font-size:14px;line-height:1.8">${inline(value.slice(2))}</blockquote>`;
      if (/^[-*] /.test(value))
        return `<p style="margin:8px 0;padding-left:16px;color:#333;font-size:15px;line-height:1.85">• ${inline(value.slice(2))}</p>`;
      if (!value) return '<p style="margin:8px 0"><br/></p>';
      return `<p style="margin:14px 0;color:#333;font-size:15px;line-height:1.9;letter-spacing:.02em;text-align:justify">${inline(value)}</p>`;
    })
    .join("");
  return `<section data-template="${template}" style="max-width:677px;margin:0 auto;padding:24px 18px;background:${theme.bg};font-family:-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif">${body}</section>`;
}
export function getTemplates() {
  return Object.entries(themes).map(([id, value]) => ({ id, ...value }));
}
