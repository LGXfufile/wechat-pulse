export const visualStyles = [
  { id: "signal", label: "信号绿", description: "理性、克制、适合趋势洞察", accent: "#c7f55c" },
  { id: "editorial", label: "编辑红", description: "杂志感强，适合评论与观点", accent: "#dc6b5f" },
  { id: "warm", label: "叙事橙", description: "温暖、有温度，适合故事表达", accent: "#f0a35e" },
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const clean = (value = "") => value.replace(/[*_`#>\[\]]/g, "").trim();

export function planIllustrations(markdown = "", title = "", visualStyle = "signal") {
  const lines = markdown.split("\n");
  const wordCount = markdown.replace(/\s/g, "").length;
  const headings = lines
    .map((line, lineIndex) => ({ lineIndex, title: clean(line.replace(/^#{2,3}\s+/, "")) }))
    .filter((item) => /^#{2,3}\s+/.test(lines[item.lineIndex]));
  const count = clamp(Math.round(wordCount / 450), 2, 5);
  const purposes = ["核心观点", "趋势脉络", "关键转折", "方法框架", "行动启示"];
  const candidates = headings.length
    ? headings
    : lines
        .map((line, lineIndex) => ({ lineIndex, title: clean(line).slice(0, 22) }))
        .filter((item) => item.title.length > 10);
  return Array.from({ length: count }, (_, index) => {
    const slot = candidates.length
      ? candidates[Math.min(candidates.length - 1, Math.floor(((index + 0.65) * candidates.length) / count))]
      : { lineIndex: Math.floor(((index + 1) * lines.length) / (count + 1)), title: title || "主题洞察" };
    return {
      id: `ill-${index + 1}`,
      afterLine: slot.lineIndex,
      eyebrow: purposes[index],
      headline: slot.title || clean(title).slice(0, 24) || `文章配图 ${index + 1}`,
      caption: `${purposes[index]} · ${slot.title || clean(title).slice(0, 28)}`,
      visualStyle,
      index,
      total: count,
    };
  });
}

export function insertIllustrationMarkers(markdown = "", plans = []) {
  const withoutMarkers = markdown.replace(/^\{\{IMAGE:[^}]+\}\}\s*$/gm, "").replace(/\n{3,}/g, "\n\n");
  const lines = withoutMarkers.split("\n");
  [...plans]
    .sort((a, b) => b.afterLine - a.afterLine)
    .forEach((plan) => lines.splice(Math.min(lines.length, plan.afterLine + 1), 0, "", `{{IMAGE:${plan.id}}}`));
  return lines.join("\n");
}

function palette(style) {
  if (style === "editorial") return { bg: "#1b1212", panel: "#2b1918", accent: "#dc6b5f", soft: "#f4d9cc", ink: "#fff8f2" };
  if (style === "warm") return { bg: "#201710", panel: "#332419", accent: "#f0a35e", soft: "#f5dfbd", ink: "#fffaf1" };
  return { bg: "#0d120f", panel: "#172019", accent: "#c7f55c", soft: "#dce8cf", ink: "#f4f7f1" };
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) {
  const chars = [...text];
  const lines = [];
  let line = "";
  chars.forEach((char) => {
    if (ctx.measureText(line + char).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else line += char;
  });
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((item, i) => ctx.fillText(item, x, y + i * lineHeight));
}

export function renderIllustration(plan, articleTitle = "", seed = 0) {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 675;
  const ctx = canvas.getContext("2d");
  const p = palette(plan.visualStyle);
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, 1200, 675);
  const gradient = ctx.createRadialGradient(950, 90, 20, 950, 90, 550);
  gradient.addColorStop(0, `${p.accent}42`);
  gradient.addColorStop(1, `${p.accent}00`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 675);
  ctx.strokeStyle = `${p.soft}18`;
  ctx.lineWidth = 1;
  for (let x = 60; x < 1200; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 675); ctx.stroke();
  }
  for (let y = 75; y < 675; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke();
  }
  ctx.fillStyle = p.panel;
  ctx.beginPath(); ctx.roundRect(68, 64, 1064, 547, 28); ctx.fill();
  ctx.fillStyle = p.accent;
  ctx.fillRect(68, 64, 12, 547);
  ctx.font = "600 25px -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif";
  ctx.fillText(`澎湃台  /  ${plan.eyebrow}`, 124, 132);
  ctx.fillStyle = p.ink;
  ctx.font = "700 56px 'Noto Serif SC', 'Songti SC', serif";
  wrapText(ctx, plan.headline, 124, 255, 710, 78, 2);
  ctx.fillStyle = p.soft;
  ctx.font = "400 22px -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif";
  wrapText(ctx, clean(articleTitle), 126, 440, 680, 34, 2);
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 8;
  ctx.beginPath();
  const phase = (seed % 7) * 7;
  ctx.moveTo(865, 420 + phase);
  ctx.bezierCurveTo(915, 365, 930, 470, 980, 350);
  ctx.bezierCurveTo(1020, 255, 1055, 330, 1085, 190 + phase);
  ctx.stroke();
  ctx.fillStyle = p.accent;
  ctx.font = "700 72px -apple-system, sans-serif";
  ctx.fillText(String(plan.index + 1).padStart(2, "0"), 918, 220);
  ctx.fillStyle = p.soft;
  ctx.font = "500 18px -apple-system, sans-serif";
  ctx.fillText(`VISUAL ${plan.index + 1} / ${plan.total}`, 126, 555);
  return canvas.toDataURL("image/jpeg", 0.86);
}

export function generateIllustrations(markdown, title, visualStyle = "signal", seed = 0) {
  return planIllustrations(markdown, title, visualStyle).map((plan) => ({
    ...plan,
    dataUrl: renderIllustration(plan, title, seed),
  }));
}
