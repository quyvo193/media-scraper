import { Router, Request, Response } from 'express';
import { basicAuth } from '../middleware/auth.middleware';
import { validate, schemas } from '../middleware/validation.middleware';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { mediaService } from '../services';

const router = Router();

/**
 * GET /api/media
 * Get all media with pagination and filters
 * Requires: Basic Auth
 */
router.get(
  '/',
  basicAuth,
  validate(schemas.mediaQuery, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, type, search } = req.query as any;

    const result = await mediaService.findAll({
      page,
      limit,
      type,
      search,
    });

    res.json({
      success: true,
      data: result.data.map((media) => ({
        id: media.id,
        media_url: media.mediaUrl,
        type: media.type,
        title: media.title,
        source_url: media.sourceUrl,
        created_at: media.createdAt,
        job_id: media.jobId,
      })),
      pagination: result.pagination,
    });
  })
);

/**
 * GET /api/media/stats
 * Get media statistics
 * Requires: Basic Auth
 */
router.get(
  '/stats',
  basicAuth,
  asyncHandler(async (_req: Request, res: Response) => {
    const stats = await mediaService.getStats();

    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * GET /api/media/:id
 * Get specific media item
 * Requires: Basic Auth
 */
router.get(
  '/:id',
  basicAuth,
  validate(schemas.mediaId, 'params'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const mediaId = Number(id);

    const media = await mediaService.findById(mediaId);

    if (!media) {
      throw new ApiError(404, 'Media not found');
    }

    res.json({
      success: true,
      data: {
        id: media.id,
        media_url: media.mediaUrl,
        type: media.type,
        title: media.title,
        source_url: media.sourceUrl,
        created_at: media.createdAt,
        job_id: media.jobId,
        job: media.job,
      },
    });
  })
);

export default router;
