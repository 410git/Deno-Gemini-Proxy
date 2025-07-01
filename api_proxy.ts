// api_proxy.ts
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
    const url = new URL(request.url);

    // 获取当前Key
    const apiKey = kvManager.getNextApiKey();

    // 如果没有配置 API Key，则返回错误
    if (!apiKey) {
      console.warn("未找到可用的 API Key。");
      return new Response("🔒 未配置 API Key", { status: 500 });
    }

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
    kvManager.updateKeyUsage(apiKey);

    const maxRetries = 2; // 最多重试2次，总共3次尝试
    let lastResponse: Response | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(new Request(newUrl, request));

        // 对于 429 (Too Many Requests) 和 503 (Service Unavailable) 错误进行重试
        if (response.status !== 429 && response.status !== 503) {
          // 不是可重试的错误，直接返回响应
          return response;
        }

        // 是可重试的错误，保存响应对象
        lastResponse = response;
        
        console.log(`Request to ${newUrl.pathname} failed with ${response.status}. Attempt ${attempt + 1} of ${maxRetries + 1}.`);

        // 如果不是最后一次尝试，消费响应体并等待后重试
        if (attempt < maxRetries) {
          // 消耗响应体以释放连接。对于流式响应，这可以防止连接挂起。
          await response.body?.cancel();
          console.log("Retrying in 0.5s...");
          await new Promise(resolve => setTimeout(resolve, 500)); // 等待 500ms
        }
        // 如果是最后一次尝试，循环将结束，并返回 lastResponse

      } catch (error: unknown) {
        // 捕获网络错误等，这些错误发生在 fetch 本身，比如流中断
        console.error(`Request failed with network error on attempt ${attempt + 1}:`, error);
        
        // 如果不是最后一次尝试，等待后重试
        if (attempt < maxRetries) {
          console.log("Retrying in 0.5s...");
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          // 所有重试都因网络错误失败，返回 502
          console.error(`Request failed with network error after ${maxRetries + 1} attempts.`);
          return new Response(`代理请求失败: ${(error instanceof Error ? error.message : String(error)) || "未知网络错误"}`, { status: 502 });
        }
      }
    }

    // 如果循环结束，说明所有尝试都失败了（无论是429/503还是网络错误）。
    // 如果最后一次失败是429/503，lastResponse 会被设置。
    if (lastResponse) {
        console.error(`Request failed with ${lastResponse.status} after ${maxRetries + 1} attempts. No more retries.`);
        return lastResponse;
    }
    
    // Fallback, should not be reached if the logic above is correct
    return new Response("代理请求最终失败，且未捕获到明确的响应或错误。", { status: 500 });

  } catch (error: unknown) {
    console.error("API 代理请求处理错误:", error);
    return new Response(`代理请求处理错误: ${(error instanceof Error ? error.message : String(error)) || "未知错误"}`, { status: 500 });
  }
}
