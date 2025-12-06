// api_proxy.ts
import { keyManager } from "./key_manager.ts";
import { TARGET_API_BASE_URL } from "./config.ts";

// ==================== 配置常量 ====================

/**
 * 最大重试次数
 * 
 * 说明：当请求失败时（如 429 Too Many Requests, 5xx 错误，或响应过快），
 *      系统会自动重试。此常量定义最多重试的次数。
 * 
 * 计算方式：总尝试次数 = MAX_RETRIES + 1（包含首次尝试）
 *          例如：MAX_RETRIES = 2 表示总共会尝试 3 次
 * 
 * 影响：
 *   - 值越大：成功率越高，但响应时间可能更长
 *   - 值越小：响应更快，但在网络不稳定时失败率更高
 * 
 * 建议值：
 *   - 网络稳定环境：1-2（快速失败）
 *   - 一般环境：2-3（平衡性能和可靠性）
 *   - 网络不稳定：3-5（提高成功率）
 * 
 * 当前值：2（总共尝试 3 次）
 */
const MAX_RETRIES = 2;

/**
 * 重试延迟时间（毫秒）
 * 
 * 说明：两次重试之间的等待时间，用于避免立即重试导致的持续失败，
 *      并给目标服务器喘息的机会。
 * 
 * 影响：
 *   - 值越大：对服务器更友好，但总响应时间更长
 *   - 值越小：响应更快，但可能因为重试太快而持续失败
 * 
 * 建议值：
 *   - Rate Limit (429) 错误：500-2000ms
 *   - 服务器错误 (5xx)：300-1000ms
 *   - 网络错误：500-1500ms
 * 
 * 提示：如果经常遇到 429 错误，可以适当增加此值
 * 
 * 当前值：500ms
 */
const RETRY_DELAY_MS = 500;

/**
 * 快速响应判定阈值（毫秒）
 * 
 * 说明：某些 API（特别是 Gemini）会在收到缓存命中时立即返回，
 *      这可能表示请求没有被正确处理（缓存了错误的响应，或重复请求）。
 *      如果响应时间低于此阈值，系统会认为响应"过快"并自动重试，
 *      重试时会在请求内容前添加随机字符串以避免缓存。
 * 
 * 工作原理：
 *   1. 正常的 API 处理通常需要 1-5 秒
 *   2. 如果在 < 1000ms 内返回成功响应，可能是缓存命中
 *   3. 系统会添加随机前缀避免缓存，然后重试
 * 
 * 影响：
 *   - 值越大：更容易触发"过快重试"，处理更保守
 *   - 值越小：只在极快响应时重试，可能漏掉一些缓存问题
 * 
 * 建议值：
 *   - 严格模式：1500-2000ms（几乎所有快速响应都会重试）
 *   - 平衡模式：800-1200ms（针对明显的缓存命中）
 *   - 宽松模式：300-500ms（只重试极快的响应）
 * 
 * 注意：设置为 0 可以完全禁用此功能
 * 
 * 当前值：1000ms（1秒）
 */
const FAST_RESPONSE_THRESHOLD_MS = 1000;

/**
 * 随机前缀长度
 * 
 * 说明：当检测到响应过快时，会在用户消息前添加随机字符串来避免缓存。
 *      此常量定义随机字符串的长度。
 * 
 * 工作原理：
 *   - 生成指定长度的随机字符串（包含字母、数字、特殊符号）
 *   - 添加到用户消息的最前面
 *   - 例如："xY9&mK$pL2Hello" (10个随机字符 + 原始消息)
 * 
 * 影响：
 *   - 值越大：更不容易碰撞，但会增加 token 消耗
 *   - 值越小：节省 token，但理论上有极小概率碰撞
 * 
 * Token 消耗：
 *   - 每个字符约消耗 0.5-1 个 token
 *   - 长度 10 = 约 5-10 tokens
 *   - 长度 20 = 约 10-20 tokens
 * 
 * 建议值：
 *   - 节省成本：5-8（通常足够）
 *   - 平衡模式：10-15（推荐）
 *   - 保守模式：20-30（几乎不可能碰撞）
 * 
 * 注意：即使长度很短（如 6），碰撞概率也非常低
 *      字符集大小 = 72，可能组合 = 72^6 ≈ 139 亿种
 * 
 * 当前值：10
 */
const RANDOM_PREFIX_LENGTH = 10;

/**
 * 随机字符集
 * 
 * 说明：用于生成随机前缀的字符集合。包含大小写字母、数字和特殊符号。
 * 
 * 字符集包含：
 *   - 大写字母：A-Z (26个)
 *   - 小写字母：a-z (26个)
 *   - 数字：0-9 (10个)
 *   - 特殊符号：!@#$%^&*() (10个)
 *   - 总计：72 个字符
 * 
 * 修改建议：
 *   - 可以移除特殊符号以提高兼容性
 *   - 可以添加更多符号以增加复杂度
 *   - 避免使用可能引起问题的字符（如引号、反斜杠）
 * 
 * 示例自定义：
 *   - 仅字母数字：'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
 *   - 包含更多符号：'...@#$%^&*()-_=+[]{}|;:,.<>?'
 * 
 * 当前值：大小写字母 + 数字 + 常用特殊符号
 */
const RANDOM_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';

// ==================== 目标 URL 初始化 ====================

// 在模块加载时预解析和验证目标URL，实现快速失败
let targetBaseUrlObj: URL;
if (!TARGET_API_BASE_URL) {
  throw new Error("FATAL: TARGET_API_BASE_URL 环境变量未定义。");
}
try {
  targetBaseUrlObj = new URL(TARGET_API_BASE_URL);
} catch (_e) {
  console.error("FATAL: TARGET_API_BASE_URL 格式不正确:", _e);
  throw new Error(`FATAL: 无效的 TARGET_API_BASE_URL: ${TARGET_API_BASE_URL}`);
}

