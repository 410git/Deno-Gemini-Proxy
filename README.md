# Deno Gemini API Proxy

一个基于 Deno 的轻量级 API 代理服务，专为 Google Gemini API 设计。提供随机 Key 选择、智能重试、缓存规避和美观的管理界面。

## ✨ 核心特性

- 🎲 **随机 Key 选择**: 每次请求随机选择 API Key，更好的负载均衡
- 🔄 **智能重试机制**: 自动处理 429、5xx 错误和超快响应
- 🚀 **缓存规避**: 检测并规避可能的缓存问题
- 🎨 **双主题界面**: 经典版和炫酷毛玻璃效果管理页面
- 🔒 **安全认证**: 基于主密钥的访问控制
- 📦 **无状态设计**: 不依赖数据库，部署更简单
- ⚡ **高性能**: 基于 Deno 运行时，原生 TypeScript 支持

## 🆕 最新更新

### v2.0 - 架构重构（2025-12-06）

- ✅ 移除 KV 存储依赖，改为随机选择模式
- ✅ 不再记录统计数据（无状态设计）
- ✅ 优化代码结构，提取配置常量
- ✅ 增强日志输出，添加表情符号标记
- ✅ 详细的代码注释和配置说明

**迁移说明**: 从 v1.x 升级无需数据迁移，直接部署即可。旧的 KV 数据会被忽略。

## 🏗️ 项目结构

```
├── main.ts              # 主服务入口
├── config.ts            # 环境变量配置
├── api_proxy.ts         # API 代理核心逻辑（含智能重试）
├── key_manager.ts       # API Key 管理器
├── stats_page.ts        # 经典管理页面
├── stats_page_v2.ts     # 毛玻璃效果管理页面
├── deno.jsonc           # Deno 配置文件
├── Dockerfile           # Docker 镜像构建文件
├── docker-compose.yml   # Docker Compose 配置
└── README.md            # 本文档
```

## 🚀 快速开始

### 环境要求

- [Deno](https://deno.land/) 1.40+ 或 Docker

### 1. 环境变量配置

创建 `.env` 文件（或在部署平台配置）：

```bash
# 必需配置
API_KEYS=your_key_1,your_key_2,your_key_3    # 逗号分隔的 API Keys
MASTER_KEY=your_master_password              # 管理页面访问密钥

# 可选配置
TARGET_API_BASE_URL=https://generativelanguage.googleapis.com  # 默认值
```

### 2. 启动服务

#### 方式一：Docker Compose（推荐）

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 2. 启动服务
docker-compose up -d

# 3. 查看日志
docker-compose logs -f

# 4. 停止服务
docker-compose down
```

#### 方式二：直接运行

```bash
# 开发模式
deno run --allow-net --allow-env main.ts

# 或使用 --watch 自动重载
deno run --allow-net --allow-env --watch main.ts
```

#### 方式三：Deno Deploy

1. Fork 此仓库
2. 在 [Deno Deploy](https://dash.deno.com/) 创建新项目
3. 连接 GitHub 仓库
4. 配置环境变量：
   - `API_KEYS`
   - `MASTER_KEY`
5. 部署完成！

## 📖 使用指南

### API 代理

所有以 `/v1beta` 或 `/v1` 开头的请求都会被代理：

```bash
curl -X POST "https://your-domain.com/v1beta/models/gemini-pro:generateContent" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{"text": "Hello, world!"}]
    }]
  }'
