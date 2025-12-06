import { API_KEYS } from "./config.ts";

/**
 * Key Manager - 管理 API Keys
 * 提供随机选择和导出功能
 */
export class KeyManager {
  /**
   * 随机选择一个 API Key
   */
  public getRandomApiKey(): string | undefined {
    if (API_KEYS.length === 0) {
      return undefined;
    }
    const randomIndex = Math.floor(Math.random() * API_KEYS.length);
    return API_KEYS[randomIndex];
  }

  /**
   * 获取所有 API Keys（用于导出功能）
   */
  public getAllKeys(): string[] {
    return [...API_KEYS];
  }

  /**
   * 获取 Keys 数量
   */
  public getKeysCount(): number {
    return API_KEYS.length;
  }
}

export const keyManager = new KeyManager();
