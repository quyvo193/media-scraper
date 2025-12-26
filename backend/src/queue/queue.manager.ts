import Queue from "bull";
import {
  createScrapeQueue,
  setupQueueProcessor,
  ScrapeJobData,
} from "./scrape.queue";
import { jobService } from "../services";
import { cacheService } from "../utils/cache";
import { startMemoryMonitoring, stopMemoryMonitoring } from "../utils/memory";
import { getCpuLoad } from "../utils/cpu";

// CPU monitoring interval
let cpuMonitorInterval: NodeJS.Timeout | null = null;

/**
 * Queue Manager
 * Manages the scraping queue lifecycle
 */
class QueueManager {
  private queue: Queue.Queue<ScrapeJobData> | null = null;
  private isPausedByCpu: boolean = false;

  /**
   * Initialize the queue
   */
  async initialize(): Promise<void> {
    if (this.queue) {
      console.log("⚠️  Queue already initialized");
      return;
    }

    try {
      // Initialize cache service
      await cacheService.initialize();
      console.log("✅ Cache service initialized");

      // Create queue
      this.queue = createScrapeQueue();

      // Setup processor
      setupQueueProcessor(this.queue);

      // Setup job completion handlers
      this.setupEventHandlers();

      // Start memory monitoring (check every 30 seconds)
      startMemoryMonitoring(30000);

      // Start CPU monitoring (check every 5 seconds)
      this.startCpuMonitoring(5000);

      console.log("✅ Queue manager initialized");
    } catch (error) {
      console.error("❌ Failed to initialize queue:", error);
      throw error;
    }
  }

  /**
   * Add URLs to the queue for a specific job
   * Recent jobs get higher priority
   */
  async addUrlsToQueue(jobId: number, urls: string[]): Promise<void> {
    if (!this.queue) {
      throw new Error("Queue not initialized");
    }

    try {
      // Use timestamp-based priority (recent jobs get processed first)
      const priority = Date.now();

      // Add each URL as a separate job in the queue
      const jobs = urls.map((url) =>
        this.queue!.add(
          {
            jobId,
            url,
            priority,
          },
          {
            priority, // Bull processes lower priority numbers first, so we use negative
            lifo: true, // Last In First Out for recent jobs
          }
        )
      );

      await Promise.all(jobs);
    } catch (error) {
      console.error("❌ Failed to add URLs to queue:", error);
      throw error;
    }
  }

  /**
   * Setup event handlers to update job status
   */
  private setupEventHandlers(): void {
    if (!this.queue) {
      return;
    }

    // Track job completion per jobId
    const jobCompletionTracker = new Map<
      number,
      { total: number; completed: number; failed: number }
    >();

    this.queue.on("active", async (job) => {
      const { jobId } = job.data;

      // Initialize tracker if not exists
      if (!jobCompletionTracker.has(jobId)) {
        const dbJob = await jobService.findById(jobId);
        if (dbJob) {
          jobCompletionTracker.set(jobId, {
            total: dbJob.urls.length,
            completed: 0,
            failed: 0,
          });
        }
      }
    });

    this.queue.on("completed", async (job) => {
      const { jobId } = job.data;
      const tracker = jobCompletionTracker.get(jobId);

      if (tracker) {
        tracker.completed++;

        // Check if all URLs for this job are processed
        if (tracker.completed + tracker.failed >= tracker.total) {
          await jobService.updateStatus(jobId, "completed", new Date());
          jobCompletionTracker.delete(jobId);
        }
      }
    });

    this.queue.on("failed", async (job, error) => {
      const { jobId, url } = job.data;
      const tracker = jobCompletionTracker.get(jobId);

      console.error(`❌ Failed to scrape ${url}:`, error.message);

      if (tracker) {
        tracker.failed++;

        // Check if all URLs for this job are processed
        if (tracker.completed + tracker.failed >= tracker.total) {
          const status =
            tracker.failed === tracker.total ? "failed" : "completed";
          await jobService.updateStatus(jobId, status, new Date());

          jobCompletionTracker.delete(jobId);
        }
      }
    });
  }

  /**
   * Start CPU monitoring to pause/resume queue based on load
   * Pauses when CPU > 70%, resumes when CPU < 40%
   */
  private startCpuMonitoring(intervalMs: number = 5000): void {
    if (cpuMonitorInterval) {
      clearInterval(cpuMonitorInterval);
    }

    // Initial CPU reading (to establish baseline)
    getCpuLoad();

    cpuMonitorInterval = setInterval(async () => {
      if (!this.queue) return;

      const cpuLoad = getCpuLoad();

      if (cpuLoad > 70 && !this.isPausedByCpu) {
        // CPU too high - pause queue to prioritize API
        await this.queue.pause();
        this.isPausedByCpu = true;
      } else if (cpuLoad < 40 && this.isPausedByCpu) {
        // CPU recovered - resume queue
        await this.queue.resume();
        this.isPausedByCpu = false;
      }
    }, intervalMs);

    console.log("✅ CPU monitoring started (pause >70%, resume <40%)");
  }

  /**
   * Stop CPU monitoring
   */
  private stopCpuMonitoring(): void {
    if (cpuMonitorInterval) {
      clearInterval(cpuMonitorInterval);
      cpuMonitorInterval = null;
    }
  }

  /**
   * Get queue instance
   */
  getQueue(): Queue.Queue<ScrapeJobData> {
    if (!this.queue) {
      throw new Error("Queue not initialized");
    }
    return this.queue;
  }

  /**
   * Get queue stats
   */
  async getStats() {
    if (!this.queue) {
      throw new Error("Queue not initialized");
    }

    const [waiting, active, completed, failed, isPaused] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.isPaused(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      isPaused,
      pausedByCpu: this.isPausedByCpu,
    };
  }

  /**
   * Cleanup and close queue
   */
  async close(): Promise<void> {
    // Stop CPU monitoring
    this.stopCpuMonitoring();

    // Stop memory monitoring
    stopMemoryMonitoring();

    // Close cache service
    await cacheService.close();

    if (this.queue) {
      await this.queue.close();
      this.queue = null;
      console.log("🔌 Queue closed");
    }
  }
}

// Export singleton instance
export const queueManager = new QueueManager();
