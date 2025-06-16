// stats_page.ts
import { kvManager } from "./kv_manager.ts";

export async function handleStatsPage(request: Request, clientKey: string): Promise<Response> {
  // GET请求 - 显示统计页面
  if (request.method === "GET") {
    // 一次性获取状态快照，保证数据一致性
    const state = kvManager.getMemoryState();
    const statsHTML = `
      <!DOCTYPE html>
      <html lang="zh-CN">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>API Key 统计看板</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
              background-color: #f8f9fa; /* 更浅的背景灰 */
              color: #343a40; /* 深色文本 */
              margin: 0;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              min-height: 100vh;
              box-sizing: border-box;
            }
            .container {
              max-width: 900px; /* 稍微加宽 */
              width: 100%;
              background-color: #ffffff;
              padding: 30px;
              border-radius: 12px; /* 更圆的角 */
              box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08); /* 更柔和的阴影 */
              margin-top: 20px;
              margin-bottom: 20px;
            }
            .stats-header {
              text-align: center;
              margin-bottom: 35px;
              padding-bottom: 25px;
              border-bottom: 1px solid #e9ecef;
            }
            .stats-header h1 {
              color: #007bff; /* 鲜艳的蓝色 */
              margin-bottom: 15px;
              font-size: 2.2em; /* 稍大标题 */
              font-weight: 600;
            }
            .stats-summary {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); /* 响应式网格 */
              gap: 20px; /* 网格间距 */
              margin-bottom: 35px;
              text-align: left;
            }
            .summary-item {
              background-color: #f1f3f5; /* 项目背景 */
              padding: 20px;
              border-radius: 8px;
              border: 1px solid #dee2e6;
            }
            .summary-item-label {
              font-size: 0.9em;
              color: #6c757d; /* 标签颜色 */
              margin-bottom: 8px;
              display: block;
            }
            .summary-item-value {
              font-size: 1.2em;
              font-weight: 600;
              color: #212529;
            }
            .summary-item-value strong {
              color: #007bff;
            }
            .summary-item-value code {
              background-color: #e9ecef;
              padding: 3px 6px;
              border-radius: 4px;
              font-size: 0.85em;
              word-break: break-all;
              color: #c92a2a; /* 代码用深红色 */
            }
            h2.list-title {
              text-align: center;
              color: #343a40;
              margin-top: 40px;
              margin-bottom: 25px;
              font-size: 1.8em;
              font-weight: 600;
            }
            .key-list {
              list-style: none;
              padding: 0;
              margin-bottom: 30px;
            }
            .key-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 18px 20px; /* 增加内边距 */
              border: 1px solid #e0e0e0;
              border-radius: 8px;
              margin-bottom: 12px;
              background-color: #fff;
              box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
              transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
            }
            .key-item:hover {
              transform: translateY(-3px) scale(1.01); /* 悬停效果 */
              box-shadow: 0 5px 12px rgba(0, 0, 0, 0.08);
            }
            .key-details {
              display: flex;
              align-items: center;
              gap: 18px; /* Key 索引和值的间距 */
              flex-grow: 1;
              overflow: hidden; /* 防止内容溢出 */
            }
            .key-index {
              font-weight: 700; /* 加粗 */
              color: #495057;
              min-width: 75px; /* 保证对齐 */
              font-size: 0.95em;
            }
            .key-value {
              font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
              color: #212529;
              word-break: break-all;
              font-size: 0.95em;
              background-color: #f8f9fa; /* 给 key 值一个浅色背景 */
              padding: 3px 6px;
              border-radius: 4px;
            }
            .key-count {
              font-weight: 700; /* 加粗 */
              color: #28a745; /* 绿色计数 */
              min-width: 90px;
              text-align: right;
              font-size: 1.1em; /* 稍大计数 */
            }
            .no-keys-message {
              text-align: center;
              padding: 20px;
              color: #6c757d;
              font-style: italic;
            }
            .reset-form {
              text-align: center;
              margin-top: 40px;
            }
            .reset-btn {
              background: linear-gradient(145deg, #e74c3c, #c0392b); /* 渐变红色 */
              color: white;
              border: none;
              padding: 14px 30px; /* 按钮更大 */
              border-radius: 8px;
              cursor: pointer;
              font-size: 1.05em;
              font-weight: 600;
              transition: all 0.25s ease;
              box-shadow: 0 3px 8px rgba(220, 53, 69, 0.3);
            }
            .reset-btn:hover {
              background: linear-gradient(145deg, #c0392b, #a93226); /* 悬停时更深 */
              transform: translateY(-2px);
              box-shadow: 0 5px 12px rgba(220, 53, 69, 0.4);
            }
            .reset-btn:active {
              transform: translateY(0);
              box-shadow: 0 2px 5px rgba(220, 53, 69, 0.3);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="stats-header"><h1>📊 API Key 看板</h1></div>
            <div class="stats-summary">
              <div class="summary-item">
                <span class="summary-item-label">总请求数</span>
                <div class="summary-item-value"><strong>${state.totalRequests}</strong></div>
              </div>
              <div class="summary-item">
                <span class="summary-item-label">状态版本</span>
                <div class="summary-item-value"><strong>v${state.version}</strong></div>
              </div>
              <div class="summary-item">
                <span class="summary-item-label">当前 Key 索引</span>
                <div class="summary-item-value"><strong>${state.keyIndex}</strong></div>
              </div>
              <div class="summary-item">
                <span class="summary-item-label">上次同步时间</span>
                <div class="summary-item-value"><strong>${state.lastSync > 0 ? new Date(state.lastSync).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '尚未同步'}</strong></div>
              </div>
            </div>
            <h2 class="list-title">🔑 API Key 使用统计</h2>
            <ul class="key-list">
              ${Object.entries(state.stats).length > 0
                ? Object.entries(state.stats).map(([key, count], index) => `
                  <li class="key-item">
                    <div class="key-details">
                      <span class="key-index">Key ${index + 1}:</span>
                      <code class="key-value">${key}</code>
                    </div>
                    <span class="key-count">${count} 次</span>
                  </li>`).join("")
                : '<li>暂无统计</li>'}
            </ul>
            <div class="reset-form">
              <form action="/reset" method="POST">
                <input type="hidden" name="key" value="${clientKey}">
                <button type="submit" class="reset-btn">重置所有状态和 KV 存储</button>
              </form>
              <form action="/clearstats" method="POST" style="margin-top: 15px;">
                <input type="hidden" name="key" value="${clientKey}">
                <button type="submit" class="reset-btn" style="background: linear-gradient(145deg, #3498db, #2980b9);">清空统计数据</button>
              </form>
            </div>
          </div>
        </body>
      </html>`;
    return new Response(statsHTML, { headers: { "content-type": "text/html; charset=utf-8" } });
  }
  
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