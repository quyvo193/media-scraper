import Queue, { Job } from "bull";
import { redisConfig } from "../config/redis";
import { config } from "../config";
import { scraperManager } from "../scrapers";
import { mediaService, jobService } from "../services";
import { forceGC, logMemoryUsage, isMemoryLow } from "../utils/memory";
import { cacheService, CacheKeys, CacheTTL } from "../utils/cache";

/**
 * Job data interface
 */
export interface ScrapeJobData {
  jobId: number;
  url: string;
  priority?: number; // Higher priority = processed first
}

/**
 * Create and configure the scrape queue
 * Optimized for high throughput with memory constraints
 */
export const createScrapeQueue = (): Queue.Queue<ScrapeJobData> => {
  const queue = new Queue<ScrapeJobData>("scrape-queue", {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 2, // Retry failed jobs once
      timeout: config.scraper.timeout + 5000, // Add 5s buffer
      removeOnComplete: 50, // Reduced from 100 for memory optimization
      removeOnFail: 100, // Reduced from 200 for memory optimization
      backoff: {
        type: "exponential",
        delay: 2000, // Start with 2 second delay
      },
    },
    settings: {
      lockDuration: 60000, // 1 minute lock
      stalledInterval: 30000, // Check for stalled jobs every 30s
      maxStalledCount: 2, // Mark as failed after 2 stalls
    },
  });

  // Queue event handlers
  queue.on("error", (error) => {
    console.error("❌ Queue error:", error);
  });

  queue.on("failed", (job, error) => {
    const isFinalAttempt = job.attemptsMade >= (job.opts.attempts || 1);

    if (isFinalAttempt) {
      // Dead Letter Queue - structured logging for permanently failed jobs
      console.error("[DLQ] Job permanently failed:", {
        queueJobId: job.id,
        jobId: job.data.jobId,
        url: job.data.url,
        attempts: job.attemptsMade,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.error(
        `❌ Job ${job.id} failed (attempt ${job.attemptsMade}):`,
        error.message
      );
    }
  });

  queue.on("completed", (job) => {
    console.log(`✅ Job ${job.id} completed`);
  });

  queue.on("stalled", (job) => {
    console.warn(`⚠️  Job ${job.id} stalled`);
  });

  console.log("✅ Scrape queue created");

  return queue;
};

/**
 * Process scraping jobs
 */
export const processScrapeJob = async (
  job: Job<ScrapeJobData>
): Promise<void> => {
  const { jobId, url } = job.data;

  console.log(`[Queue] Processing job ${jobId}, URL: ${url}`);

  try {
    // Update job status to processing
    await jobService.updateStatus(jobId, "processing");

    // Check Redis cache first
    const cacheKey = CacheKeys.urlCache(url);
    const cachedResult =
      await cacheService.get<
        { mediaUrl: string; type: string; title?: string }[]
      >(cacheKey);

    if (cachedResult && cachedResult.length > 0) {
      console.log(`[Queue] Redis Cache HIT for ${url} - skipping scrape`);
      await mediaService.createMany(
        jobId,
        url,
        cachedResult.map((m) => ({
          mediaUrl: m.mediaUrl,
          type: m.type as "image" | "video",
          title: m.title,
        }))
      );
      job.progress(100);
      return;
    }

    // Check memory before scraping
    if (isMemoryLow(350)) {
      console.log("[Queue] Memory low, triggering GC before scrape");
      forceGC();
      logMemoryUsage("Queue Pre-scrape");
    }

    // Scrape the URL
    job.progress(25);
    const result = await scraperManager.scrape(url);

    job.progress(75);

    if (!result.success) {
      throw new Error(result.error || "Scraping failed");
    }

    // Save media to database
    if (result.media.length > 0) {
      await mediaService.createMany(jobId, url, result.media);
      // Cache in Redis
      await cacheService.set(cacheKey, result.media, CacheTTL.urlCache);
      // Invalidate media list caches
      await cacheService.invalidateMediaCaches();
    }

    job.progress(100);

    console.log(
      `[Queue] Successfully scraped ${url} - found ${result.media.length} media items`
    );

    // Trigger GC after heavy scraping if memory is high
    if (isMemoryLow(400)) {
      forceGC();
    }
  } catch (error: any) {
    console.error(`[Queue] Error processing job ${jobId}:`, error.message);
    throw error; // Re-throw to mark job as failed
  }
};

/**
 * Setup queue processor
 */
export const setupQueueProcessor = (
  queue: Queue.Queue<ScrapeJobData>
): void => {
  queue.process(config.scraper.concurrency, processScrapeJob);
  console.log(
    `✅ Queue processor started (concurrency: ${config.scraper.concurrency})`
  );
};