```

系统会自动：
1. 🎲 随机选择一个 API Key
2. 🔄 处理失败请求（最多重试 2 次）
3. ⚡ 检测并规避缓存问题
4. 📊 记录请求日志

### 管理页面

#### 经典版管理页面
```
GET /stats?key=your_master_key
```

特点：
- 简洁清晰
- 显示已配置的 Keys 数量
- 导出所有 Keys 功能

#### 炫酷版管理页面（V2）
```
GET /stats2?key=your_master_key
或
GET /statsv2?key=your_master_key
```

特点：
- 🎨 毛玻璃效果
- 🌈 9种主题可切换
- 🎭 动态渐变背景
- ✨ 粒子动画效果
- 📋 Keys 导出功能

## 🔧 核心功能详解

### 1. 随机 Key 选择

每次请求都会从配置的 API Keys 中随机选择一个：

```typescript
// 伪代码示例
请求1 → 随机选择 → key_3
请求2 → 随机选择 → key_1
请求3 → 随机选择 → key_2
```

**优势**：
- 更好的负载均衡
- 避免顺序模式被检测
- 无需维护状态

### 2. 智能重试机制

当遇到以下情况时自动重试：

#### a) 状态码重试
- `429 Too Many Requests` - 速率限制
- `5xx` - 服务器错误

#### b) 快速响应重试
- 响应时间 < 1秒（可配置）
- 可能是缓存命中
- 自动添加随机前缀避免缓存

**重试配置**（在 `api_proxy.ts` 顶部）：
```typescript
MAX_RETRIES = 2                    // 最多重试 2 次
RETRY_DELAY_MS = 500               // 重试间隔 500ms
FAST_RESPONSE_THRESHOLD_MS = 1000  // 快速响应阈值 1秒
```

### 3. 缓存规避

某些 API 会缓存响应，导致返回错误结果。系统会：

1. 检测响应时间 < 阈值
2. 在用户消息前添加随机前缀
3. 重新发送请求

```
原始消息: "你好"
添加前缀: "xY9&mK$pL2你好"
```

**效果**：避免缓存，获得真实响应

## 🎨 管理页面功能

### Keys 管理

两个版本的管理页面都支持：

1. **查看 Keys 数量**
   - 显示已配置的 API Keys 数量

2. **导出所有 Keys**
   - 点击按钮展开 Keys 列表
   - 每行一个 Key
   - 一键复制所有 Keys

3. **随机模式说明**
   - 提示当前使用随机选择模式
   - 说明不保存统计数据

### V2 版本专属功能

- **主题切换**（9种主题）：
  - 彩虹渐变（默认）
  - 经典蓝调
  - 深海蓝
  - 天空蓝
  - 科技蓝
  - 梦幻紫
  - 自然绿
  - 夕阳粉
  - 深色系

- **快捷键**：
  - `Ctrl+R` - 刷新页面
  - `Ctrl+T` - 打开主题菜单
  - `ESC` - 关闭主题菜单
  - `Alt+数字` - 快速切换主题

## 📊 日志说明

服务会输出详细的日志，使用表情符号便于识别：

```
🚀 服务已启动
已加载 3 个 API Keys
🔀 Forwarding request (key: AIza***) to: https://...
✅ Request succeeded in 1245ms (attempt 1)
⚠️ Status 429. Retrying... (1/3)
⚡ Too fast (234ms). Retrying with modified content... (1/3)
❌ Final attempt failed. Reason: status 429
🔥 Network error on attempt 2: ...
💥 API proxy error: ...
```

## ⚙️ 配置调整

### 重试策略自定义

编辑 `api_proxy.ts` 顶部的常量：

```typescript
// 最大重试次数（总尝试次数 = MAX_RETRIES + 1）
const MAX_RETRIES = 2;              // 推荐: 2-3

// 重试延迟（毫秒）
const RETRY_DELAY_MS = 500;         // 推荐: 500-1000

// 快速响应阈值（毫秒，设为 0 禁用）
const FAST_RESPONSE_THRESHOLD_MS = 1000;  // 推荐: 800-1500

