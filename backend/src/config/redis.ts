import { createClient } from 'redis';
import { config } from './env';

/**
 * Redis client for Bull queue
 */
export const createRedisClient = () => {
  const client = createClient({
    socket: {
      host: config.redis.host,
      port: config.redis.port,
    },
  });

  client.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  client.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });

  return client;
};

/**
 * Redis configuration for Bull
 */
export const redisConfig = {
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null, // Required for Bull
  enableReadyCheck: false,
};
