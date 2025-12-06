import { keyManager } from "./kv_manager.ts";
import { handleStatsPage } from "./stats_page.ts";
import { handleStatsPageV2 } from "./stats_page_v2.ts";
import { handleApiProxy } from "./api_proxy.ts";
import { TARGET_API_BASE_URL, MASTER_KEY } from "./config.ts";

async function handler(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const path = url.pathname;

    // 统计页面路由，增加前置授权
    if (path === "/stats" || path === "/stats2" || path === "/statsv2") {
      let clientKey: string | null = url.searchParams.get('key') || request.headers.get('x-goog-api-key');

      if (request.method === "POST") {
        try {
          // 为了不消耗原始请求体，克隆请求来读取表单数据
          const formData = await request.clone().formData();
          if (formData.has('key')) {
            clientKey = clientKey || formData.get('key') as string;
          }
        } catch (e) {
          // 忽略解析错误，例如当请求体不是表单时
        }
      }

      if (!MASTER_KEY || clientKey !== MASTER_KEY) {
        return new Response('🔒 未授权', { status: 401 });
      }
      
      // 根据不同路径返回对应看板
      if (path === "/stats2" || path === "/statsv2") {
        return handleStatsPageV2(request, clientKey);
      }
      return handleStatsPage(request, clientKey);
    }

    // API 代理处理
    if (path.startsWith("/v1beta") || path.startsWith("/v1")) {
      return handleApiProxy(request);
    }

    return new Response("❌ 无效操作", { status: 400 });
  } catch (error: unknown) {
    // 特别处理表单解析失败的情况
    if (error instanceof TypeError && (error.message.includes("body used") || error.message.includes("invalid form data"))) {
        return new Response("Bad Request", { status: 400 });
    }
    console.error("⚠️ 请求处理错误:", error);
    return new Response(`🚨 服务器错误: ${(error instanceof Error ? error.message : String(error)) || "未知错误"}`, { status: 500 });
  }
}

console.log("🚀 服务已启动");
console.log(`目标 API 基地址: ${TARGET_API_BASE_URL}`);
console.log(`已加载 ${keyManager.getKeysCount()} 个 API Keys`);
Deno.serve(handler);