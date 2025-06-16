import { API_KEYS, RESET_KV } from "./config.ts";

interface MemoryState {
  keyIndex: number;
  keyVersion: number;
  lastKeyUpdate: number;
  stats: Record<string, number>;
  totalRequests: number;
  statsVersion: number;
  lastStatsUpdate: number;
}

export class KVManager {
  private kv: Deno.Kv;
  private memoryState: MemoryState;

  constructor() {
    this.kv = {} as Deno.Kv; // 占位符，将在 init 方法中初始化
    this.memoryState = {
      keyIndex: 0,
      keyVersion: 0,
      lastKeyUpdate: 0,
      stats: Object.fromEntries(API_KEYS.map(key => [key, 0])),
      totalRequests: 0,
      statsVersion: 0,
      lastStatsUpdate: 0
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

  public getMemoryState(): MemoryState {
    return this.memoryState;
  }

  public async syncState() {
    const now = Date.now();
    
    // 轮转状态同步 (每9秒同步一次)
    if (now - this.memoryState.lastKeyUpdate > 9000) {
      const remoteKeyData = await this.kv.get(["key_rotation"]);
      const remoteKeyVersion = (remoteKeyData.value as {version: number} | null)?.version || 0;
      
      // 如果内存中的版本更新，则写入KV
      if (this.memoryState.keyVersion > remoteKeyVersion) {
        await this.kv.set(["key_rotation"], {
          index: this.memoryState.keyIndex,
          version: this.memoryState.keyVersion
        });
      } 
      // 如果KV中的版本更新，则更新内存
      else if (this.memoryState.keyVersion < remoteKeyVersion) {
        // 确保 remoteKeyData.value 不为 null
        if (remoteKeyData.value) {
          this.memoryState.keyIndex = (remoteKeyData.value as {index: number}).index;
          this.memoryState.keyVersion = remoteKeyVersion;
        }
      }
      this.memoryState.lastKeyUpdate = now;
    }
  
    // 统计状态同步 (每9秒同步一次)
    if (now - this.memoryState.lastStatsUpdate > 9000) {
      const remoteStatsData = await this.kv.get(["stats"]);
      const remoteStatsVersion = (remoteStatsData.value as {version: number} | null)?.version || 0;
      
      // 如果内存中的版本更新，则写入KV
      if (this.memoryState.statsVersion > remoteStatsVersion) {
        await this.kv.set(["stats"], {
          stats: this.memoryState.stats,
          total: this.memoryState.totalRequests,
          version: this.memoryState.statsVersion
        });
      } 
      // 如果KV中的版本更新，则更新内存
      else if (this.memoryState.statsVersion < remoteStatsVersion) {
        // 确保 remoteStatsData.value 不为 null
        if (remoteStatsData.value) {
          this.memoryState.stats = (remoteStatsData.value as {stats: Record<string, number>}).stats;
          this.memoryState.totalRequests = (remoteStatsData.value as {total: number}).total;
          this.memoryState.statsVersion = remoteStatsVersion;
        }
      }
      this.memoryState.lastStatsUpdate = now;
    }
  }

  public async resetKvStore() {
    console.log("🔄 正在重置KV存储...");
    const oldKeys = [
      "api_key_index", // 旧版键
      "key_rotation",
      "stats"
    ];
    
    // 批量删除旧数据
    await Promise.all(oldKeys.map(key => this.kv.delete([key])));
    
    // 初始化内存状态
    this.memoryState = {
      keyIndex: 0,
      keyVersion: 0,
      lastKeyUpdate: 0,
      stats: Object.fromEntries(API_KEYS.map(key => [key, 0])),
      totalRequests: 0,
      statsVersion: 0,
      lastStatsUpdate: 0
    };
  
    // 写入初始状态
    await this.kv.set(["key_rotation"], { index: 0, version: 0 });
    await this.kv.set(["stats"], { 
      stats: this.memoryState.stats, 
      total: 0, 
      version: 0 
    });
    console.log("✅ KV存储重置完成");
  }
  
  public async loadInitialState() {
    console.log("🔍 正在加载初始状态...");
    const [oldKeyEntry, keyRotationEntry, statsEntry] = await this.kv.getMany([
      ["api_key_index"], // 旧版轮转索引
      ["key_rotation"],  // 新版轮转数据
      ["stats"]          // 统计信息
    ]);
  
    // 迁移旧版轮转数据
    if (oldKeyEntry.value && typeof oldKeyEntry.value === "number") {
      console.log("🔄 检测到旧版轮转数据，正在迁移...");
      this.memoryState.keyIndex = oldKeyEntry.value;
      this.memoryState.keyVersion = 1;
      await this.kv.set(["key_rotation"], { 
        index: this.memoryState.keyIndex, 
        version: this.memoryState.keyVersion 
      });
      await this.kv.delete(["api_key_index"]);
      console.log("✅ 轮转数据迁移完成");
    }
  
    // 加载新版轮转数据
    if (keyRotationEntry.value) {
      const { index, version } = keyRotationEntry.value as { index: number, version: number };
      if (version > this.memoryState.keyVersion) {
        this.memoryState.keyIndex = index;
        this.memoryState.keyVersion = version;
      }
    }
  
    // 迁移旧版统计信息
    // 注意：此处对旧版 `index` 字段的判断，假定旧版统计数据结构包含 `index`
    if (statsEntry.value && typeof statsEntry.value === 'object' && statsEntry.value !== null && "index" in statsEntry.value) {
      console.log("🔄 检测到旧版统计数据，正在迁移...");
      const oldStats = statsEntry.value as { stats: Record<string, number>, total: number, index: number };
      this.memoryState.stats = oldStats.stats;
      this.memoryState.totalRequests = oldStats.total;
      this.memoryState.statsVersion = oldStats.index + 1; // 确保新版本号高于旧版本
      await this.kv.set(["stats"], {
        stats: this.memoryState.stats,
        total: this.memoryState.totalRequests,
        version: this.memoryState.statsVersion
      });
      console.log("✅ 统计信息迁移完成");
    }
  
    // 加载新版统计信息
    const newStatsEntry = await this.kv.get(["stats"]);
    if (newStatsEntry.value && typeof newStatsEntry.value === 'object' && newStatsEntry.value !== null && "version" in newStatsEntry.value) {
      const { stats, total, version } = newStatsEntry.value as { stats: Record<string, number>, total: number, version: number };
      if (version > this.memoryState.statsVersion) {
        this.memoryState.stats = stats;
        this.memoryState.totalRequests = total;
        this.memoryState.statsVersion = version;
      }
    }
  
    console.log("💾 内存状态加载完成");
    console.log("当前轮转版本:", this.memoryState.keyVersion);
    console.log("当前统计版本:", this.memoryState.statsVersion);
  }

  // 新增方法，用于更新 API Key 的使用统计
  public updateKeyUsage(key: string) {
    this.memoryState.stats[key] = (this.memoryState.stats[key] || 0) + 1;
    this.memoryState.totalRequests += 1;
    this.memoryState.statsVersion += 1; // 每次统计都增加版本号
  }

  // 新增方法，用于获取下一个 API Key
  public getNextApiKey(): string | undefined {
    if (API_KEYS.length === 0) {
      return undefined;
    }
    const currentKey = API_KEYS[this.memoryState.keyIndex];
    this.memoryState.keyIndex = (this.memoryState.keyIndex + 1) % API_KEYS.length;
    this.memoryState.keyVersion += 1; // 每次轮转都增加版本号
    return currentKey;
  }

  // 新增方法，用于清除统计数据
  public async clearStats() {
    this.memoryState.stats = Object.fromEntries(API_KEYS.map(k => [k, 0]));
    this.memoryState.totalRequests = 0;
    this.memoryState.statsVersion += 1;
    await this.kv.set(["stats"], {
      stats: this.memoryState.stats,
      total: 0,
      version: this.memoryState.statsVersion
    });
  }
}

export const kvManager = new KVManager();
await kvManager.init();
