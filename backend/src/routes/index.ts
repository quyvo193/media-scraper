import { Router } from 'express';
import authRoutes from './auth.routes';
import scrapeRoutes from './scrape.routes';
import jobRoutes from './job.routes';
import mediaRoutes from './media.routes';
import healthRoutes from './health.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/scrape', scrapeRoutes);
router.use('/jobs', jobRoutes);
router.use('/media', mediaRoutes);

// Health check (not under /api)
export { healthRoutes };

export default router;
