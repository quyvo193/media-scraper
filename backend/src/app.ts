import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { config } from './config';
import routes, { healthRoutes } from './routes';
import { errorHandler, notFoundHandler } from './middleware';

/**
 * Create and configure Express application
 * Optimized for performance and low memory usage
 */
export const createApp = (): Application => {
  const app: Application = express();

  // Enable trust proxy for proper IP detection behind reverse proxy
  app.set('trust proxy', 1);

  // Enable HTTP keep-alive for connection reuse
  app.set('keepAliveTimeout', 65000); // Slightly higher than typical load balancer timeout
  app.set('headersTimeout', 66000);

  // Compression middleware - reduces response size
  app.use(compression({
    level: 6, // Balanced compression level
    threshold: 1024, // Only compress responses > 1KB
    filter: (req, res) => {
      // Don't compress if client doesn't accept it
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
  }));

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging middleware
  if (config.server.isDevelopment) {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Health check endpoint (no auth)
  app.use('/health', healthRoutes);

  // API routes (with auth)
  app.use('/api', routes);

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};
