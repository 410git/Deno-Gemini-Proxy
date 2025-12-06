// api_proxy.ts
import { keyManager } from "./kv_manager.ts";
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

// Helper function to generate a random string
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function handleApiProxy(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);

    const apiKey = keyManager.getRandomApiKey();
    if (!apiKey) {
      console.warn("未找到可用的 API Key。");
      return new Response("🔒 未配置 API Key", { status: 500 });
    }

    const newUrl = new URL(request.url);
    newUrl.protocol = targetBaseUrlObj.protocol;
    newUrl.host = targetBaseUrlObj.host;
    const targetBasePath = targetBaseUrlObj.pathname.endsWith('/') ? targetBaseUrlObj.pathname.slice(0, -1) : targetBaseUrlObj.pathname;
    newUrl.pathname = `${targetBasePath}${url.pathname}`;
    newUrl.searchParams.set('key', apiKey);

    console.log(`Forwarding request (using key: ${apiKey.slice(0, 4)}...) to: ${newUrl.toString()}`);

    const maxRetries = 2;
    let lastResponse: Response | undefined;
    let requestToForward = request;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const startTime = Date.now();
      const requestForThisAttempt = requestToForward.clone();

      try {
        const response = await fetch(new Request(newUrl, requestForThisAttempt));
        const duration = Date.now() - startTime;

        lastResponse = response;

        const isStatusRetry = response.status === 429 || response.status >= 500;
        const isTimeoutRetry = response.ok && duration < 1000;

        if (!isStatusRetry && !isTimeoutRetry) {
          return response;
        }

        if (attempt >= maxRetries) {
          console.error(`Final attempt failed. Reason: ${isStatusRetry ? `status ${response.status}` : 'fast response'}. No more retries.`);
          break;
        }

        await response.body?.cancel();

        if (isStatusRetry) {
          console.log(`Request failed with status ${response.status}. Attempt ${attempt + 1} of ${maxRetries + 1}. Retrying...`);
        }

        if (isTimeoutRetry) {
          console.log(`Request finished in ${duration}ms (too fast). Attempt ${attempt + 1} of ${maxRetries + 1}. Retrying with modified content...`);

          if (request.body) {
            try {
              const body = await request.clone().json();

              if (body.messages && Array.isArray(body.messages) && body.messages.length > 0) {
                const lastMessage = body.messages[body.messages.length - 1];
                if (lastMessage.role === 'user' && typeof lastMessage.content === 'string') {
                  const randomPrefix = generateRandomString(10);
                  lastMessage.content = randomPrefix + lastMessage.content;
                  console.log(`Added random prefix: "${randomPrefix}"`);
                }
              }

              const newRequestInit: RequestInit = {
                method: request.method,
                headers: request.headers,
                body: JSON.stringify(body),
              };
              requestToForward = new Request(request.url, newRequestInit);

            } catch (jsonError) {
              console.error("Could not parse request body as JSON for modification. Retrying without changes.", jsonError);
              requestToForward = request;
            }
          }
        }

        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: unknown) {
        console.error(`Request failed with network error on attempt ${attempt + 1}:`, error);

        if (attempt >= maxRetries) {
          console.error(`Request failed with network error after ${maxRetries + 1} attempts.`);
          return new Response(`代理请求失败: ${(error instanceof Error ? error.message : String(error)) || "未知网络错误"}`, { status: 502 });
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (lastResponse) {
      return lastResponse;
    }

    return new Response("代理请求最终失败，且未捕获到明确的响应或错误。", { status: 500 });

  } catch (error: unknown) {
    console.error("API 代理请求处理错误:", error);
    return new Response(`代理请求处理错误: ${(error instanceof Error ? error.message : String(error)) || "未知错误"}`, { status: 500 });
  }
}
