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
              --color-bg: #f0f4f8;
              --color-card-bg: rgba(255, 255, 255, 0.45);
              --color-border: rgba(255, 255, 255, 0.7);
              --color-neon-1: #2c7be5;
              --color-neon-2: #29c5ff;
              --color-text-main: #122;
              --color-accent: #17a673;
            }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              font-family: "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: var(--color-text-main);
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 40px 20px;
              overflow-x: hidden;
            }
            .background {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: -1;
              background-color: var(--color-bg);
            }
            .background::before {
              content: '';
              position: absolute;
              top: -50%;
              left: -50%;
              width: 200%;
              height: 200%;
              background: radial-gradient(circle at 25% 25%, var(--color-neon-2) 0%, transparent 50%),
                          radial-gradient(circle at 75% 75%, var(--color-neon-1) 0%, transparent 50%);
              animation: rotate 20s linear infinite;
              filter: blur(100px) opacity(0.6);
            }
            @keyframes rotate { to { transform: rotate(360deg); } }

            .container {
              width: 100%;
              max-width: 800px;
              backdrop-filter: blur(20px) saturate(150%);
              -webkit-backdrop-filter: blur(20px) saturate(150%);
              background: var(--color-card-bg);
              border: 1px solid var(--color-border);
              border-radius: 24px;
              padding: 30px 40px;
              box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
            }

            .title {
              font-size: 2.5rem;
              font-weight: 700;
              text-align: center;
              color: var(--color-text-main);
              margin-bottom: 30px;
            }

            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 20px;
              margin-bottom: 30px;
            }
            .stat-card {
              padding: 20px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 16px;
              text-align: center;
            }
            .stat-value {
              font-size: 1.8rem;
              font-weight: 600;
              color: var(--color-neon-1);
            }
            .stat-label { font-size: 0.85rem; opacity: 0.8; }

            .key-list {
              list-style: none;
              padding: 0;
            }
            .key-item {
              display: flex;
              align-items: center;
              padding: 12px 16px;
              margin-bottom: 10px;
              border-radius: 12px;
              transition: background 0.2s ease;
            }
            .key-item:hover { background: rgba(255, 255, 255, 0.2); }
            .key-index { font-weight: 500; color: var(--color-neon-1); min-width: 60px; font-size: 0.9rem; }
            .key-value {
              font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
              word-break: break-all;
              color: var(--color-text-main);
              flex: 1;
              margin: 0 10px;
              font-size: 0.9rem;
            }
            .key-count { font-weight: 600; color: var(--color-accent); min-width: 60px; text-align: right; font-size: 0.9rem; }

            .actions { text-align: center; margin-top: 30px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
            .btn {
              appearance: none;
              padding: 12px 30px;
              font-size: 0.95rem;
              font-weight: 500;
              border: 1px solid transparent;
              border-radius: 50px;
              cursor: pointer;
              background: var(--color-neon-1);
              color: white;
              transition: all 0.25s ease;
            }
            .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(44, 123, 229, 0.4); }
            .link {
              margin-top: 15px;
              color: var(--color-neon-1);
              text-decoration: none;
              cursor: pointer;
              font-size: 0.9rem;
              opacity: 0.8;
            }
            .link:hover { text-decoration: underline; }
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
