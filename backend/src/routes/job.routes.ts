import { Router, Request, Response } from 'express';
import { basicAuth } from '../middleware/auth.middleware';
import { validate, schemas } from '../middleware/validation.middleware';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { jobService, mediaService } from '../services';

const router = Router();

/**
 * GET /api/jobs/:id
 * Get job status and details
 * Requires: Basic Auth
 */
router.get(
  '/:id',
  basicAuth,
  validate(schemas.jobId, 'params'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const jobId = Number(id);

    // Find job
    const job = await jobService.findById(jobId);

    if (!job) {
      throw new ApiError(404, 'Job not found');
    }

    // Get media count for this job
    const media = await mediaService.findByJobId(jobId);

    res.json({
      success: true,
      data: {
        job_id: job.id,
        status: job.status,
        total_urls: job.urls.length,
        media_found: media.length,
        created_at: job.createdAt,
        completed_at: job.completedAt,
        urls: job.urls,
      },
    });
  })
);

/**
 * GET /api/jobs
 * Get all jobs with pagination
 * Requires: Basic Auth
 */
router.get(
  '/',
  basicAuth,
  validate(schemas.jobQuery, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query as any;

    const result = await jobService.findAll(page, limit);

    res.json({
      success: true,
      data: result.data.map((job) => ({
        job_id: job.id,
        status: job.status,
        total_urls: job.urls.length,
        media_found: (job as any)._count.media,
        created_at: job.createdAt,
        completed_at: job.completedAt,
      })),
      pagination: result.pagination,
    });
  })
);

export default router;
