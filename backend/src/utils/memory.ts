/**
 * Memory optimization utilities for low-memory environments (1GB RAM)
 */

/**
 * Force garbage collection if available (requires --expose-gc flag)
 * Useful after heavy operations like Puppeteer scraping
 */
export const forceGC = (): void => {
  if (global.gc) {
    try {
      global.gc();
      console.log("[Memory] Garbage collection triggered");
    } catch (e) {
      console.warn("[Memory] GC not available - start with --expose-gc");
    }
  }
};

/**
 * Get current memory usage in MB
 */
export const getMemoryUsage = (): {
  heapUsed: number;
  heapTotal: number;
  rss: number;
  external: number;
  arrayBuffers: number;
} => {
  const memUsage = process.memoryUsage();
  return {
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    rss: Math.round(memUsage.rss / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024),
    arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024),
  };
};

/**
 * Log memory usage for monitoring
 */
export const logMemoryUsage = (label: string = "Memory"): void => {
  const usage = getMemoryUsage();
  console.log(
    `[${label}] Heap: ${usage.heapUsed}MB / ${usage.heapTotal}MB | RSS: ${usage.rss}MB | External: ${usage.external}MB`
  );
};

/**
 * Check if memory is running low (above threshold)
 * @param thresholdMB - Memory threshold in MB (default: 500MB for 1GB container)
 */
export const isMemoryLow = (thresholdMB: number = 500): boolean => {
  const usage = getMemoryUsage();
  return usage.heapUsed > thresholdMB;
};

/**
 * Memory-aware operation wrapper
 * Triggers GC before and after heavy operations if memory is low
 */
export const withMemoryManagement = async <T>(
  operation: () => Promise<T>,
  label: string = "Operation"
): Promise<T> => {
  // Check memory before operation
  if (isMemoryLow()) {
    console.log(`[Memory] Low memory detected before ${label}, triggering GC`);
    forceGC();
    logMemoryUsage(`Before ${label}`);
  }

  try {
    const result = await operation();
    return result;
  } finally {
    // Force GC after heavy operations if memory is still high
    if (isMemoryLow()) {
      forceGC();
      logMemoryUsage(`After ${label}`);
    }
  }
};

/**
 * Delay execution to allow GC to run
 */
export const gcDelay = (ms: number = 100): Promise<void> => {
  return new Promise((resolve) => {
    forceGC();
    setTimeout(resolve, ms);
  });
};

/**
 * Stream-friendly chunk size for large responses
 * Adjusts based on available memory (optimized for 1GB container)
 */
export const getOptimalChunkSize = (): number => {
  const usage = getMemoryUsage();
  const availableMB = 650 - usage.heapUsed; // Target 650MB for backend in 1GB container

  if (availableMB < 75) {
    return 10; // Very low memory: 10 items per chunk
  } else if (availableMB < 150) {
    return 25; // Low memory: 25 items per chunk
  } else if (availableMB < 300) {
    return 50; // Medium memory: 50 items per chunk
  }
  return 150; // Normal: 150 items per chunk
};

/**
 * Periodic memory monitoring
 */
let memoryMonitorInterval: NodeJS.Timeout | null = null;

export const startMemoryMonitoring = (intervalMs: number = 60000): void => {
  if (memoryMonitorInterval) {
    return;
  }

  memoryMonitorInterval = setInterval(() => {
    const usage = getMemoryUsage();

    // Log warning if memory is high (500MB threshold for 1GB container)
    if (usage.heapUsed > 500) {
      console.warn(`[Memory] WARNING: High memory usage - ${usage.heapUsed}MB`);
      forceGC();
    }
  }, intervalMs);

  console.log(`[Memory] Monitoring started (interval: ${intervalMs}ms)`);
};

export const stopMemoryMonitoring = (): void => {
  if (memoryMonitorInterval) {
    clearInterval(memoryMonitorInterval);
    memoryMonitorInterval = null;
    console.log("[Memory] Monitoring stopped");
  }
};
