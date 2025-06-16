import { kvManager } from "./kv_manager.ts";
import { handleStatsPage } from "./stats_page.ts";
import { handleApiProxy } from "./api_proxy.ts";
import { TARGET_API_BASE_URL } from "./config.ts";

async function handler(request: Request): Promise<Response> {
  try {
    await kvManager.syncState(); // 前置状态同步

    const url = new URL(request.url);
    const path = url.pathname;

    // 统计页面处理
    if (path === "/stats" || path === "/reset" || path === "/clearstats") {
      return handleStatsPage(request);
    }

    // API 代理处理
    if (path.startsWith("/v1beta")) {
      return handleApiProxy(request);
    }

    return new Response("❌ 无效操作", { status: 400 });
  } catch (error: unknown) {
    console.error("⚠️ 请求处理错误:", error);
    return new Response(`🚨 服务器错误: ${(error instanceof Error ? error.message : String(error)) || "未知错误"}`, { status: 500 });
  }
}

console.log("🚀 服务已启动");
console.log(`目标 API 基地址: ${TARGET_API_BASE_URL}`);
Deno.serve(handler);