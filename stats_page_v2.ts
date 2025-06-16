// stats_page_v2.ts – 毛玻璃效果炫酷看板
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
          <title>API Key 毛玻璃看板 v2</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
            
            :root {
              /* 毛玻璃专用配色 */
              --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              --accent-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
              --glass-bg: rgba(255, 255, 255, 0.08);
              --glass-border: rgba(255, 255, 255, 0.2);
              --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
              --text-primary: rgba(255, 255, 255, 0.95);
              --text-secondary: rgba(255, 255, 255, 0.7);
              --backdrop-blur: blur(20px);
            }

            * { 
              box-sizing: border-box; 
              margin: 0;
              padding: 0;
            }

            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
              background-size: 400% 400%;
              animation: gradientShift 15s ease infinite;
              color: var(--text-primary);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
              overflow-x: hidden;
              position: relative;
            }

            /* 动态背景动画 */
            @keyframes gradientShift {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }

            /* 背景装饰元素 */
            .bg-decoration {
              position: fixed;
              width: 200px;
              height: 200px;
              border-radius: 50%;
              filter: blur(60px);
              opacity: 0.3;
              animation: float 6s ease-in-out infinite;
              z-index: -1;
            }
            .bg-decoration:nth-child(1) {
              top: 10%;
              left: 10%;
              background: var(--primary-gradient);
              animation-delay: 0s;
            }
            .bg-decoration:nth-child(2) {
              top: 60%;
              right: 10%;
              background: var(--secondary-gradient);
              animation-delay: 2s;
            }
            .bg-decoration:nth-child(3) {
              bottom: 10%;
              left: 30%;
              background: var(--accent-gradient);
              animation-delay: 4s;
            }

            @keyframes float {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-20px) rotate(10deg); }
            }

            /* 主容器毛玻璃效果 */
            .glass-container {
              width: 100%;
              max-width: 900px;
              background: var(--glass-bg);
              backdrop-filter: var(--backdrop-blur);
              -webkit-backdrop-filter: var(--backdrop-blur);
              border: 1px solid var(--glass-border);
              border-radius: 24px;
              box-shadow: var(--glass-shadow);
              padding: 40px;
              position: relative;
              overflow: hidden;
            }

            /* 容器内光晕效果 */
            .glass-container::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 1px;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
            }

            /* 标题样式 */
            .title {
              font-size: clamp(2.5rem, 5vw, 4rem);
              font-weight: 900;
              text-align: center;
              background: linear-gradient(135deg, #fff, #f0f0f0, #fff);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              margin-bottom: 40px;
              text-shadow: 0 0 30px rgba(255,255,255,0.5);
              animation: titleGlow 3s ease-in-out infinite alternate;
              position: relative;
            }

            @keyframes titleGlow {
              from { filter: drop-shadow(0 0 10px rgba(255,255,255,0.3)); }
              to { filter: drop-shadow(0 0 20px rgba(255,255,255,0.8)); }
            }

            /* 统计卡片网格 */
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 24px;
              margin-bottom: 50px;
            }

            /* 毛玻璃卡片 */
            .glass-card {
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(15px);
              -webkit-backdrop-filter: blur(15px);
              border: 1px solid rgba(255, 255, 255, 0.2);
              border-radius: 20px;
              padding: 30px 25px;
              text-align: center;
              position: relative;
              overflow: hidden;
              transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
              cursor: pointer;
            }

            .glass-card::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
              transition: left 0.6s;
            }

            .glass-card:hover {
              transform: translateY(-8px) scale(1.02);
              box-shadow: 0 20px 40px rgba(0,0,0,0.2);
              border-color: rgba(255, 255, 255, 0.4);
            }

            .glass-card:hover::before {
              left: 100%;
            }

            .stat-value {
              font-size: 2.5rem;
              font-weight: 800;
              margin-bottom: 10px;
              background: var(--accent-gradient);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }

            .stat-label {
              font-size: 0.9rem;
              font-weight: 500;
              color: var(--text-secondary);
              text-transform: uppercase;
              letter-spacing: 1px;
            }

            /* Key列表样式 */
            .key-list-container {
              background: rgba(255, 255, 255, 0.05);
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 16px;
              padding: 30px;
              margin-bottom: 40px;
            }

            .key-list {
              list-style: none;
              max-height: 400px;
              overflow-y: auto;
              scrollbar-width: thin;
              scrollbar-color: rgba(255,255,255,0.3) transparent;
            }

            .key-list::-webkit-scrollbar {
              width: 6px;
            }

            .key-list::-webkit-scrollbar-track {
              background: rgba(255,255,255,0.1);
              border-radius: 3px;
            }

            .key-list::-webkit-scrollbar-thumb {
              background: rgba(255,255,255,0.3);
              border-radius: 3px;
            }

            .key-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 20px;
              background: rgba(255, 255, 255, 0.08);
              backdrop-filter: blur(8px);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 12px;
              margin-bottom: 12px;
              transition: all 0.3s ease;
              position: relative;
              overflow: hidden;
            }

            .key-item::before {
              content: '';
              position: absolute;
              left: 0;
              top: 0;
              bottom: 0;
              width: 3px;
              background: var(--accent-gradient);
              transform: scaleY(0);
              transition: transform 0.3s ease;
            }

            .key-item:hover {
              background: rgba(255, 255, 255, 0.15);
              transform: translateX(8px);
              border-color: rgba(255, 255, 255, 0.3);
            }

            .key-item:hover::before {
              transform: scaleY(1);
            }

            .key-index {
              font-weight: 700;
              color: var(--text-primary);
              min-width: 60px;
              font-size: 0.9rem;
            }

            .key-value {
              font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
              font-size: 0.85rem;
              color: var(--text-secondary);
              flex: 1;
              margin: 0 15px;
              word-break: break-all;
              background: rgba(255, 255, 255, 0.05);
              padding: 8px 12px;
              border-radius: 6px;
              border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .key-count {
              font-weight: 700;
              color: var(--text-primary);
              min-width: 80px;
              text-align: right;
              font-size: 1rem;
            }

            /* 按钮区域 */
            .actions {
              display: flex;
              gap: 20px;
              justify-content: center;
              flex-wrap: wrap;
              margin-bottom: 30px;
            }

            .glass-btn {
              appearance: none;
              padding: 16px 32px;
              font-size: 1rem;
              font-weight: 600;
              border: 1px solid rgba(255, 255, 255, 0.3);
              border-radius: 50px;
              cursor: pointer;
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
              color: var(--text-primary);
              transition: all 0.3s ease;
              position: relative;
              overflow: hidden;
              min-width: 200px;
            }

            .glass-btn::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
              transition: left 0.5s;
            }

            .glass-btn:hover {
              transform: translateY(-3px);
              box-shadow: 0 10px 25px rgba(0,0,0,0.2);
              border-color: rgba(255, 255, 255, 0.5);
              background: rgba(255, 255, 255, 0.2);
            }

            .glass-btn:hover::before {
              left: 100%;
            }

            .glass-btn:active {
              transform: translateY(-1px);
            }

            .glass-btn.danger {
              background: rgba(239, 68, 68, 0.2);
              border-color: rgba(239, 68, 68, 0.4);
            }

            .glass-btn.danger:hover {
              background: rgba(239, 68, 68, 0.3);
              border-color: rgba(239, 68, 68, 0.6);
            }

            .glass-btn.primary {
              background: rgba(59, 130, 246, 0.2);
              border-color: rgba(59, 130, 246, 0.4);
            }

            .glass-btn.primary:hover {
              background: rgba(59, 130, 246, 0.3);
              border-color: rgba(59, 130, 246, 0.6);
            }

            /* 返回链接 */
            .back-link {
              text-align: center;
              margin-top: 20px;
            }

            .back-link a {
              color: var(--text-secondary);
              text-decoration: none;
              font-size: 0.9rem;
              padding: 10px 20px;
              border: 1px solid rgba(255, 255, 255, 0.2);
              border-radius: 25px;
              background: rgba(255, 255, 255, 0.05);
              backdrop-filter: blur(5px);
              transition: all 0.3s ease;
              display: inline-block;
            }

            .back-link a:hover {
              color: var(--text-primary);
              background: rgba(255, 255, 255, 0.1);
              border-color: rgba(255, 255, 255, 0.3);
              transform: translateY(-2px);
            }

            /* 响应式设计 */
            @media (max-width: 768px) {
              .glass-container {
                padding: 20px;
                margin: 10px;
              }
              
              .stats-grid {
                grid-template-columns: 1fr;
                gap: 16px;
              }
              
              .actions {
                flex-direction: column;
                align-items: center;
              }
              
              .glass-btn {
                min-width: 250px;
              }
            }

            /* 加载动画 */
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .glass-container {
            animation: fadeInUp 0.8s ease-out;
          }

          .glass-card {
            animation: fadeInUp 0.8s ease-out;
          }

          .glass-card:nth-child(1) { animation-delay: 0.1s; }
          .glass-card:nth-child(2) { animation-delay: 0.2s; }
          .glass-card:nth-child(3) { animation-delay: 0.3s; }
          .glass-card:nth-child(4) { animation-delay: 0.4s; }

          .key-item {
            animation: fadeInUp 0.6s ease-out;
          }

          /* 粒子效果背景 */
          .particles {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -2;
          }

          .particle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            animation: particleFloat 8s infinite linear;
          }

          @keyframes particleFloat {
            0% {
              transform: translateY(100vh) rotate(0deg);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translateY(-10vh) rotate(360deg);
              opacity: 0;
            }
          }

          /* 空状态样式 */
          .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: var(--text-secondary);
            font-size: 1.1rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            border: 1px dashed rgba(255, 255, 255, 0.2);
          }

          .empty-state .icon {
            font-size: 3rem;
            margin-bottom: 20px;
            opacity: 0.5;
          }
        </style>
      </head>
      <body>
        <!-- 背景装饰 -->
        <div class="bg-decoration"></div>
        <div class="bg-decoration"></div>
        <div class="bg-decoration"></div>
        
        <!-- 粒子效果 -->
        <div class="particles" id="particles"></div>

        <div class="glass-container">
          <h1 class="title">✨ API Key 毛玻璃看板 v2</h1>
          
          <div class="stats-grid">
            <div class="glass-card">
              <div class="stat-value">${state.totalRequests.toLocaleString()}</div>
              <div class="stat-label">总请求数</div>
            </div>
            <div class="glass-card">
              <div class="stat-value">v${state.version}</div>
              <div class="stat-label">状态版本</div>
            </div>
            <div class="glass-card">
              <div class="stat-value">${state.keyIndex}</div>
              <div class="stat-label">当前 Key 索引</div>
            </div>
            <div class="glass-card">
              <div class="stat-value">${Object.keys(state.stats).length}</div>
              <div class="stat-label">活跃 Keys</div>
            </div>
          </div>

          <div class="key-list-container">
            <h3 style="margin-bottom: 20px; color: var(--text-primary); font-weight: 600;">📊 API Keys 使用统计</h3>
            ${Object.entries(state.stats).length > 0 ? `
              <ul class="key-list">
                ${Object.entries(state.stats)
                  .sort(([,a], [,b]) => b - a)
                  .map(([key, count], index) => `
                  <li class="key-item" style="animation-delay: ${index * 0.05}s;">
                    <span class="key-index">#${index + 1}</span>
                    <code class="key-value">${key.length > 50 ? key.substring(0, 47) + '...' : key}</code>
                    <span class="key-count">${count.toLocaleString()} 次</span>
                  </li>
                `).join("")}
              </ul>
            ` : `
              <div class="empty-state">
                <div class="icon">📭</div>
                <div>暂无统计数据</div>
                <div style="font-size: 0.9rem; margin-top: 10px; opacity: 0.7;">开始使用 API 后，统计信息将显示在这里</div>
              </div>
            `}
          </div>

          <div style="background: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 1px solid rgba(255, 255, 255, 0.1);">
            <h4 style="color: var(--text-primary); margin-bottom: 15px; font-weight: 600;">⏰ 系统信息</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; font-size: 0.9rem;">
              <div style="color: var(--text-secondary);">
                <strong style="color: var(--text-primary);">上次同步:</strong><br>
                ${state.lastSync > 0 ? new Date(state.lastSync).toLocaleString('zh-CN', { 
                  timeZone: 'Asia/Shanghai',
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                }) : '尚未同步'}
              </div>
              <div style="color: var(--text-secondary);">
                <strong style="color: var(--text-primary);">运行时间:</strong><br>
                ${state.lastSync > 0 ? Math.floor((Date.now() - state.lastSync) / 1000 / 60) + ' 分钟前' : '未知'}
              </div>
            </div>
          </div>

          <div class="actions">
            <form action="/clearstats" method="POST" style="display: inline;">
              <input type="hidden" name="key" value="${clientKey}" />
              <button type="submit" class="glass-btn primary" onclick="return confirm('确定要清空统计数据吗？此操作不可撤销。')">
                🧹 清空统计数据
              </button>
            </form>
            <form action="/reset" method="POST" style="display: inline;">
              <input type="hidden" name="key" value="${clientKey}" />
              <button type="submit" class="glass-btn danger" onclick="return confirm('⚠️ 警告：这将重置所有 KV 状态！确定继续吗？')">
                ⚠️ 重置全部状态
              </button>
            </form>
          </div>

          <div class="back-link">
            <a href="/stats?key=${clientKey}">← 返回经典看板</a>
          </div>
        </div>

        <script>
          // 创建粒子效果
          function createParticles() {
            const particlesContainer = document.getElementById('particles');
            const particleCount = 50;

            for (let i = 0; i < particleCount; i++) {
              const particle = document.createElement('div');
              particle.className = 'particle';
              particle.style.left = Math.random() * 100 + '%';
              particle.style.animationDelay = Math.random() * 8 + 's';
              particle.style.animationDuration = (Math.random() * 3 + 5) + 's';
              particlesContainer.appendChild(particle);
            }
          }

          // 页面加载完成后创建粒子
          document.addEventListener('DOMContentLoaded', createParticles);

          // 添加卡片点击效果
          document.querySelectorAll('.glass-card').forEach(card => {
            card.addEventListener('click', function() {
              this.style.transform = 'scale(0.95)';
              setTimeout(() => {
                this.style.transform = '';
              }, 150);
            });
          });

          // 添加键盘快捷键支持
          document.addEventListener('keydown', function(e) {
            if (e.ctrlKey || e.metaKey) {
              switch(e.key) {
                case 'r':
                  e.preventDefault();
                  location.reload();
                  break;
                case '1':
                  e.preventDefault();
                  location.href = '/stats?key=${clientKey}';
                  break;
              }
            }
          });

          // 自动刷新功能（可选）
          let autoRefresh = false;
          let refreshInterval;

          function toggleAutoRefresh() {
            autoRefresh = !autoRefresh;
            if (autoRefresh) {
              refreshInterval = setInterval(() => location.reload(), 30000);
              console.log('🔄 自动刷新已启用 (30秒)');
            } else {
              clearInterval(refreshInterval);
              console.log('⏸️ 自动刷新已关闭');
            }
          }

          // 双击标题切换自动刷新
          document.querySelector('.title').addEventListener('dblclick', toggleAutoRefresh);

          // 添加工具提示
          document.querySelectorAll('.key-value').forEach(element => {
            const fullKey = element.textContent;
            if (fullKey.includes('...')) {
              element.title = '完整 Key: ' + fullKey.replace('...', '');
            }
          });

          // 平滑滚动
          document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
              e.preventDefault();
              const target = document.querySelector(this.getAttribute('href'));
              if (target) {
                target.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start'
                });
              }
            });
          });

          // 添加页面可见性检测，自动暂停/恢复动画
          document.addEventListener('visibilitychange', function() {
            const particles = document.querySelectorAll('.particle');
            if (document.hidden) {
              particles.forEach(p => p.style.animationPlayState = 'paused');
            } else {
              particles.forEach(p => p.style.animationPlayState = 'running');
            }
          });
        </script>
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
