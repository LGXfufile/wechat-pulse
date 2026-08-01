import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertCircle,
  ArrowUpRight,
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Flame,
  LayoutDashboard,
  LoaderCircle,
  PenLine,
  Radio,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import "./styles.css";
import "./editor.css";
import "./watch.css";

const fallback = [
  {
    id: "demo",
    tag: "产品说明",
    title: "正在连接全球热点源…",
    source: "系统",
    score: 0,
    growth: "--",
    time: "刚刚",
    tone: "加载中",
    color: "#c7f55c",
  },
];
const styles = ["深度洞察", "故事叙事", "犀利评论", "温暖共鸣", "知识科普"];
async function api(path, options) {
  const r = await fetch(path, options);
  const data = await r.json();
  if (!r.ok)
    throw Object.assign(new Error(data.error || "请求失败"), {
      code: data.code,
    });
  return data;
}
function Nav() {
  return (
    <aside>
      <div className="brand">
        <span>澎</span>
        <b>澎湃台</b>
      </div>
      <nav>
        {[
          [LayoutDashboard, "今日脉搏"],
          [Radio, "热点雷达"],
          [PenLine, "智能创作"],
          [FileText, "内容资产"],
          [BookOpen, "发布中心"],
        ].map(([I, t], i) => (
          <button className={i === 0 ? "active" : ""} key={t}>
            <I size={18} />
            {t}
            {i === 1 && <em>LIVE</em>}
          </button>
        ))}
      </nav>
      <div className="asideFoot">
        <button>
          <Settings2 size={18} />
          工作台设置
        </button>
        <div className="user">
          <div>光</div>
          <span>
            <b>光新工作室</b>
            <small>实时数据 · 安全发布</small>
          </span>
        </div>
      </div>
    </aside>
  );
}
function Editor({ topic, style, onClose, onNotice }) {
  const [phase, setPhase] = useState("generating"),
    [article, setArticle] = useState(null),
    [error, setError] = useState(""),
    [publishing, setPublishing] = useState(false);
  useEffect(() => {
    api("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: topic.title || topic,
        style,
        sources: topic.url ? [topic] : [],
      }),
    })
      .then((x) => {
        setArticle(x.article);
        setPhase("ready");
      })
      .catch((e) => {
        setError(e.message);
        setPhase("error");
      });
  }, []);
  const publish = async (action) => {
    setPublishing(true);
    setError("");
    try {
      const x = await api("/api/wechat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: article.titles?.[0] || topic.title,
          digest: article.digest,
          content: article.content,
          sourceUrl: topic.url,
          action,
        }),
      });
      onNotice(
        x.status === "draft"
          ? "已保存至微信公众号草稿箱"
          : "已提交微信公众号发布审核",
      );
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setPublishing(false);
    }
  };
  return (
    <div className="overlay" onClick={onClose}>
      <div className="editor" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose}>
          ×
        </button>
        {phase === "generating" && (
          <div className="loadingState">
            <LoaderCircle className="spin" />
            <small>DeepSeek 主编正在工作</small>
            <h2>检索信源、提炼观点并撰写初稿…</h2>
            <p>生成通常需要 15–40 秒，请稍候。</p>
          </div>
        )}
        {phase === "error" && (
          <div className="errorState">
            <AlertCircle />
            <small>需要完成服务配置</small>
            <h2>{error}</h2>
            <p>密钥只保存在 Vercel 环境变量中，不会发送到浏览器。</p>
            <button onClick={onClose}>返回工作台</button>
          </div>
        )}
        {phase === "ready" && article && (
          <>
            <div className="editorHead">
              <span>
                <Sparkles />
              </span>
              <div>
                <small>{style} · 已完成事实边界检查</small>
                <h2>{article.titles?.[0] || topic.title}</h2>
                <p>{article.digest}</p>
              </div>
            </div>
            <div className="editorGrid">
              <div className="articlePreview">
                <div className="titleOptions">
                  {article.titles?.map((t, i) => (
                    <button className={i === 0 ? "chosen" : ""} key={t}>
                      {i + 1}. {t}
                    </button>
                  ))}
                </div>
                <pre>{article.content}</pre>
              </div>
              <div className="publishPanel">
                <h3>发布前检查</h3>
                <ul>
                  <li>
                    <Check />
                    标题与摘要已生成
                  </li>
                  <li>
                    <Check />
                    引用信源 {article.citations?.length || 0} 个
                  </li>
                  <li>
                    <Check />
                    风险提示 {article.riskNotes?.length || 0} 项
                  </li>
                  <li>
                    <Check />
                    封面将自动上传素材库
                  </li>
                </ul>
                {article.riskNotes?.length > 0 && (
                  <div className="risk">{article.riskNotes.join("；")}</div>
                )}
                <button disabled={publishing} onClick={() => publish("draft")}>
                  <BookOpen />
                  {publishing ? "正在上传并提交…" : "一键保存到草稿箱"}
                </button>
                <button
                  className="direct"
                  disabled={publishing}
                  onClick={() => publish("publish")}
                >
                  确认并一键发布
                </button>
                <small>
                  自动准备封面 · 正式发布仍受公众号权限与平台审核约束
                </small>
                {error && <p className="inlineError">{error}</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
function App() {
  const [style, setStyle] = useState("深度洞察"),
    [query, setQuery] = useState(""),
    [topics, setTopics] = useState(fallback),
    [status, setStatus] = useState("loading"),
    [updated, setUpdated] = useState(""),
    [selected, setSelected] = useState(null),
    [toast, setToast] = useState(""),
    [watchInput, setWatchInput] = useState(""),
    [watchlist, setWatchlist] = useState(() => {
      try {
        return (
          JSON.parse(localStorage.getItem("pulse-watchlist")) || [
            "AI",
            "出海",
            "创业",
          ]
        );
      } catch {
        return ["AI", "出海", "创业"];
      }
    });
  const load = () => {
    setStatus("loading");
    api("/api/trends")
      .then((x) => {
        let previous = {};
        try {
          previous = JSON.parse(localStorage.getItem("pulse-snapshot")) || {};
        } catch {}
        const next = x.topics.map((topic) => {
          const old = previous[topic.id];
          const delta = old == null ? null : topic.score - old;
          return {
            ...topic,
            growth:
              delta == null
                ? topic.growth
                : delta === 0
                  ? "本轮持平"
                  : `${delta > 0 ? "+" : ""}${delta} 分`,
          };
        });
        localStorage.setItem(
          "pulse-snapshot",
          JSON.stringify(Object.fromEntries(next.map((x) => [x.id, x.score]))),
        );
        setTopics(next);
        setUpdated(x.updatedAt);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  };
  useEffect(load, []);
  const stats = useMemo(
    () => ({
      total: topics.length,
      rising: topics.filter((x) => x.score >= 80).length,
      match: topics.filter((x) =>
        watchlist.some((k) =>
          `${x.title} ${x.tag}`.toLowerCase().includes(k.toLowerCase()),
        ),
      ).length,
    }),
    [topics, watchlist],
  );
  const addWatch = () => {
    const keyword = watchInput.trim();
    if (!keyword || watchlist.includes(keyword)) return;
    const next = [...watchlist, keyword];
    setWatchlist(next);
    localStorage.setItem("pulse-watchlist", JSON.stringify(next));
    setWatchInput("");
  };
  const removeWatch = (keyword) => {
    const next = watchlist.filter((x) => x !== keyword);
    setWatchlist(next);
    localStorage.setItem("pulse-watchlist", JSON.stringify(next));
  };
  const generate = () =>
    setSelected(
      query.trim() ? { title: query.trim(), source: "自定义主题" } : topics[0],
    );
  return (
    <div className="app">
      <Nav />
      <main>
        <header>
          <div>
            <small>
              {new Intl.DateTimeFormat("zh-CN", { dateStyle: "full" }).format(
                new Date(),
              )}
            </small>
            <h1>早上好，今天有什么值得写？</h1>
          </div>
          <div className="actions">
            <button className="icon" aria-label="搜索">
              <Search size={18} />
            </button>
            <button className="icon" aria-label="通知">
              <Bell size={18} />
              <i />
            </button>
            <button className="primary" onClick={generate}>
              <Sparkles size={17} />
              开始创作
            </button>
          </div>
        </header>
        <section className="pulse">
          <div className="pulseTop">
            <div>
              <span className="live">
                <i />
                LIVE
              </span>
              <p>海内外热点脉搏</p>
            </div>
            <button className="refresh" onClick={load}>
              <RefreshCw className={status === "loading" ? "spin" : ""} />
              {updated
                ? `更新于 ${new Date(updated).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`
                : "正在同步"}
            </button>
          </div>
          <div className="pulseGrid">
            <div>
              <strong>{stats.total}</strong>
              <span>当前追踪话题</span>
            </div>
            <div>
              <strong>{stats.rising}</strong>
              <span>正在快速升温</span>
            </div>
            <div>
              <strong>{stats.match}</strong>
              <span>命中监控主题</span>
            </div>
            <div className="wave">
              <svg viewBox="0 0 300 62">
                <path d="M0 51 C35 45 45 50 65 33 S98 42 120 29 S151 36 174 16 S208 38 231 21 S266 18 300 5" />
                <path
                  className="glow"
                  d="M0 51 C35 45 45 50 65 33 S98 42 120 29 S151 36 174 16 S208 38 231 21 S266 18 300 5"
                />
              </svg>
              <span>
                <TrendingUp />
                实时评分：时效 × 互动 × 增速
              </span>
            </div>
          </div>
          {status === "error" && (
            <div className="sourceError">
              部分热点源连接失败，点击右上角重新同步。
            </div>
          )}
        </section>
        <section className="watchbar">
          <div>
            <Radio size={16} />
            <b>主题监控</b>
            {watchlist.map((k) => (
              <button key={k} onClick={() => removeWatch(k)} title="点击移除">
                {k}
                <span>×</span>
              </button>
            ))}
          </div>
          <label>
            <input
              value={watchInput}
              onChange={(e) => setWatchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addWatch()}
              placeholder="添加监控词"
            />
            <button onClick={addWatch}>添加</button>
          </label>
        </section>
        <div className="sectionHead">
          <div>
            <h2>为你精选</h2>
            <p>真实数据来自 Hacker News 与 V2EX，点击话题即可带入创作</p>
          </div>
          <button onClick={load}>
            刷新热点 <ArrowUpRight />
          </button>
        </div>
        <section className="topics">
          {topics.slice(0, 6).map((t, i) => (
            <article
              key={t.id}
              onClick={() => {
                setQuery(t.title);
                setSelected(t);
              }}
            >
              <div className="rank">{String(i + 1).padStart(2, "0")}</div>
              <div className="topicBody">
                <div className="meta">
                  <span style={{ "--c": t.color }}>{t.tag}</span>
                  <small>{t.source}</small>
                </div>
                <h3>{t.title}</h3>
                <div className="metrics">
                  <span>
                    <Flame />
                    热度 <b>{t.score}</b>
                  </span>
                  <span>
                    <TrendingUp />
                    <b>{t.growth}</b>
                  </span>
                  <span>
                    <Clock />
                    {t.time}
                  </span>
                </div>
              </div>
              <div className="topicSide">
                <div className="score" style={{ "--p": `${t.score * 3.6}deg` }}>
                  <b>{t.score || "·"}</b>
                </div>
                <small>{t.tone}</small>
              </div>
            </article>
          ))}
        </section>
        <section className="create">
          <div className="createIntro">
            <span>
              <Zap />
            </span>
            <div>
              <h2>把一个想法，变成一篇有信源的好文章</h2>
              <p>输入主题，AI 会按你选择的风格完成可编辑初稿。</p>
            </div>
          </div>
          <div className="composer">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generate()}
              placeholder="例如：AI Agent 为什么正在改变小团队？"
            />
            <button onClick={generate} aria-label="生成文章">
              <ChevronRight />
            </button>
          </div>
          <div className="styleRow">
            <small>写作风格</small>
            {styles.map((s) => (
              <button
                onClick={() => setStyle(s)}
                className={s === style ? "selected" : ""}
                key={s}
              >
                {s === style && <Check />}
                {s}
              </button>
            ))}
          </div>
        </section>
      </main>
      {selected && (
        <Editor
          topic={selected}
          style={style}
          onClose={() => setSelected(null)}
          onNotice={setToast}
        />
      )}{" "}
      {toast && (
        <div className="toast">
          <Check />
          {toast}
          <button onClick={() => setToast("")}>×</button>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
