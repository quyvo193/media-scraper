import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

/**
 * Environment variables validation schema
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),

  // Database
  DATABASE_URL: z.string().url().min(1, 'DATABASE_URL is required'),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),

  // Authentication
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  BASIC_AUTH_USERNAME: z.string().default('admin'),
  BASIC_AUTH_PASSWORD: z.string().default('admin123'),

  // Scraper Configuration (optimized for 1GB RAM)
  // Concurrency: 3 allows parallel processing while staying under memory limits
  SCRAPER_CONCURRENCY: z.string().transform(Number).default('3'),
  SCRAPER_TIMEOUT: z.string().transform(Number).default('30000'),
  MAX_URLS_PER_REQUEST: z.string().transform(Number).default('100'),

  // Puppeteer Configuration
  PUPPETEER_HEADLESS: z.string().transform((val) => val === 'true').default('true'),
  PUPPETEER_DISABLE_IMAGES: z.string().transform((val) => val === 'true').default('true'),
});

/**
 * Validate and parse environment variables
 */
export const env = envSchema.parse(process.env);

/**
 * Type-safe environment configuration
 */
export const config = {
  server: {
    env: env.NODE_ENV,
    port: env.PORT,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
  },
  database: {
    url: env.DATABASE_URL,
  },
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
  auth: {
    jwtSecret: env.JWT_SECRET,
    basicAuth: {
      username: env.BASIC_AUTH_USERNAME,
      password: env.BASIC_AUTH_PASSWORD,
    },
  },
  scraper: {
    concurrency: env.SCRAPER_CONCURRENCY,
    timeout: env.SCRAPER_TIMEOUT,
    maxUrlsPerRequest: env.MAX_URLS_PER_REQUEST,
  },
  puppeteer: {
    headless: env.PUPPETEER_HEADLESS,
    disableImages: env.PUPPETEER_DISABLE_IMAGES,
  },
} as const;

/**
 * Log configuration on startup (development only)
 */
if (config.server.isDevelopment) {
  console.log('⚙️  Configuration loaded:', {
    env: config.server.env,
    port: config.server.port,
    redis: `${config.redis.host}:${config.redis.port}`,
    scraper: {
      concurrency: config.scraper.concurrency,
      timeout: config.scraper.timeout,
    },
  });
}
