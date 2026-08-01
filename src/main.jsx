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
import "./pages.css";

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
const pages = [
  { id: "dashboard", icon: LayoutDashboard, label: "今日脉搏" },
  { id: "radar", icon: Radio, label: "热点雷达" },
  { id: "create", icon: PenLine, label: "智能创作" },
  { id: "assets", icon: FileText, label: "内容资产" },
  { id: "publish", icon: BookOpen, label: "发布中心" },
];
function Nav({ active, onSelect }) {
  return (
    <aside>
      <div className="brand">
        <span>澎</span>
        <b>澎湃台</b>
      </div>
      <nav>
        {pages.map(({ id, icon: I, label }, i) => (
          <button
            className={active === id ? "active" : ""}
            key={id}
            onClick={() => onSelect(id)}
            aria-current={active === id ? "page" : undefined}
          >
            <I size={18} />
            {label}
            {i === 1 && <em>LIVE</em>}
          </button>
        ))}
        <button
          className={`mobileSettings ${active === "settings" ? "active" : ""}`}
          onClick={() => onSelect("settings")}
          aria-current={active === "settings" ? "page" : undefined}
        >
          <Settings2 size={18} />
          设置
        </button>
      </nav>
      <div className="asideFoot">
        <button
          className={active === "settings" ? "active" : ""}
          onClick={() => onSelect("settings")}
          aria-current={active === "settings" ? "page" : undefined}
        >
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
function Editor({ topic, style, onClose, onNotice, onGenerated }) {
  const [phase, setPhase] = useState("generating"),
    [article, setArticle] = useState(null),
    [selectedTitle, setSelectedTitle] = useState(""),
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
        setSelectedTitle(x.article.titles?.[0] || topic.title || topic);
        onGenerated?.({
          ...x.article,
          id: crypto.randomUUID(),
          topic: topic.title || topic,
          style,
          createdAt: new Date().toISOString(),
          status: "draft",
        });
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
          title: selectedTitle || article.titles?.[0] || topic.title,
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
                    <button
                      className={selectedTitle === t ? "chosen" : ""}
                      key={t}
                      onClick={() => setSelectedTitle(t)}
                    >
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
  const [active, setActive] = useState(
      () => location.hash.replace("#", "") || "dashboard",
    ),
    [style, setStyle] = useState("深度洞察"),
    [query, setQuery] = useState(""),
    [topics, setTopics] = useState(fallback),
    [status, setStatus] = useState("loading"),
    [updated, setUpdated] = useState(""),
    [selected, setSelected] = useState(null),
    [toast, setToast] = useState(""),
    [watchInput, setWatchInput] = useState(""),
    [services, setServices] = useState(null),
    [assets, setAssets] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem("pulse-assets")) || [];
      } catch {
        return [];
      }
    }),
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
  useEffect(() => {
    api("/api/status")
      .then(setServices)
      .catch(() => setServices(null));
  }, []);
  const selectPage = (id) => {
    setActive(id);
    history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const saveAsset = (item) => {
    setAssets((current) => {
      const next = [item, ...current].slice(0, 30);
      localStorage.setItem("pulse-assets", JSON.stringify(next));
      return next;
    });
  };
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
  const pageMeta = {
    dashboard: ["早上好，今天有什么值得写？", "今日内容机会与运行概览"],
    radar: ["热点雷达", "浏览全部实时话题，筛选值得跟进的信号"],
    create: ["智能创作", "从主题到有信源初稿的完整工作流"],
    assets: ["内容资产", "管理已生成文章与历史草稿"],
    publish: ["发布中心", "检查服务连接并管理公众号发布"],
    settings: ["工作台设置", "查看数据源、模型、监控与发布配置"],
  }[active] || ["澎湃台", "内容运营工作台"];
  return (
    <div className="app">
      <Nav active={active} onSelect={selectPage} />
      <main>
        <header>
          <div>
            <small>
              {new Intl.DateTimeFormat("zh-CN", { dateStyle: "full" }).format(
                new Date(),
              )}
            </small>
            <h1>{pageMeta[0]}</h1>
            <p className="pageSubtitle">{pageMeta[1]}</p>
          </div>
          <div className="actions">
            <button
              className="icon"
              aria-label="搜索热点"
              onClick={() => selectPage("radar")}
            >
              <Search size={18} />
            </button>
            <button
              className="icon"
              aria-label="查看通知"
              onClick={() =>
                setToast(`监控运行正常，当前命中 ${stats.match} 个主题热点`)
              }
            >
              <Bell size={18} />
              <i />
            </button>
            <button className="primary" onClick={generate}>
              <Sparkles size={17} />
              开始创作
            </button>
          </div>
        </header>
        {active === "dashboard" && (
          <>
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
                  <button
                    key={k}
                    onClick={() => removeWatch(k)}
                    title="点击移除"
                  >
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
              <button onClick={() => selectPage("radar")}>
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
                    <div
                      className="score"
                      style={{ "--p": `${t.score * 3.6}deg` }}
                    >
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
          </>
        )}
        {active === "radar" && (
          <section className="pageView">
            <div className="pageToolbar">
              <div>
                <b>{topics.length}</b>
                <span>实时话题</span>
              </div>
              <div>
                <b>{stats.rising}</b>
                <span>高热信号</span>
              </div>
              <div>
                <b>{stats.match}</b>
                <span>命中监控</span>
              </div>
              <button onClick={load}>
                <RefreshCw className={status === "loading" ? "spin" : ""} />
                刷新数据
              </button>
            </div>
            <div className="radarList">
              {topics.map((t, i) => (
                <article
                  key={t.id}
                  onClick={() => {
                    setQuery(t.title);
                    setSelected(t);
                  }}
                >
                  <span className="radarRank">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <small>
                      {t.tag} · {t.source}
                    </small>
                    <h3>{t.title}</h3>
                    <p>
                      <b>{t.score}</b> 热度 · {t.growth} · {t.time}
                    </p>
                  </div>
                  <ChevronRight />
                </article>
              ))}
            </div>
          </section>
        )}
        {active === "create" && (
          <section className="pageView createPage">
            <div className="createHero">
              <span>
                <Sparkles />
              </span>
              <small>AI 主编工作流</small>
              <h2>输入一个值得讨论的主题</h2>
              <p>
                系统会关联热点信源，生成三个标题、摘要、正文、引用和风险提示。
              </p>
            </div>
            <div className="bigComposer">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="例如：AI Agent 为什么正在重塑一人公司？"
              />
              <div>
                <span>目标风格</span>
                {styles.map((s) => (
                  <button
                    key={s}
                    className={s === style ? "selected" : ""}
                    onClick={() => setStyle(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                className="generateButton"
                onClick={generate}
                disabled={!query.trim()}
              >
                <Sparkles />
                生成公众号文章
              </button>
            </div>
          </section>
        )}
        {active === "assets" && (
          <section className="pageView">
            <div className="assetHead">
              <div>
                <h2>文章库</h2>
                <p>生成完成后会自动保存在当前浏览器。</p>
              </div>
              <button onClick={() => selectPage("create")}>
                <PenLine />
                新建文章
              </button>
            </div>
            {assets.length === 0 ? (
              <div className="emptyState">
                <FileText />
                <h3>还没有内容资产</h3>
                <p>从智能创作生成第一篇文章，它会自动出现在这里。</p>
                <button onClick={() => selectPage("create")}>开始创作</button>
              </div>
            ) : (
              <div className="assetGrid">
                {assets.map((a) => (
                  <article key={a.id}>
                    <span>{a.style}</span>
                    <h3>{a.titles?.[0] || a.topic}</h3>
                    <p>{a.digest}</p>
                    <footer>
                      <small>
                        {new Date(a.createdAt).toLocaleString("zh-CN")}
                      </small>
                      <em>{a.status === "draft" ? "草稿" : "已发布"}</em>
                    </footer>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
        {active === "publish" && (
          <section className="pageView">
            <div className="connectionHero">
              <span className={services?.services?.wechat ? "ok" : "warn"}>
                {services?.services?.wechat ? <Check /> : <AlertCircle />}
              </span>
              <div>
                <small>微信公众号连接</small>
                <h2>
                  {services?.services?.wechat
                    ? "已连接，可以发布"
                    : "等待配置 AppID / AppSecret"}
                </h2>
                <p>
                  {services?.services?.wechat
                    ? "文章可保存草稿或提交正式发布。"
                    : "发布代码已经就绪，连接账号后即可完成真实草稿验证。"}
                </p>
              </div>
            </div>
            <div className="publishStats">
              <article>
                <b>{assets.length}</b>
                <span>内容资产</span>
              </article>
              <article>
                <b>{assets.filter((a) => a.status === "draft").length}</b>
                <span>待发布草稿</span>
              </article>
              <article>
                <b>{services?.services?.monitor ? "运行中" : "未连接"}</b>
                <span>自动监控</span>
              </article>
            </div>
            <div className="publishQueue">
              <h3>待发布内容</h3>
              {assets.length ? (
                assets.slice(0, 5).map((a) => (
                  <div key={a.id}>
                    <span>
                      <FileText />
                      <b>{a.titles?.[0] || a.topic}</b>
                    </span>
                    <small>
                      {a.style} ·{" "}
                      {new Date(a.createdAt).toLocaleDateString("zh-CN")}
                    </small>
                  </div>
                ))
              ) : (
                <p>暂无待发布内容，请先前往智能创作生成文章。</p>
              )}
            </div>
          </section>
        )}
        {active === "settings" && (
          <section className="pageView">
            <div className="settingsGrid">
              {[
                [
                  "热点数据源",
                  services?.services?.trends,
                  "Hacker News · V2EX",
                ],
                [
                  "DeepSeek 成文",
                  services?.services?.deepseek,
                  "多风格结构化文章",
                ],
                ["微信公众号", services?.services?.wechat, "草稿箱与正式发布"],
                ["飞书预警", services?.services?.feishu, "热点命中即时通知"],
                ["定时监控", services?.services?.monitor, "每日北京时间 09:00"],
              ].map(([name, ok, desc]) => (
                <article key={name}>
                  <span className={ok ? "statusOk" : "statusOff"}>
                    {ok ? <Check /> : <AlertCircle />}
                  </span>
                  <div>
                    <h3>{name}</h3>
                    <p>{desc}</p>
                  </div>
                  <em>{ok ? "运行正常" : "需要配置"}</em>
                </article>
              ))}
            </div>
            <div className="settingsNote">
              <Settings2 />
              <div>
                <h3>监控主题</h3>
                <p>
                  {services?.monitorKeywords?.join("、") ||
                    "未配置服务端监控词"}
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
      {selected && (
        <Editor
          topic={selected}
          style={style}
          onClose={() => setSelected(null)}
          onNotice={setToast}
          onGenerated={saveAsset}
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
