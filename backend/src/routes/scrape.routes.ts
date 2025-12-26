import { Router, Request, Response } from "express";
import { basicAuth } from "../middleware/auth.middleware";
import { validate, schemas } from "../middleware/validation.middleware";
import { asyncHandler } from "../middleware/error.middleware";
import { jobService } from "../services";
import { queueManager } from "../queue";

const router = Router();

/**
 * POST /api/scrape
 * Submit URLs for scraping
 * Requires: Basic Auth
 */
router.post(
  "/",
  basicAuth,
  validate(schemas.scrapeRequest, "body"),
  asyncHandler(async (req: Request, res: Response) => {
    const { urls } = req.body;
    const user = (req as any).user;

    // Deduplicate URLs within the request
    const uniqueUrls = [...new Set(urls as string[])];
    const duplicatesRemoved = urls.length - uniqueUrls.length;

    // Create scrape job in database with unique URLs
    const job = await jobService.create(user?.id || null, uniqueUrls);

    // Add URLs to scraping queue
    queueManager.addUrlsToQueue(job.id, uniqueUrls);

    res.status(201).json({
      success: true,
      message: "Scrape job created and queued successfully",
      data: {
        job_id: job.id,
        status: job.status,
        total_urls: uniqueUrls.length,
        duplicates_removed: duplicatesRemoved,
        created_at: job.createdAt,
      },
    });
  })
);

/**
 * GET /api/scrape/queue/stats
 * Get queue statistics
 * Requires: Basic Auth
 */
router.get(
  "/queue/stats",
  basicAuth,
  asyncHandler(async (_req: Request, res: Response) => {
    const stats = await queueManager.getStats();

    res.json({
      success: true,
      data: stats,
    });
  })
);

export default router;
