import { API_KEYS, RESET_KV } from "./config.ts";

// 统一的内存和KV状态接口
interface AppState {
  keyIndex: number;
  stats: Record<string, number>;
  totalRequests: number;
  version: number;
}

// 内存状态接口，增加一个用于同步节流的时间戳
interface MemoryState extends AppState {
  lastSync: number;
}

export class KVManager {
  private kv: Deno.Kv;
  private memoryState: MemoryState;

  constructor() {
    this.kv = {} as Deno.Kv; // 占位符，将在 init 方法中初始化
    this.memoryState = {
      keyIndex: 0,
      stats: Object.fromEntries(API_KEYS.map(key => [key, 0])),
      totalRequests: 0,
      version: 0,
      lastSync: 0,
    };
  }

  public async init() {
    this.kv = await Deno.openKv();
    if (RESET_KV) {
      await this.resetKvStore();
    } else {
      await this.loadInitialState();
    }
  }

  public getMemoryState(): Readonly<AppState> {
    return this.memoryState;
  }

  public async syncState() {
    const now = Date.now();
    // 统一的状态同步 (每9秒同步一次)
    if (now - this.memoryState.lastSync < 9000) {
      return; // 未到同步时间，直接返回
    }

    const remoteStateEntry = await this.kv.get<AppState>(["state"]);
    const remoteVersion = remoteStateEntry.value?.version || 0;

    // 如果内存中的版本更高，则写入KV
    if (this.memoryState.version > remoteVersion) {
      const { lastSync, ...stateToSave } = this.memoryState;
      await this.kv.set(["state"], stateToSave);
    } 
    // 如果KV中的版本更高，则更新内存
    else if (this.memoryState.version < remoteVersion && remoteStateEntry.value) {
      this.memoryState.keyIndex = remoteStateEntry.value.keyIndex;
      this.memoryState.stats = remoteStateEntry.value.stats;
      this.memoryState.totalRequests = remoteStateEntry.value.totalRequests;
      this.memoryState.version = remoteStateEntry.value.version;
    }
    this.memoryState.lastSync = now;
  }

  public async resetKvStore() {
    console.log("🔄 正在重置KV存储...");
    // 删除新旧所有相关键
    await Promise.all([
      this.kv.delete(["state"]),
      this.kv.delete(["key_rotation"]),
      this.kv.delete(["stats"]),
      this.kv.delete(["api_key_index"]),
    ]);
    
    // 初始化内存状态
    this.memoryState = {
      keyIndex: 0,
      stats: Object.fromEntries(API_KEYS.map(key => [key, 0])),
      totalRequests: 0,
      version: 1, // 初始化版本为1
      lastSync: 0,
    };

    // 写入初始状态
    const { lastSync, ...initialState } = this.memoryState;
    await this.kv.set(["state"], initialState);
    console.log("✅ KV存储重置完成");
  }
  
  public async loadInitialState() {
    console.log("🔍 正在加载初始状态...");
    const [stateEntry, keyRotationEntry, statsEntry] = await this.kv.getMany<[AppState, {index: number, version: number}, {stats: Record<string, number>, total: number, version: number}]>([
      ["state"], 
      ["key_rotation"], 
      ["stats"]
    ]);

    // 优先加载新的统一状态
    if (stateEntry.value) {
      console.log("✅ 检测到统一状态，直接加载。");
      this.memoryState = { ...stateEntry.value, lastSync: 0 };
      console.log("💾 内存状态加载完成，当前版本:", this.memoryState.version);
      return;
    }

    // 如果统一状态不存在，则尝试从旧状态迁移
    if (keyRotationEntry.value || statsEntry.value) {
      console.log("🔄 检测到旧版数据，正在执行一次性迁移...");
      const newVersion = (keyRotationEntry.value?.version || 0) + (statsEntry.value?.version || 0) + 1;
      
      this.memoryState = {
        keyIndex: keyRotationEntry.value?.index || 0,
        stats: statsEntry.value?.stats || Object.fromEntries(API_KEYS.map(key => [key, 0])),
        totalRequests: statsEntry.value?.total || 0,
        version: newVersion,
        lastSync: 0,
      };

      // 写入新的统一状态
      const { lastSync, ...stateToSave } = this.memoryState;
      await this.kv.set(["state"], stateToSave);

      // 删除旧的键
      await this.kv.delete(["key_rotation"]);
      await this.kv.delete(["stats"]);
      await this.kv.delete(["api_key_index"]); // 同时清理更旧的键

      console.log("✅ 数据迁移完成，已合并到新的统一状态。版本:", newVersion);
      return;
    }

    console.log("🤷 未找到任何状态，将使用默认初始值。");
    // 如果没有任何数据，确保版本至少为1，以便首次同步时写入
    this.memoryState.version = 1;
  }

  public updateKeyUsage(key: string) {
    this.memoryState.stats[key] = (this.memoryState.stats[key] || 0) + 1;
    this.memoryState.totalRequests += 1;
    this.memoryState.version += 1; // 每次更新都增加版本号
  }

  public getNextApiKey(): string | undefined {
    if (API_KEYS.length === 0) {
      return undefined;
    }
    const currentKey = API_KEYS[this.memoryState.keyIndex];
    this.memoryState.keyIndex = (this.memoryState.keyIndex + 1) % API_KEYS.length;
    this.memoryState.version += 1; // 每次轮转都增加版本号
    return currentKey;
  }

  public async clearStats() {
    this.memoryState.stats = Object.fromEntries(API_KEYS.map(k => [k, 0]));
    this.memoryState.totalRequests = 0;
    this.memoryState.version += 1; // 版本号增加，触发同步
    // 更改会通过下一次 syncState 自动写入
  }
}

export const kvManager = new KVManager();
await kvManager.init();