// ==================== 类型定义 ====================

interface MessageBody {
  messages?: Array<{
    role: string;
    content: string | unknown;
  }>;
  [key: string]: unknown;
}

// ==================== 辅助函数 ====================

/**
 * 生成指定长度的随机字符串
 */
function generateRandomString(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += RANDOM_CHARS.charAt(Math.floor(Math.random() * RANDOM_CHARS.length));
  }
  return result;
}

/**
 * 构建目标 URL
 */
function buildTargetUrl(requestUrl: string, apiKey: string): URL {
  const newUrl = new URL(requestUrl);
  newUrl.protocol = targetBaseUrlObj.protocol;
  newUrl.host = targetBaseUrlObj.host;
  
  const targetBasePath = targetBaseUrlObj.pathname.endsWith('/')
    ? targetBaseUrlObj.pathname.slice(0, -1)
    : targetBaseUrlObj.pathname;
  
  newUrl.pathname = `${targetBasePath}${newUrl.pathname}`;
  newUrl.searchParams.set('key', apiKey);
  
  return newUrl;
}

/**
 * 尝试修改请求体以避免缓存
 */
async function modifyRequestBody(request: Request): Promise<Request> {
  if (!request.body) {
    return request;
  }

  try {
    const body: MessageBody = await request.clone().json();

    // 检查是否有messages数组，并尝试添加随机前缀
    if (body.messages && Array.isArray(body.messages) && body.messages.length > 0) {
      const lastMessage = body.messages[body.messages.length - 1];
      if (lastMessage.role === 'user' && typeof lastMessage.content === 'string') {
        const randomPrefix = generateRandomString(RANDOM_PREFIX_LENGTH);
        lastMessage.content = randomPrefix + lastMessage.content;
        console.log(`Added random prefix to avoid cache: "${randomPrefix}"`);
      }
    }

    const newRequestInit: RequestInit = {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(body),
    };
    return new Request(request.url, newRequestInit);

  } catch (_jsonError) {
    console.warn("Could not parse request body as JSON. Retrying without modifications.");
    return request;
  }
}

/**
 * 延迟指定毫秒数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== 主处理函数 ====================

export async function handleApiProxy(request: Request): Promise<Response> {
  try {
    // 1. 获取随机 API Key
    const apiKey = keyManager.getRandomApiKey();
    if (!apiKey) {
      console.warn("⚠️ 未找到可用的 API Key");
      return new Response("🔒 未配置 API Key", { status: 500 });
    }

    // 2. 构建目标 URL
    const targetUrl = buildTargetUrl(request.url, apiKey);
    console.log(`🔀 Forwarding request (key: ${apiKey.slice(0, 4)}***) to: ${targetUrl.toString()}`);

    // 3. 重试逻辑
    let lastResponse: Response | undefined;
    let requestToForward = request;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const startTime = Date.now();
      const requestForThisAttempt = requestToForward.clone();

      try {
        // 发送请求
        const response = await fetch(new Request(targetUrl, requestForThisAttempt));
        const duration = Date.now() - startTime;
        lastResponse = response;

        // 判断是否需要重试
        const isStatusRetry = response.status === 429 || response.status >= 500;
        const isTimeoutRetry = response.ok && duration < FAST_RESPONSE_THRESHOLD_MS;

        // 如果不需要重试，直接返回
        if (!isStatusRetry && !isTimeoutRetry) {
          console.log(`✅ Request succeeded in ${duration}ms (attempt ${attempt + 1})`);
          return response;
        }

        // 如果已经是最后一次尝试，退出循环
        if (attempt >= MAX_RETRIES) {
          const reason = isStatusRetry ? `status ${response.status}` : `too fast (${duration}ms)`;
          console.error(`❌ Final attempt failed. Reason: ${reason}. No more retries.`);
          break;
        }

        // 取消响应体以释放资源
        await response.body?.cancel();

        // 记录重试原因
        if (isStatusRetry) {
          console.log(`⚠️ Status ${response.status}. Retrying... (${attempt + 1}/${MAX_RETRIES + 1})`);
        } else if (isTimeoutRetry) {
          console.log(`⚡ Too fast (${duration}ms). Retrying with modified content... (${attempt + 1}/${MAX_RETRIES + 1})`);
          requestToForward = await modifyRequestBody(request);
        }

        // 延迟后重试
        await delay(RETRY_DELAY_MS);

      } catch (error: unknown) {
        console.error(`🔥 Network error on attempt ${attempt + 1}:`, error);

        // 如果是最后一次尝试，返回错误
        if (attempt >= MAX_RETRIES) {
          console.error(`❌ Failed after ${MAX_RETRIES + 1} attempts.`);
          const errorMsg = error instanceof Error ? error.message : String(error);
          return new Response(`代理请求失败: ${errorMsg || "未知网络错误"}`, { status: 502 });
        }

        // 延迟后重试
        await delay(RETRY_DELAY_MS);
      }
    }

    // 返回最后一次响应（如果有）
    if (lastResponse) {
      return lastResponse;
    }

    // 理论上不应该到达这里
    return new Response("代理请求最终失败，且未捕获到明确的响应或错误。", { status: 500 });

  } catch (error: unknown) {
    console.error("💥 API 代理请求处理错误:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return new Response(`代理请求处理错误: ${errorMsg || "未知错误"}`, { status: 500 });
  }
}
