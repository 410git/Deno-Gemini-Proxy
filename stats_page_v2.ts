// stats_page_v2.ts – 简化版毛玻璃看板（仅展示和导出Keys）
import { keyManager } from "./kv_manager.ts";

/**
 * 处理 v2 统计页面 - 简化版本，仅显示和导出 API Keys
 * @param request Request 对象
 * @param clientKey 已通过鉴权的 master key
 */
export async function handleStatsPageV2(request: Request, clientKey: string): Promise<Response> {
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
          <title>API Key 管理面板 v2</title>
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
              transition: all 0.5s ease;
            }

            /* 主题变体 */
            body.theme-rainbow {
              background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
            }

            body.theme-blue {
              background: linear-gradient(-45deg, #1e3c72, #2a5298, #4facfe, #00f2fe);
            }

            body.theme-deep-sea {
              background: linear-gradient(-45deg, #0c1445, #1e3c72, #2a5298, #4facfe);
            }

            body.theme-sky {
              background: linear-gradient(-45deg, #2980b9, #3498db, #5dade2, #85c1e9);
            }

            body.theme-tech {
              background: linear-gradient(-45deg, #0f3460, #16537e, #1e88e5, #42a5f5);
            }

            body.theme-purple {
              background: linear-gradient(-45deg, #667eea, #764ba2, #9b59b6, #8e44ad);
            }

            body.theme-green {
              background: linear-gradient(-45deg, #11998e, #38ef7d, #00b09b, #96c93d);
            }

            body.theme-sunset {
              background: linear-gradient(-45deg, #ff9a9e, #fecfef, #fecfef, #ffd1dc);
            }

            body.theme-dark {
              background: linear-gradient(-45deg, #2c3e50, #34495e, #4a6741, #27ae60);
            }

            /* 动态背景动画 */
            @keyframes gradientShift {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }

            /* 主题切换器样式 */
            .theme-switcher {
              position: fixed;
              top: 20px;
              right: 20px;
              z-index: 1000;
              background: var(--glass-bg);
              backdrop-filter: var(--backdrop-blur);
              border: 1px solid var(--glass-border);
              border-radius: 16px;
              padding: 15px;
              box-shadow: var(--glass-shadow);
              transition: all 0.3s ease;
            }

            .theme-switcher:hover {
              transform: scale(1.05);
              box-shadow: 0 12px 40px rgba(0,0,0,0.3);
            }

            .theme-switcher-btn {
              background: none;
              border: none;
              color: var(--text-primary);
              font-size: 1.5rem;
              cursor: pointer;
              padding: 8px;
              border-radius: 8px;
              transition: all 0.3s ease;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 40px;
              height: 40px;
            }

            .theme-switcher-btn:hover {
              background: rgba(255, 255, 255, 0.1);
              transform: rotate(180deg);
            }

            .theme-menu {
              position: absolute;
              top: 100%;
              right: 0;
              margin-top: 10px;
              background: var(--glass-bg);
              backdrop-filter: var(--backdrop-blur);
              border: 1px solid var(--glass-border);
              border-radius: 12px;
              padding: 10px;
              box-shadow: var(--glass-shadow);
              opacity: 0;
              visibility: hidden;
              transform: translateY(-10px);
              transition: all 0.3s ease;
              min-width: 200px;
            }

            .theme-menu.active {
              opacity: 1;
              visibility: visible;
              transform: translateY(0);
            }

            .theme-option {
              display: flex;
              align-items: center;
              padding: 10px 12px;
              cursor: pointer;
              border-radius: 8px;
              transition: all 0.3s ease;
              margin-bottom: 5px;
              border: 1px solid transparent;
            }

            .theme-option:hover {
              background: rgba(255, 255, 255, 0.1);
              border-color: rgba(255, 255, 255, 0.2);
              transform: translateX(5px);
            }

            .theme-option.active {
              background: rgba(255, 255, 255, 0.15);
              border-color: rgba(255, 255, 255, 0.3);
            }

            .theme-preview {
              width: 20px;
              height: 20px;
              border-radius: 50%;
              margin-right: 10px;
              border: 2px solid rgba(255, 255, 255, 0.3);
              position: relative;
              overflow: hidden;
            }

            .theme-preview.rainbow {
              background: linear-gradient(45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
            }

            .theme-preview.blue {
              background: linear-gradient(45deg, #1e3c72, #2a5298, #4facfe, #00f2fe);
            }

            .theme-preview.deep-sea {
              background: linear-gradient(45deg, #0c1445, #1e3c72, #2a5298, #4facfe);
            }

            .theme-preview.sky {
              background: linear-gradient(45deg, #2980b9, #3498db, #5dade2, #85c1e9);
            }

            .theme-preview.tech {
              background: linear-gradient(45deg, #0f3460, #16537e, #1e88e5, #42a5f5);
            }

            .theme-preview.purple {
              background: linear-gradient(45deg, #667eea, #764ba2, #9b59b6, #8e44ad);
            }

            .theme-preview.green {
              background: linear-gradient(45deg, #11998e, #38ef7d, #00b09b, #96c93d);
            }

            .theme-preview.sunset {
              background: linear-gradient(45deg, #ff9a9e, #fecfef, #fecfef, #ffd1dc);
            }

            .theme-preview.dark {
              background: linear-gradient(45deg, #2c3e50, #34495e, #4a6741, #27ae60);
            }

            .theme-name {
              font-size: 0.9rem;
              color: var(--text-primary);
              font-weight: 500;
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
              font-size: clamp(2rem, 5vw, 3.5rem);
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

            /* 统计卡片 */
            .stats-card {
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(15px);
              -webkit-backdrop-filter: blur(15px);
              border: 1px solid rgba(255, 255, 255, 0.2);
              border-radius: 20px;
              padding: 30px;
              text-align: center;
              position: relative;
              overflow: hidden;
              transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
              margin-bottom: 30px;
            }

            .stats-card:hover {
              transform: translateY(-5px);
              box-shadow: 0 20px 40px rgba(0,0,0,0.2);
              border-color: rgba(255, 255, 255, 0.4);
            }

            .stat-value {
              font-size: 3rem;
              font-weight: 800;
              margin-bottom: 10px;
              background: var(--accent-gradient);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }

            .stat-label {
              font-size: 1rem;
              font-weight: 500;
              color: var(--text-secondary);
              text-transform: uppercase;
              letter-spacing: 1px;
            }

            /* 导出Keys功能样式 */
            .export-keys-container {
              background: rgba(255, 255, 255, 0.08);
              backdrop-filter: blur(15px);
              border: 1px solid rgba(255, 255, 255, 0.2);
              border-radius: 16px;
              padding: 25px;
              margin-bottom: 30px;
              animation: fadeInUp 0.4s ease-out;
              box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            }

            .export-keys-list {
              background: rgba(0, 0, 0, 0.2);
              backdrop-filter: blur(5px);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 12px;
              padding: 20px;
              max-height: 400px;
              overflow-y: auto;
              font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
              font-size: 0.9rem;
              line-height: 1.8;
              color: var(--text-secondary);
              scrollbar-width: thin;
              scrollbar-color: rgba(255,255,255,0.3) transparent;
            }

            .export-keys-list::-webkit-scrollbar {
              width: 8px;
            }

            .export-keys-list::-webkit-scrollbar-track {
              background: rgba(255,255,255,0.05);
              border-radius: 4px;
            }

            .export-keys-list::-webkit-scrollbar-thumb {
              background: rgba(255,255,255,0.3);
              border-radius: 4px;
            }

            .export-keys-list::-webkit-scrollbar-thumb:hover {
              background: rgba(255,255,255,0.4);
            }

            .key-line {
              padding: 6px 10px;
              margin: 2px 0;
              background: rgba(255, 255, 255, 0.05);
              border-radius: 6px;
              border-left: 3px solid transparent;
              transition: all 0.3s ease;
              word-break: break-all;
            }

            .key-line:hover {
              background: rgba(255, 255, 255, 0.1);
              border-left-color: var(--text-primary);
              transform: translateX(5px);
            }

            .glass-btn-small {
              appearance: none;
              padding: 8px 16px;
              font-size: 0.85rem;
              font-weight: 600;
              border: 1px solid rgba(255, 255, 255, 0.3);
              border-radius: 20px;
              cursor: pointer;
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
              color: var(--text-primary);
              transition: all 0.3s ease;
            }

            .glass-btn-small:hover {
              background: rgba(255, 255, 255, 0.2);
              border-color: rgba(255, 255, 255, 0.5);
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }

            .glass-btn-small.primary {
              background: rgba(59, 130, 246, 0.2);
              border-color: rgba(59, 130, 246, 0.4);
            }

            .glass-btn-small.primary:hover {
              background: rgba(59, 130, 246, 0.3);
              border-color: rgba(59, 130, 246, 0.6);
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

            /* 提示信息 */
            .info-box {
              background: rgba(59, 130, 246, 0.1);
              border: 1px solid rgba(59, 130, 246, 0.3);
              border-radius: 12px;
              padding: 20px;
              margin-bottom: 30px;
              color: var(--text-secondary);
              text-align: center;
            }

            .info-box strong {
              color: var(--text-primary);
            }

            /* 响应式设计 */
            @media (max-width: 768px) {
              .glass-container {
                padding: 20px;
                margin: 10px;
              }
              
              .actions {
                flex-direction: column;
                align-items: center;
              }
              
              .glass-btn {
                min-width: 250px;
              }

              .theme-switcher {
                top: 10px;
                right: 10px;
                padding: 10px;
              }

              .theme-menu {
                right: -50px;
                min-width: 180px;
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
          </style>
        </head>
        <body class="theme-rainbow">
          <!-- 主题切换器 -->
          <div class="theme-switcher">
            <button class="theme-switcher-btn" onclick="toggleThemeMenu()">🎨</button>
            <div class="theme-menu" id="themeMenu">
              <div class="theme-option active" onclick="changeTheme('rainbow')">
                <div class="theme-preview rainbow"></div>
                <span class="theme-name">彩虹渐变</span>
              </div>
              <div class="theme-option" onclick="changeTheme('blue')">
                <div class="theme-preview blue"></div>
                <span class="theme-name">经典蓝调</span>
              </div>
              <div class="theme-option" onclick="changeTheme('deep-sea')">
                <div class="theme-preview deep-sea"></div>
                <span class="theme-name">深海蓝</span>
              </div>
              <div class="theme-option" onclick="changeTheme('sky')">
                <div class="theme-preview sky"></div>
                <span class="theme-name">天空蓝</span>
              </div>
              <div class="theme-option" onclick="changeTheme('tech')">
                <div class="theme-preview tech"></div>
                <span class="theme-name">科技蓝</span>
              </div>
              <div class="theme-option" onclick="changeTheme('purple')">
                <div class="theme-preview purple"></div>
                <span class="theme-name">梦幻紫</span>
              </div>
              <div class="theme-option" onclick="changeTheme('green')">
                <div class="theme-preview green"></div>
                <span class="theme-name">自然绿</span>
              </div>
              <div class="theme-option" onclick="changeTheme('sunset')">
                <div class="theme-preview sunset"></div>
                <span class="theme-name">夕阳粉</span>
              </div>
              <div class="theme-option" onclick="changeTheme('dark')">
                <div class="theme-preview dark"></div>
                <span class="theme-name">深色系</span>
              </div>
            </div>
          </div>

          <!-- 背景装饰 -->
          <div class="bg-decoration"></div>
          <div class="bg-decoration"></div>
          <div class="bg-decoration"></div>
          
          <!-- 粒子效果 -->
          <div class="particles" id="particles"></div>

          <div class="glass-container">
            <h1 class="title">🔑 API Key 管理面板</h1>
            
            <!-- Keys统计卡片 -->
            <div class="stats-card">
              <div class="stat-value">${keysCount}</div>
              <div class="stat-label">已配置的 API Keys</div>
            </div>

            <!-- 提示信息 -->
            <div class="info-box">
              <strong>ℹ️ 随机Key模式</strong><br>
              系统已配置为随机选择 API Key 模式，每次请求将随机使用一个 Key。<br>
              无需KV存储，无统计数据保存。
            </div>

            <!-- 导出所有Keys的显示区域 -->
            <div id="exportKeysContainer" class="export-keys-container" style="display: none;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: var(--text-primary); font-weight: 600;">📋 所有 API Keys</h3>
                <button class="glass-btn-small" onclick="closeExportKeys()">✕ 关闭</button>
              </div>
              <div id="exportKeysList" class="export-keys-list"></div>
              <div style="margin-top: 15px; text-align: center;">
                <button class="glass-btn-small primary" onclick="copyAllKeys()">📋 复制全部</button>
              </div>
            </div>

            <div class="actions">
              <button class="glass-btn primary" onclick="toggleExportKeys()">
                📤 查看所有 Keys
              </button>
            </div>

            <div class="back-link">
              <a href="/stats?key=${clientKey}">← 返回经典看板</a>
            </div>
          </div>

          <script>
            // 导出所有Keys功能
            const allKeys = ${JSON.stringify(allKeys)};
            
            function toggleExportKeys() {
              const container = document.getElementById('exportKeysContainer');
              const keysList = document.getElementById('exportKeysList');
              
              if (container.style.display === 'none') {
                // 显示导出区域
                container.style.display = 'block';
                
                // 生成key列表
                if (allKeys.length > 0) {
                  keysList.innerHTML = allKeys.map(key => 
                    \`<div class="key-line">\${key}</div>\`
                  ).join('');
                } else {
                  keysList.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">暂无API Keys</div>';
                }
                
                // 滚动到导出区域
                container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                
                // 显示提示
                showThemeNotification('已列出所有 Keys', '✅');
              } else {
                // 隐藏导出区域
                container.style.display = 'none';
              }
            }
            
            function closeExportKeys() {
              const container = document.getElementById('exportKeysContainer');
              container.style.display = 'none';
            }
            
            function copyAllKeys() {
              if (allKeys.length === 0) {
                showThemeNotification('没有 Keys 可复制', '⚠️');
                return;
              }
              
              const keysText = allKeys.join('\\n');
              
              // 尝试使用现代剪贴板API
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(keysText)
                  .then(() => {
                    showThemeNotification(\`已复制 \${allKeys.length} 个 Keys\`, '📋');
                  })
                  .catch(err => {
                    // 降级到传统方法
                    fallbackCopyToClipboard(keysText);
                  });
              } else {
                // 降级到传统方法
                fallbackCopyToClipboard(keysText);
              }
            }
            
            function fallbackCopyToClipboard(text) {
              const textArea = document.createElement('textarea');
              textArea.value = text;
              textArea.style.position = 'fixed';
              textArea.style.top = '0';
              textArea.style.left = '0';
              textArea.style.opacity = '0';
              document.body.appendChild(textArea);
              textArea.focus();
              textArea.select();
              
              try {
                const successful = document.execCommand('copy');
                if (successful) {
                  showThemeNotification(\`已复制 \${allKeys.length} 个 Keys\`, '📋');
                } else {
                  showThemeNotification('复制失败，请手动复制', '❌');
                }
              } catch (err) {
                showThemeNotification('复制失败，请手动复制', '❌');
              }
              
              document.body.removeChild(textArea);
            }

            // 主题管理
            let currentTheme = localStorage.getItem('dashboard-theme') || 'rainbow';
            let themeMenuOpen = false;

            // 主题配置
            const themes = {
              rainbow: { name: '彩虹渐变', icon: '🌈' },
              blue: { name: '经典蓝调', icon: '🔵' },
              'deep-sea': { name: '深海蓝', icon: '🌊' },
              sky: { name: '天空蓝', icon: '☁️' },
              tech: { name: '科技蓝', icon: '💻' },
              purple: { name: '梦幻紫', icon: '🔮' },
              green: { name: '自然绿', icon: '🌿' },
              sunset: { name: '夕阳粉', icon: '🌅' },
              dark: { name: '深色系', icon: '🌙' }
            };

            // 应用主题
            function applyTheme(theme) {
              document.body.className = 'theme-' + theme;
              currentTheme = theme;
              localStorage.setItem('dashboard-theme', theme);
              
              // 更新活跃状态
              document.querySelectorAll('.theme-option').forEach(option => {
                option.classList.remove('active');
              });
              document.querySelector('[onclick="changeTheme(\\''+theme+'\\')"]').classList.add('active');
              
              // 显示切换提示
              showThemeNotification(themes[theme].name, themes[theme].icon);
            }

            // 切换主题
            function changeTheme(theme) {
              applyTheme(theme);
              toggleThemeMenu(); // 关闭菜单
            }

            // 切换主题菜单
            function toggleThemeMenu() {
              const menu = document.getElementById('themeMenu');
              themeMenuOpen = !themeMenuOpen;
              menu.classList.toggle('active', themeMenuOpen);
            }

            // 主题切换通知
            function showThemeNotification(themeName, icon) {
              const notification = document.createElement('div');
              notification.style.cssText = \`
                position: fixed;
                top: 80px;
                right: 20px;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                padding: 15px 20px;
                color: var(--text-primary);
                font-size: 0.9rem;
                z-index: 1001;
                animation: slideInRight 0.3s ease-out;
                box-shadow: 0 8px 32px rgba(0,0,0,0.2);
              \`;
              notification.innerHTML = \`\${icon} \${themeName}\`;
              document.body.appendChild(notification);

              setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
                setTimeout(() => notification.remove(), 300);
              }, 2000);
            }

            // 添加滑入滑出动画
            const style = document.createElement('style');
            style.textContent = \`
              @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
              @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
              }
            \`;
            document.head.appendChild(style);

            // 点击外部关闭菜单
            document.addEventListener('click', function(e) {
              const themeSwitcher = document.querySelector('.theme-switcher');
              if (!themeSwitcher.contains(e.target) && themeMenuOpen) {
                toggleThemeMenu();
              }
            });

            // 初始化主题
            document.addEventListener('DOMContentLoaded', function() {
              applyTheme(currentTheme);
              createParticles();
            });

            // 创建粒子效果
            function createParticles() {
              const particlesContainer = document.getElementById('particles');
              const particleCount = window.innerWidth < 768 ? 30 : 50;

              for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 8 + 's';
                particle.style.animationDuration = (Math.random() * 3 + 5) + 's';
                particlesContainer.appendChild(particle);
              }
            }

            // 键盘快捷键支持
            document.addEventListener('keydown', function(e) {
              if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                  case 'r':
                    e.preventDefault();
                    location.reload();
                    break;
                  case 't':
                    e.preventDefault();
                    toggleThemeMenu();
                    break;
                }
              }
              
              // ESC 关闭主题菜单
              if (e.key === 'Escape' && themeMenuOpen) {
                toggleThemeMenu();
              }
            });

            // 页面可见性检测，自动暂停/恢复动画
            document.addEventListener('visibilitychange', function() {
              const particles = document.querySelectorAll('.particle');
              const decorations = document.querySelectorAll('.bg-decoration');
              
              if (document.hidden) {
                particles.forEach(p => p.style.animationPlayState = 'paused');
                decorations.forEach(d => d.style.animationPlayState = 'paused');
                document.body.style.animationPlayState = 'paused';
              } else {
                particles.forEach(p => p.style.animationPlayState = 'running');
                decorations.forEach(d => d.style.animationPlayState = 'running');
                document.body.style.animationPlayState = 'running';
              }
            });

            // 控制台彩蛋
            console.log('%c🎨 API Key 管理面板 v2', 'color: #4facfe; font-size: 20px; font-weight: bold;');
            console.log('%c✨ 简化版本 - 随机Key模式', 'color: #00f2fe; font-size: 14px;');
            console.log('%c已加载 ' + allKeys.length + ' 个 API Keys', 'color: #fff; font-size: 12px;');
          </script>
        </body>
      </html>`;

    return new Response(statsHTML, { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  return new Response("❌ 无效操作", { status: 400 });
}
