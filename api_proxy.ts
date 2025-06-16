import { kvManager } from "./kv_manager.ts";
import { TARGET_API_BASE_URL } from "./config.ts";

export async function handleApiProxy(request: Request): Promise<Response> {
  try {
    // 1. 获取下一个API Key
    const apiKey = kvManager.getNextApiKey();
    if (!apiKey) {
      return new Response("🚫 未配置有效API Key", { status: 500 });
    }

    // 2. 只要决定转发，就立刻计数
    kvManager.incrementRequestStats(apiKey);

    // 3. 构建目标 URL
    const url = new URL(request.url);
    const targetUrl = new URL(url.pathname + url.search, TARGET_API_BASE_URL);

    // 4. 创建代理请求
    // 复制原始请求的 headers
    const proxyHeaders = new Headers(request.headers);
    // 设置目标 API 所需的 key
    proxyHeaders.set("x-goog-api-key", apiKey);
    // Host header 应该指向目标，而不是代理服务器
    proxyHeaders.set("Host", targetUrl.host);

    const proxyRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers: proxyHeaders,
      body: request.body,
      redirect: "follow",
    });
    
    console.log(`正在转发请求 (使用 Key: ${apiKey.slice(0, 4)}...) 至: ${targetUrl.toString()}`);

    // 5. 转发请求
    return await fetch(proxyRequest);

  } catch (error: unknown) {
    console.error("API 代理请求处理错误:", error);
    return new Response(`代理请求处理错误: ${(error instanceof Error ? error.message : String(error)) || "未知错误"}`, { status: 500 });
  }
}

import { kvManager } from "./kv_manager.ts";
import { TARGET_API_BASE_URL } from "./config.ts";

// 在模块加载时预解析和验证目标URL，实现快速失败
let targetBaseUrlObj: URL;
if (!TARGET_API_BASE_URL) {
  throw new Error("FATAL: TARGET_API_BASE_URL 环境变量未定义。");
}
try {
  targetBaseUrlObj = new URL(TARGET_API_BASE_URL);
} catch (e) {
  console.error("FATAL: TARGET_API_BASE_URL 格式不正确:", e);
  throw new Error(`FATAL: 无效的 TARGET_API_BASE_URL: ${TARGET_API_BASE_URL}`);
}

export async function handleApiProxy(request: Request): Promise<Response> {
  try {
    // 1. 获取下一个API Key
    const apiKey = await kvManager.getNextApiKey();
    if (!apiKey) {
      return new Response("🚫 未配置有效API Key", { status: 500 });
    }

    const url = new URL(request.url);

    // 构建新的 URL
    const newUrl = new URL(request.url); // 以原始请求URL为基础，保留查询参数等
    
    // 替换协议和主机为预解析的目标 API 的协议和主机
    newUrl.protocol = targetBaseUrlObj.protocol;
    newUrl.host = targetBaseUrlObj.host;

    // 拼接目标 API 的路径前缀和原始请求的路径
    const targetBasePath = targetBaseUrlObj.pathname.endsWith('/') ? targetBaseUrlObj.pathname.slice(0, -1) : targetBaseUrlObj.pathname;
    newUrl.pathname = `${targetBasePath}${url.pathname}`;

    // 将轮转后的 API Key 设置到查询参数中
    newUrl.searchParams.set('key', apiKey);

    console.log(`Forwarding request (using key: ${apiKey.slice(0, 4)}...) to: ${newUrl.toString()}`);

    // 只要尝试转发，就立刻计数，无论成功与否
    kvManager.incrementRequestStats(apiKey);

    try {
      // 转发请求
      const response = await fetch(new Request(newUrl, request));
      return response;
    } catch (error: unknown) {
      console.error(`代理请求失败: ${(error instanceof Error ? error.message : String(error)) || "未知错误"}`);
      return new Response(`代理请求失败: ${(error instanceof Error ? error.message : String(error)) || "未知错误"}`, { status: 502 });
    }
  } catch (error: unknown) {
    console.error("API 代理请求处理错误:", error);
    return new Response(`代理请求处理错误: ${(error instanceof Error ? error.message : String(error)) || "未知错误"}`, { status: 500 });
  }
}
