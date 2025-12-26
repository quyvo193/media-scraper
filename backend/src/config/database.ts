import { PrismaClient, Prisma } from '@prisma/client';

/**
 * Database configuration with connection pooling
 * Optimized for 1GB RAM constraint
 */
const getLogConfig = (): Prisma.LogLevel[] => {
  if (process.env.NODE_ENV === 'development') {
    return ['query', 'info', 'warn', 'error'];
  }
  return ['warn', 'error'];
};

const DATABASE_CONFIG = {
  // Connection pool settings for low-memory environment
  // PostgreSQL has 200MB allocated in docker-compose
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: getLogConfig(),
};

/**
 * Prisma Client Singleton
 * Ensures only one instance exists throughout the application
 */
class DatabaseClient {
  private static instance: PrismaClient | null = null;

  /**
   * Get or create Prisma Client instance
   */
  public static getInstance(): PrismaClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new PrismaClient(DATABASE_CONFIG);

      // Handle connection errors
      DatabaseClient.instance.$connect()
        .then(() => {
          console.log('✅ Database connected successfully');
        })
        .catch((error) => {
          console.error('❌ Database connection failed:', error);
          process.exit(1);
        });

      // Graceful shutdown handler
      process.on('beforeExit', async () => {
        await DatabaseClient.disconnect();
      });

      process.on('SIGINT', async () => {
        await DatabaseClient.disconnect();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        await DatabaseClient.disconnect();
        process.exit(0);
      });
    }

    return DatabaseClient.instance;
  }

  /**
   * Disconnect from database
   */
  public static async disconnect(): Promise<void> {
    if (DatabaseClient.instance) {
      await DatabaseClient.instance.$disconnect();
      DatabaseClient.instance = null;
      console.log('🔌 Database disconnected');
    }
  }

  /**
   * Check database connection health
   */
  public static async healthCheck(): Promise<boolean> {
    try {
      const client = DatabaseClient.getInstance();
      await client.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const prisma = DatabaseClient.getInstance();
export { DatabaseClient };
