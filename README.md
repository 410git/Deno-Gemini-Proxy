# Deno OpenAI Proxy (Gemini Edition)

一个基于 Deno 的 OpenAI API 代理服务，专为 Google Gemini API 设计，提供 API 密钥轮换、使用统计和美观的管理界面。

## ✨ 特性

- 🔄 **API 密钥轮换**: 自动轮换多个 API 密钥，提高请求成功率
- 📊 **实时统计**: 详细的 API 使用统计和监控
- 🎨 **双主题界面**: 提供经典和毛玻璃效果两种统计页面
- 🔒 **安全认证**: 基于主密钥的访问控制
- 💾 **持久化存储**: 使用 Deno KV 存储统计数据
- 🚀 **高性能**: 基于 Deno 运行时，原生支持 TypeScript

## 🏗️ 项目结构

```
├── main.ts              # 主服务入口
├── config.ts            # 配置管理
├── api_proxy.ts         # API 代理核心逻辑
├── kv_manager.ts        # KV 数据库管理
├── stats_page.ts        # 经典统计页面
├── stats_page_v2.ts     # 毛玻璃效果统计页面
├── deno.jsonc           # Deno 配置文件
├── Dockerfile           # Docker 镜像构建文件
├── docker-compose.yml   # Docker Compose 配置
├── .dockerignore        # Docker 忽略文件
├── .env.example         # 环境变量示例文件
└── README.md            # 项目说明文档
```

## 🚀 快速开始

### 环境要求

- [Deno](https://deno.land/) 1.40+

### 环境变量配置

1. **复制环境变量示例文件**
```bash
cp .env.example .env
```

2. **编辑 `.env` 文件，填入您的配置**
```bash
# 必需配置
API_KEYS=your_api_key_1,your_api_key_2,your_api_key_3
MASTER_KEY=your_master_key_for_admin_access

# 可选配置
TARGET_API_BASE_URL=https://generativelanguage.googleapis.com  # 默认值
RESET_KV=0  # 设置为 1 可重置 KV 数据库
```

### 启动服务

#### 方式一：Docker（推荐）
```bash
# 1. 克隆项目
git clone <repository-url>
cd deno-openai-proxy

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件填入您的配置

# 3. 启动服务
docker-compose up -d

# 4. 查看日志
docker-compose logs -f
```

#### 方式二：直接运行
```bash
# 开发模式
deno run --allow-net --allow-env --allow-read --allow-write --unstable-kv main.ts

# 或者使用 Deno Deploy
deno deploy --project=your-project main.ts
```

## 📖 API 使用

### 代理 API 请求

所有以 `/v1beta` 开头的请求都会被代理到目标 API：

```bash
curl -X POST "https://your-domain.com/v1beta/models/gemini-pro:generateContent" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{"text": "Hello, world!"}]
    }]
  }'
```

### 管理界面

#### 经典统计页面
```
GET /stats?key=your_master_key
```

#### 毛玻璃效果统计页面
```
GET /stats2?key=your_master_key
```

#### 重置统计数据
```
POST /reset
Content-Type: application/x-www-form-urlencoded

key=your_master_key
```

#### 清空统计数据
```
POST /clearstats
Content-Type: application/x-www-form-urlencoded

key=your_master_key
```

## 🔧 核心功能

### API 密钥轮换

系统会自动轮换配置的 API 密钥，确保负载均衡和高可用性：

- 轮询算法分配请求
- 实时统计每个密钥的使用次数
- 自动处理失败的请求

### 统计监控

提供详细的使用统计：

- 每个 API 密钥的请求次数
- 总请求数统计
- 实时数据更新
- 可视化图表展示

### 数据持久化

使用 Deno KV 进行数据存储：

- **Deno Deploy 环境**: 使用平台内置的 KV 服务，自动持久化
- **Docker 环境**: 使用容器内的本地 KV 数据库，通过数据卷挂载实现持久化
- **本地开发**: 使用默认的本地 KV 数据库文件

特性：
- 内存缓存 + KV 持久化双重保障
- 定期同步机制（每9秒同步一次）
- 数据一致性保证
- 支持多实例部署时的状态同步

## 🎨 界面预览

### 经典统计页面
- 简洁的表格展示
- 响应式设计
- 实时数据刷新

### 毛玻璃效果页面 (V2)
- 现代化毛玻璃设计
- 动态渐变背景
- 炫酷的视觉效果

## 🔒 安全性

- **主密钥认证**: 所有管理功能都需要主密钥验证
- **环境变量保护**: 敏感信息通过环境变量配置
- **请求验证**: 严格的请求参数验证

## 📊 监控和日志

服务提供详细的日志输出：

```
🚀 服务已启动
目标 API 基地址: https://generativelanguage.googleapis.com
Forwarding request (using key: AIza...) to: https://...
```

## 🚀 部署

### Deno Deploy

1. Fork 此仓库
2. 在 [Deno Deploy](https://dash.deno.com/) 创建新项目
3. 连接 GitHub 仓库
4. 配置环境变量
5. 部署完成

### 自托管

#### Docker 部署（推荐）

1. **构建镜像**
```bash
docker build -t deno-openai-proxy .
```

2. **运行容器（带数据持久化）**
```bash
# 运行容器
docker run -d --name deno-proxy \
  -e API_KEYS="your_api_key_1,your_api_key_2,your_api_key_3" \
  -e MASTER_KEY="your_master_key" \
  -e TARGET_API_BASE_URL="https://generativelanguage.googleapis.com" \
  -v deno_kv_data:/app \
  -p 8000:8000 \
  --restart unless-stopped \
  deno-openai-proxy
```

3. **使用 Docker Compose（推荐）**

项目已包含 `docker-compose.yml` 文件，直接使用：

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

**KV 数据库文件说明**：
- **谁创建**: Deno 运行时在首次调用 `Deno.openKv()` 时自动创建
- **文件位置**: 容器内的 `/app` 目录下（具体文件名由 Deno 决定）
- **持久化**: 通过 Docker 命名卷 `kv_data` 实现数据持久化
- **数据安全**: 容器重启、重建都不会丢失统计数据

#### 其他部署方式

```bash
# 使用 systemd (Linux)
sudo systemctl enable --now deno-proxy.service

# 使用 PM2
pm2 start "deno run --allow-net --allow-env --allow-read --allow-write --unstable-kv main.ts" --name deno-proxy
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔗 相关链接

- [Deno 官网](https://deno.land/)
- [Google Gemini API](https://ai.google.dev/)
- [Deno Deploy](https://deno.com/deploy)

---

**注意**: 请确保妥善保管您的 API 密钥和主密钥，不要在公开仓库中提交敏感信息。