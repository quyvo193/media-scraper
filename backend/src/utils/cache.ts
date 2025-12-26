import { createClient, RedisClientType } from "redis";
import { config } from "../config";

/**
 * Redis Cache Service
 * Caches frequently accessed data to reduce database load
 */
class CacheService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  /**
   * Initialize Redis connection
   */
  async initialize(): Promise<void> {
    if (this.client && this.isConnected) {
      return;
    }

    try {
      this.client = createClient({
        socket: {
          host: config.redis.host,
          port: config.redis.port,
        },
      });

      this.client.on("error", (err) => {
        console.error("[Cache] Redis error:", err);
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        console.log("[Cache] Redis connected");
        this.isConnected = true;
      });

      this.client.on("disconnect", () => {
        console.log("[Cache] Redis disconnected");
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error("[Cache] Failed to initialize Redis:", error);
      // Don't throw - cache is optional, app should work without it
    }
  }

  /**
   * Check if cache is available
   */
  isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const value = await this.client!.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      console.error(`[Cache] Error getting key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached value with TTL
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttlSeconds - Time to live in seconds (default: 60)
   */
  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number = 60
  ): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      await this.client!.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`[Cache] Error setting key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      await this.client!.del(key);
      return true;
    } catch (error) {
      console.error(`[Cache] Error deleting key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const keys = await this.client!.keys(pattern);
      if (keys.length > 0) {
        await this.client!.del(keys);
      }
      return true;
    } catch (error) {
      console.error(`[Cache] Error deleting pattern ${pattern}:`, error);
      return false;
    }
  }

  /**
   * Get or set with callback (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = 60
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      console.log(`[Cache] HIT: ${key}`);
      return cached;
    }

    console.log(`[Cache] MISS: ${key}`);
    // Fetch fresh data
    const value = await fetchFn();

    // Cache the result (fire and forget)
    this.set(key, value, ttlSeconds).catch(() => {});

    return value;
  }

  /**
   * Invalidate media-related caches
   * Called when new media is added
   */
  async invalidateMediaCaches(): Promise<void> {
    await this.deletePattern("media:*");
    await this.delete("stats:media");
  }

  /**
   * Invalidate job-related caches
   */
  async invalidateJobCaches(jobId?: number): Promise<void> {
    if (jobId) {
      await this.delete(`job:${jobId}`);
    }
    await this.deletePattern("jobs:*");
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      console.log("[Cache] Connection closed");
    }
  }
}

// Cache key generators
export const CacheKeys = {
  mediaStats: () => "stats:media",
  mediaList: (page: number, limit: number, type?: string, search?: string) =>
    `media:list:${page}:${limit}:${type || "all"}:${search || ""}`,
  mediaById: (id: number) => `media:${id}`,
  jobById: (id: number) => `job:${id}`,
  jobList: (page: number, limit: number) => `jobs:list:${page}:${limit}`,
  queueStats: () => "queue:stats",
  urlCache: (url: string) =>
    `url:${Buffer.from(url).toString("base64").slice(0, 100)}`,
};

// Cache TTLs in seconds
export const CacheTTL = {
  mediaStats: 30, // 30 seconds - stats change frequently
  mediaList: 60, // 1 minute - list pagination
  mediaById: 300, // 5 minutes - individual items
  jobById: 30, // 30 seconds - job status changes
  jobList: 30, // 30 seconds - job list
  queueStats: 5, // 5 seconds - real-time queue stats
  urlCache: 3600, // 1 hour - URL already scraped
};

// Export singleton instance
export const cacheService = new CacheService();
