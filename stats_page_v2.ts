// stats_page_v2.ts – 实验性 v2 看板（极客风格 / 炫酷 UI）
import { kvManager } from "./kv_manager.ts";

/**
 * 处理 v2 统计页面以及重置 / 清空统计等后端动作。
 * @param request Request 对象
 * @param clientKey 已通过鉴权的 master key（用于在页面内拼接表单隐藏字段）
 */
export async function handleStatsPageV2(request: Request, clientKey: string): Promise<Response> {
  // GET – 返回页面
  if (request.method === "GET") {
    const state = kvManager.getMemoryState();

    const statsHTML = `
      <!DOCTYPE html>
      <html lang="zh-CN">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>API Key 炫酷看板 v2</title>
          <style>
            :root {
              /* 清爽配色 */
              --color-bg: #f4f8fb; /* 页面淡蓝灰背景 */
              --color-card-bg: rgba(255, 255, 255, 0.8);
              --color-neon-1: #2c7be5; /* 主色 */
              --color-neon-2: #29c5ff; /* 渐变第二色 */
              --color-text-main: #212529; /* 深色文字 */
              --color-accent: #17a673;
            }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              font-family: "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background: var(--color-bg);
              color: var(--color-text-main);
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: flex-start;
              padding: 40px 20px;
              overflow-x: hidden;
            }
            /* 背景动画 */
            .gradient-bg {
              position: fixed;
              top: -50%;
              left: -50%;
              width: 200%;
              height: 200%;
              background: radial-gradient(circle at 25% 25%, var(--color-neon-2) 0%, transparent 60%),
                          radial-gradient(circle at 75% 75%, var(--color-neon-1) 0%, transparent 60%);
              animation: rotate 20s linear infinite;
              z-index: -2;
              filter: blur(120px) opacity(0.5);
            }
            @keyframes rotate { to { transform: rotate(360deg); } }

            .container {
              width: 100%;
              max-width: 1100px;
              backdrop-filter: blur(20px) saturate(160%);
              background: var(--color-card-bg);
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 16px;
              padding: 40px 50px;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            }

            .title {
              font-size: 3rem;
              font-weight: 800;
              text-align: center;
              background: linear-gradient(90deg, var(--color-neon-1), var(--color-neon-2));
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              filter: drop-shadow(0 0 6px var(--color-neon-1));
              animation: flicker 3s infinite alternate;
            }
            @keyframes flicker {
              0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 0.99; }
              20%, 24%, 55% { opacity: 0.4; }
            }

            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
              gap: 25px;
              margin-top: 40px;
            }
            .stat-card {
              padding: 25px 30px;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 12px;
              text-align: center;
              transition: transform 0.25s ease, box-shadow 0.25s ease;
            }
            .stat-card:hover {
              transform: translateY(-6px) scale(1.03);
              box-shadow: 0 0 12px var(--color-neon-1);
            }
            .stat-value {
              font-size: 2rem;
              font-weight: 700;
              margin-bottom: 6px;
              color: var(--color-accent);
            }
            .stat-label { font-size: 0.95rem; letter-spacing: 1px; opacity: 0.9; }

            .key-list {
              list-style: none;
              padding: 0;
              margin-top: 50px;
            }
            .key-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 18px 22px;
              background: rgba(255, 255, 255, 0.04);
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 10px;
              margin-bottom: 15px;
              transition: background 0.25s ease, transform 0.25s ease;
            }
            .key-item:hover {
              background: rgba(255, 255, 255, 0.08);
              transform: translateX(6px);
            }
            .key-index { font-weight: 600; color: var(--color-neon-2); min-width: 80px; }
            .key-value {
              font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
              word-break: break-all;
              color: var(--color-text-main);
              opacity: 0.9;
              flex: 1;
              margin: 0 10px;
            }
            .key-count { font-weight: 700; color: var(--color-neon-1); min-width: 80px; text-align: right; }

            .actions { text-align: center; margin-top: 50px; display: flex; flex-direction: column; gap: 16px; }
            .btn {
              appearance: none;
              padding: 14px 38px;
              font-size: 1rem;
              font-weight: 700;
              border: none;
              border-radius: 50px;
              cursor: pointer;
              background: linear-gradient(90deg, var(--color-neon-1), var(--color-neon-2));
              color: #000;
              box-shadow: 0 0 12px var(--color-neon-1);
              transition: transform 0.25s ease, box-shadow 0.25s ease;
            }
            .btn:hover { transform: translateY(-4px); box-shadow: 0 0 18px var(--color-neon-2); }
            .btn:active { transform: translateY(0); }
            .link {
              text-align: center;
              margin-top: 30px;
              color: var(--color-neon-1);
              text-decoration: underline;
              cursor: pointer;
              font-size: 0.95rem;
            }
          </style>
        </head>
        <body>
          <div class="gradient-bg"></div>
          <div class="container">
            <h1 class="title">🚀 API Key Geek Dashboard v2</h1>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${state.totalRequests}</div>
                <div class="stat-label">总请求数</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">v${state.version}</div>
                <div class="stat-label">状态版本</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${state.keyIndex}</div>
                <div class="stat-label">当前 Key 索引</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${state.lastSync > 0 ? new Date(state.lastSync).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '尚未同步'}</div>
                <div class="stat-label">上次同步时间</div>
              </div>
            </div>

            <ul class="key-list">
              ${Object.entries(state.stats).length > 0 ? Object.entries(state.stats).map(([key, count], index) => `
                <li class="key-item">
                  <span class="key-index">#${index + 1}</span>
                  <code class="key-value">${key}</code>
                  <span class="key-count">${count} 次</span>
                </li>
              `).join("") : '<li style="text-align:center; opacity:0.6;">暂无统计</li>'}
            </ul>

            <div class="actions">
              <form action="/reset" method="POST">
                <input type="hidden" name="key" value="${clientKey}" />
                <button type="submit" class="btn">⚠️ 重置全部 KV 状态</button>
              </form>
              <form action="/clearstats" method="POST">
                <input type="hidden" name="key" value="${clientKey}" />
                <button type="submit" class="btn" style="background: linear-gradient(90deg, var(--color-neon-2), var(--color-neon-1));">🧹 清空统计数据</button>
              </form>
            </div>
            <div class="link" onclick="location.href='/stats?key=${clientKey}'">返回经典看板 →</div>
          </div>
        </body>
      </html>`;

    return new Response(statsHTML, { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  // POST – 执行动作，与 v1 共用相同逻辑
  if (request.method === "POST") {
    const { pathname } = new URL(request.url);
    if (pathname === "/reset") {
      await kvManager.resetKvStore();
      return new Response("✅ KV 存储和状态已重置。", { status: 200 });
    }
    if (pathname === "/clearstats") {
      await kvManager.clearStats();
      return new Response("✅ 统计数据已清空。", { status: 200 });
    }
  }

  return new Response("❌ 无效操作", { status: 400 });
}
