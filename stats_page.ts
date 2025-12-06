// stats_page.ts – 经典统计页面（简化版）
import { keyManager } from "./kv_manager.ts";

/**
 * 处理经典统计页面 - 简化版本，仅显示Keys信息
 * @param request Request 对象
 * @param clientKey 已通过鉴权的 master key
 */
export async function handleStatsPage(request: Request, clientKey: string): Promise<Response> {
  // GET – 返回页面
  if (request.method === "GET") {
    const allKeys = keyManager.getAllKeys();
    const keysCount = keyManager.getKeysCount();

    const statsHTML = `
      <!DOCTYPE html>
      <html lang="zh-CN">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>API Key 管理面板</title>
          <style>
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }

            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #fff;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }

            .container {
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
              border-radius: 20px;
              padding: 40px;
              max-width: 800px;
              width: 100%;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            }

            h1 {
              text-align: center;
              margin-bottom: 30px;
              font-size: 2.5rem;
              text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
            }

            .stats-card {
              background: rgba(255, 255, 255, 0.15);
              border-radius: 15px;
              padding: 30px;
              margin-bottom: 30px;
              text-align: center;
            }

            .stat-value {
              font-size: 3rem;
              font-weight: bold;
              margin-bottom: 10px;
            }

            .stat-label {
              font-size: 1rem;
              opacity: 0.8;
              text-transform: uppercase;
              letter-spacing: 1px;
            }

            .info-box {
              background: rgba(59, 130, 246, 0.2);
              border: 1px solid rgba(59, 130, 246, 0.5);
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 30px;
              text-align: center;
            }

            .keys-container {
              background: rgba(0, 0, 0, 0.2);
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 30px;
              max-height: 400px;
              overflow-y: auto;
              display: none;
            }

            .keys-container.show {
              display: block;
            }

            .key-item {
              background: rgba(255, 255, 255, 0.1);
              padding: 10px;
              margin-bottom: 10px;
              border-radius: 8px;
              font-family: 'Courier New', monospace;
              word-break: break-all;
              font-size: 0.9rem;
            }

            .buttons {
              display: flex;
              gap: 15px;
              justify-content: center;
              flex-wrap: wrap;
            }

            button, .btn {
              background: rgba(255, 255, 255, 0.2);
              border: 1px solid rgba(255, 255, 255, 0.3);
              color: #fff;
              padding: 12px 30px;
              border-radius: 25px;
              cursor: pointer;
              font-size: 1rem;
              transition: all 0.3s ease;
              text-decoration: none;
              display: inline-block;
            }

            button:hover, .btn:hover {
              background: rgba(255, 255, 255, 0.3);
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }

            button.primary {
              background: rgba(59, 130, 246, 0.4);
              border-color: rgba(59, 130, 246, 0.6);
            }

            button.primary:hover {
              background: rgba(59, 130, 246, 0.6);
            }

            .link-section {
              text-align: center;
              margin-top: 30px;
            }

            .link-section a {
              color: rgba(255, 255, 255, 0.8);
              text-decoration: none;
              padding: 8px 20px;
              border: 1px solid rgba(255, 255, 255, 0.3);
              border-radius: 20px;
              transition: all 0.3s ease;
            }

            .link-section a:hover {
              background: rgba(255, 255, 255, 0.1);
              color: #fff;
            }

            @media (max-width: 600px) {
              .container {
                padding: 20px;
              }

              h1 {
                font-size: 2rem;
              }

              .buttons {
                flex-direction: column;
              }

              button, .btn {
                width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔑 API Key 管理面板</h1>
            
            <div class="stats-card">
              <div class="stat-value">${keysCount}</div>
              <div class="stat-label">已配置的 API Keys</div>
            </div>

            <div class="info-box">
              <strong>ℹ️ 随机Key模式</strong><br>
              系统已配置为随机选择 API Key 模式，每次请求将随机使用一个 Key。<br>
              无需KV存储，无统计数据保存。
            </div>

            <div id="keysContainer" class="keys-container">
              ${allKeys.map((key, index) => `
                <div class="key-item">${index + 1}. ${key}</div>
              `).join('')}
            </div>

            <div class="buttons">
              <button class="primary" onclick="toggleKeys()">
                <span id="toggleText">📤 查看所有 Keys</span>
              </button>
              <button onclick="copyKeys()">📋 复制全部</button>
            </div>

            <div class="link-section">
              <a href="/stats2?key=${clientKey}">✨ 切换到炫酷看板</a>
            </div>
          </div>

          <script>
            const allKeys = ${JSON.stringify(allKeys)};
            let keysVisible = false;

            function toggleKeys() {
              const container = document.getElementById('keysContainer');
              const toggleText = document.getElementById('toggleText');
              keysVisible = !keysVisible;
              
              if (keysVisible) {
                container.classList.add('show');
                toggleText.textContent = '🔒 隐藏 Keys';
              } else {
                container.classList.remove('show');
                toggleText.textContent = '📤 查看所有 Keys';
              }
            }

            function copyKeys() {
              if (allKeys.length === 0) {
                alert('没有 Keys 可复制');
                return;
              }

              const keysText = allKeys.join('\\n');
              
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(keysText)
                  .then(() => {
                    alert(\`已复制 \${allKeys.length} 个 Keys 到剪贴板\`);
                  })
                  .catch(err => {
                    fallbackCopy(keysText);
                  });
              } else {
                fallbackCopy(keysText);
              }
            }

            function fallbackCopy(text) {
              const textArea = document.createElement('textarea');
              textArea.value = text;
              textArea.style.position = 'fixed';
              textArea.style.opacity = '0';
              document.body.appendChild(textArea);
              textArea.select();
              
              try {
                document.execCommand('copy');
                alert(\`已复制 \${allKeys.length} 个 Keys 到剪贴板\`);
              } catch (err) {
                alert('复制失败，请手动复制');
              }
              
              document.body.removeChild(textArea);
            }
          </script>
        </body>
      </html>`;

    return new Response(statsHTML, { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  return new Response("❌ 无效操作", { status: 400 });
}