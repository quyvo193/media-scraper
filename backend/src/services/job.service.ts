import { prisma } from '../config/database';

/**
 * Job Service
 * Handles scrape job database operations
 */
export class JobService {
  /**
   * Create new scrape job
   */
  async create(userId: number | null, urls: string[]) {
    try {
      return await prisma.scrapeJob.create({
        data: {
          userId,
          urls,
          status: 'pending',
        },
      });
    } catch (error) {
      console.error('Error creating scrape job:', error);
      throw error;
    }
  }

  /**
   * Find job by ID
   */
  async findById(id: number) {
    try {
      return await prisma.scrapeJob.findUnique({
        where: { id },
        include: {
          media: true,
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error finding job by ID:', error);
      throw error;
    }
  }

  /**
   * Update job status
   */
  async updateStatus(id: number, status: string, completedAt?: Date) {
    try {
      return await prisma.scrapeJob.update({
        where: { id },
        data: {
          status,
          completedAt,
        },
      });
    } catch (error) {
      console.error('Error updating job status:', error);
      throw error;
    }
  }

  /**
   * Get all jobs with pagination
   */
  async findAll(page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const [jobs, total] = await Promise.all([
        prisma.scrapeJob.findMany({
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            _count: {
              select: { media: true },
            },
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        }),
        prisma.scrapeJob.count(),
      ]);

      return {
        data: jobs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error finding all jobs:', error);
      throw error;
    }
  }

  /**
   * Get jobs by user ID
   */
  async findByUserId(userId: number, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const [jobs, total] = await Promise.all([
        prisma.scrapeJob.findMany({
          where: { userId },
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            _count: {
              select: { media: true },
            },
          },
        }),
        prisma.scrapeJob.count({
          where: { userId },
        }),
      ]);

      return {
        data: jobs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error finding jobs by user ID:', error);
      throw error;
    }
  }

  /**
   * Delete job and associated media
   */
  async delete(id: number) {
    try {
      return await prisma.scrapeJob.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const jobService = new JobService();
