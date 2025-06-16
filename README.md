# Deno Gemini Proxy

这是一个基于 Deno 的 Gemini API 代理服务，旨在提供一个安全、可控且易于部署的中间层，用于转发对 Google Gemini API 的请求。它支持 API Key 轮转、请求统计、以及简单的管理功能。

## 特性

- **API Key 轮转**：自动在配置的多个 API Key 之间进行轮转，提高请求的成功率和可用性。
- **请求统计**：记录每个 API Key 的使用次数和总请求数，提供可视化统计页面。
- **KV 存储**：利用 Deno KV 进行持久化存储，确保 API Key 轮转状态和统计数据的持久性。
- **模块化设计**：代码结构清晰，易于维护和扩展。
- **错误处理**：增强了错误处理机制，提供更友好的错误响应。

## 项目结构

- `main.ts`：项目入口文件，负责路由分发。
- `config.ts`：管理环境变量和常量。
- `kv_manager.ts`：封装 Deno KV 操作和内存状态管理。
- `api_proxy.ts`：处理 Gemini API 请求转发逻辑。
- `stats_page.ts`：负责生成统计页面 HTML。
- `deno.jsonc`：Deno 项目配置文件，包含 TypeScript 编译器选项。

## 部署指南

本项目推荐部署到 [Deno Deploy](https://deno.com/deploy)。

### 1. 准备工作

- 确保您已安装 [Deno CLI](https://deno.land/#installation)。
- 如果您选择使用 `deployctl` 进行部署，请安装它：
  ```bash
  deno install -A -r https://deno.land/x/deploy/deployctl.ts
  ```

### 2. 环境变量配置

在 Deno Deploy 项目的设置中，您需要配置以下环境变量：

- `API_KEYS`：**必需**。您的 Gemini API Key(s)。多个 Key 请用逗号 `,` 分隔。例如：`your_gemini_key_1,your_gemini_key_2`。
- `MASTER_KEY`：**必需**。用于访问统计页面 (`/stats`) 和管理操作 (`/reset`, `/clearstats`) 的主密钥。请设置一个强密码。
- `TARGET_API_BASE_URL`：**可选**。目标 Gemini API 的基础 URL。默认为 `https://generativelanguage.googleapis.com`。如果您使用 Cloudflare AI Gateway 或其他代理，请将其设置为对应的 URL。
- `RESET_KV`：**可选**。如果设置为 `1`，项目首次启动时将重置 Deno KV 存储。主要用于开发或测试。

### 3. 部署方式

#### 方式一：使用 `deployctl` 部署 (手动部署)

1.  登录 Deno Deploy：
    ```bash
    deployctl login
    ```
2.  在 [Deno Deploy Dashboard](https://dash.deno.com/new) 上创建一个新项目，并记下项目名称或 ID。
3.  在项目根目录运行部署命令：
    ```bash
    deployctl deploy --project <YOUR_PROJECT_NAME_OR_ID> main.ts
    ```
    将 `<YOUR_PROJECT_NAME_OR_ID>` 替换为您在 Deno Deploy 上创建的项目名称或 ID。

#### 方式二：通过 GitHub 仓库自动部署 (推荐)

1.  **创建 GitHub 仓库**：
    在 GitHub 上创建一个新的空仓库（例如：`deno-gemini-proxy`）。
2.  **将本地项目推送到 GitHub**：
    在项目根目录执行以下 Git 命令：
    ```bash
    git init
    git add .
    git commit -m "Initial commit of Deno Gemini Proxy"
    git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git
    git push -u origin master # 或 main
    ```
3.  **在 Deno Deploy 上连接 GitHub 仓库**：
    登录 [Deno Deploy Dashboard](https://dash.deno.com/)，选择 "New Project" 或现有项目的 "Settings"，然后选择 "Deploy from GitHub Repository"。授权并选择您的仓库。

### 4. 访问服务

部署成功后，您将获得一个 Deno Deploy 提供的 URL。例如：`https://your-project-name.deno.dev`。

## 使用说明

- **API 代理**：
  将您的 Gemini API 请求发送到代理服务的 `/v1beta` 路径。例如，如果您的原始 API 请求是 `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_KEY`，则代理请求将是 `https://your-project-name.deno.dev/v1beta/models/gemini-pro:generateContent`。

- **统计页面**：
  访问 `/stats` 路径以查看 API Key 的使用统计。您需要提供 `MASTER_KEY` 作为查询参数或 `x-goog-api-key` 头。
  例如：`https://your-project-name.deno.dev/stats?key=YOUR_MASTER_KEY`

- **重置 KV 存储**：
  通过向 `/reset` 路径发送 POST 请求来重置所有统计数据和 KV 存储。需要 `MASTER_KEY`。

- **清空统计数据**：
  通过向 `/clearstats` 路径发送 POST 请求来清空统计数据。需要 `MASTER_KEY`。

## 许可证

本项目基于 MIT 许可证发布。详情请参阅 `LICENSE` 文件。