// 随机前缀长度
const RANDOM_PREFIX_LENGTH = 10;    // 推荐: 8-15
```

**详细配置说明**：查看 `.gemini/config_guide.md`

### 常见场景配置

#### 追求速度
```typescript
MAX_RETRIES = 1
RETRY_DELAY_MS = 300
FAST_RESPONSE_THRESHOLD_MS = 0  // 禁用缓存检测
```

#### 高可靠性
```typescript
MAX_RETRIES = 4
RETRY_DELAY_MS = 1000
FAST_RESPONSE_THRESHOLD_MS = 1500
```

#### 频繁遇到 429
```typescript
MAX_RETRIES = 3
RETRY_DELAY_MS = 1500  // 增加延迟
FAST_RESPONSE_THRESHOLD_MS = 1000
```

## 🔒 安全性

- ✅ **主密钥认证**: 管理页面需要 MASTER_KEY 验证
- ✅ **环境变量**: 敏感信息通过环境变量配置
- ✅ **无数据存储**: 不保存任何请求数据或统计
- ✅ **HTTPS 推荐**: 生产环境使用 HTTPS

## 🚀 部署建议

### Deno Deploy（推荐）

**优点**：
- ✅ 无需服务器
- ✅ 全球 CDN 加速
- ✅ 自动 HTTPS
- ✅ 免费额度充足

**步骤**：
1. 连接 GitHub 仓库
2. 配置环境变量
3. 一键部署

### Docker 部署

**优点**：
- ✅ 完全控制
- ✅ 可自定义域名
- ✅ 本地部署

**命令**：
```bash
docker run -d --name gemini-proxy \
  -e API_KEYS="key1,key2,key3" \
  -e MASTER_KEY="your_password" \
  -p 8000:8000 \
  --restart unless-stopped \
  your-image-name
```

### VPS 部署

使用 systemd 或 PM2 管理进程：

```bash
# systemd
sudo systemctl enable --now deno-proxy.service

# PM2
pm2 start "deno run --allow-net --allow-env main.ts" --name gemini-proxy
pm2 save
```

## 🔍 故障排查

### 问题：始终返回 "未配置 API Key"

**解决**：
- 检查 `API_KEYS` 环境变量是否正确设置
- 确认格式：逗号分隔，无多余空格
- 重启服务

### 问题：管理页面显示 401

**解决**：
- 确认 `MASTER_KEY` 环境变量已设置
- 检查 URL 中的 `key` 参数是否正确
- 示例：`/stats?key=your_master_key`

### 问题：频繁收到 429 错误

**解决**：
- 增加 `RETRY_DELAY_MS` 到 1000-2000
- 增加 `MAX_RETRIES` 到 3-4
- 添加更多 API Keys

### 问题：响应很慢

**解决**：
- 减少 `MAX_RETRIES`
- 减少或禁用 `FAST_RESPONSE_THRESHOLD_MS`
- 检查网络延迟

## 📈 性能优化

1. **增加 API Keys 数量**
   - 更好的负载分散
   - 降低单个 Key 的请求频率

2. **调整重试策略**
   - 根据实际使用情况优化参数
   - 查看日志分析失败原因

3. **使用 CDN**
   - Deno Deploy 自带全球 CDN
   - 或使用 Cloudflare 等服务

## 🆚 架构对比

| 特性 | v1.x (KV轮转) | v2.0 (随机选择) |
|------|--------------|----------------|
| Key 选择 | 轮转 | 随机 |
| 数据存储 | Deno KV | 无 |
| 统计数据 | ✓ 保存 | ✗ 不保存 |
| 部署复杂度 | 中等 | 简单 |
| 性能 | 有 KV 开销 | 无额外开销 |
| 状态同步 | 需要 | 不需要 |
| 代码行数 | ~1600 | ~1100 |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔗 相关链接

- [Deno 官网](https://deno.land/)
- [Google Gemini API](https://ai.google.dev/)
- [Deno Deploy](https://deno.com/deploy)
- [项目文档](.gemini/) - 详细的开发文档

## 📚 文档索引

- `README.md` - 本文档（使用指南）
- `.gemini/config_guide.md` - 配置参数详解
- `.gemini/api_proxy_optimization.md` - API 代理优化说明
- `.gemini/architecture_refactor.md` - 架构重构说明
- `.gemini/refactor_summary.md` - 重构总结

---

**⚠️ 注意**：
- 请妥善保管 API Keys 和主密钥
- 不要在公开仓库提交敏感信息
- 建议使用环境变量或密钥管理服务
- 生产环境请使用 HTTPS