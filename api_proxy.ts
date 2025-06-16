// api_proxy.ts
import { kvManager } from "./kv_manager.ts";
import { TARGET_API_BASE_URL } from "./config.ts";

export async function handleApiProxy(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);

    // 检查 TARGET_API_BASE_URL 是否有效
    if (!TARGET_API_BASE_URL) {
      console.error("TARGET_API_BASE_URL 未定义。");
      return new Response("🚨 代理目标地址未配置", { status: 500 });
    }
    let targetBaseUrlObj: URL;
    try {
      targetBaseUrlObj = new URL(TARGET_API_BASE_URL);
    } catch (e) {
      console.error("TARGET_API_BASE_URL 格式不正确:", e);
      return new Response("🚨 代理目标地址格式错误", { status: 500 });
    }

    // 获取当前Key
    const apiKey = kvManager.getNextApiKey();

    // 如果没有配置 API Key 且请求需要，则返回错误
    // 这里假设所有 /v1beta 请求都需要 API Key
    if (!apiKey) {
      console.warn("未找到可用的 API Key。");
      return new Response("🔒 未配置 API Key", { status: 500 });
    }

    // 构建新的 URL
    const newUrl = new URL(request.url); // 以原始请求URL为基础，保留查询参数等
    // 替换协议和主机为目标 API 的协议和主机
    newUrl.protocol = targetBaseUrlObj.protocol;
    newUrl.host = targetBaseUrlObj.host;

    // 拼接目标 API 的路径前缀和原始请求的路径
    const targetBasePath = targetBaseUrlObj.pathname.endsWith('/') ? targetBaseUrlObj.pathname.slice(0, -1) : targetBaseUrlObj.pathname;
    newUrl.pathname = `${targetBasePath}${url.pathname}`;

    // 将轮转后的 API Key 设置到查询参数中 (这是最终API需要的key)
    newUrl.searchParams.set('key', apiKey);

    console.log(`Forwarding request (using key: ${apiKey.slice(0, 4)}...) to: ${newUrl.toString()}`); // 打印调试信息

    // 转发请求，保留原始请求的所有属性（方法、headers、body等）
    const response = await fetch(new Request(newUrl, request));
    return response;
  } catch (error: unknown) {
    console.error("⚠️ API 代理请求处理错误:", error);
    return new Response(`🚨 代理请求失败: ${(error instanceof Error ? error.message : String(error)) || "未知错误"}`, { status: 500 });
  }
}
