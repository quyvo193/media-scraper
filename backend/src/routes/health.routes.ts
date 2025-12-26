import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { DatabaseClient } from '../config/database';
import { getMemoryUsage, isMemoryLow } from '../utils/memory';
import { cacheService } from '../utils/cache';

const router = Router();

/**
 * GET /health
 * Health check endpoint (no auth required)
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const dbHealthy = await DatabaseClient.healthCheck();
    const memUsage = getMemoryUsage();

    const health = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      environment: process.env.NODE_ENV,
      database: dbHealthy ? 'connected' : 'disconnected',
      cache: cacheService.isAvailable() ? 'connected' : 'disconnected',
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        rss: memUsage.rss,
        external: memUsage.external,
        unit: 'MB',
        warning: isMemoryLow() ? 'HIGH_MEMORY_USAGE' : null,
      },
    };

    const statusCode = dbHealthy ? 200 : 503;
    res.status(statusCode).json(health);
  })
);

/**
 * GET /health/detailed
 * Detailed health check with all system info
 */
router.get(
  '/detailed',
  asyncHandler(async (_req: Request, res: Response) => {
    const dbHealthy = await DatabaseClient.healthCheck();
    const memUsage = getMemoryUsage();

    const health = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: Math.round(process.uptime()),
        formatted: formatUptime(process.uptime()),
      },
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      services: {
        database: dbHealthy ? 'connected' : 'disconnected',
        cache: cacheService.isAvailable() ? 'connected' : 'disconnected',
      },
      memory: {
        ...memUsage,
        unit: 'MB',
        warning: isMemoryLow() ? 'HIGH_MEMORY_USAGE' : null,
        gcAvailable: typeof global.gc === 'function',
      },
      process: {
        pid: process.pid,
        cpuUsage: process.cpuUsage(),
      },
    };

    const statusCode = dbHealthy ? 200 : 503;
    res.status(statusCode).json(health);
  })
);

/**
 * Format uptime as human-readable string
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

export default router;
