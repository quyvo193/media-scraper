import { prisma } from "../config/database";
import { Prisma } from "@prisma/client";
import { cacheService, CacheKeys, CacheTTL } from "../utils/cache";

/**
 * Media Service
 * Handles media item database operations with Redis caching
 */
export class MediaService {
  /**
   * Create media items in bulk
   */
  async createMany(
    jobId: number,
    sourceUrl: string,
    mediaItems: Array<{ mediaUrl: string; type: string; title?: string }>
  ) {
    try {
      const data = mediaItems.map((item) => ({
        jobId,
        sourceUrl,
        mediaUrl: item.mediaUrl,
        type: item.type,
        title: item.title || null,
      }));

      const result = await prisma.media.createMany({
        data,
        skipDuplicates: true, // Skip if duplicate media URLs exist
      });

      console.log(`✅ Created ${result.count} media items for job ${jobId}`);
      return result;
    } catch (error) {
      console.error("Error creating media items:", error);
      throw error;
    }
  }

  /**
   * Find media by ID
   */
  async findById(id: number) {
    try {
      return await prisma.media.findUnique({
        where: { id },
        include: {
          job: {
            select: {
              id: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error finding media by ID:", error);
      throw error;
    }
  }

  /**
   * Get paginated media with filters
   */
  async findAll(params: {
    page?: number;
    limit?: number;
    type?: "image" | "video";
    search?: string;
  }) {
    try {
      const { page = 1, limit = 20, type, search } = params;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.MediaWhereInput = {};

      if (type) {
        where.type = type;
      }

      if (search) {
        where.OR = [
          {
            title: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            sourceUrl: {
              contains: search,
              mode: "insensitive",
            },
          },
        ];
      }

      const [media, total] = await Promise.all([
        prisma.media.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            job: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        }),
        prisma.media.count({ where }),
      ]);

      return {
        data: media,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error finding media:", error);
      throw error;
    }
  }

  /**
   * Get media by job ID
   */
  async findByJobId(jobId: number) {
    try {
      return await prisma.media.findMany({
        where: { jobId },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (error) {
      console.error("Error finding media by job ID:", error);
      throw error;
    }
  }

  /**
   * Delete media item
   */
  async delete(id: number) {
    try {
      return await prisma.media.delete({
        where: { id },
      });
    } catch (error) {
      console.error("Error deleting media:", error);
      throw error;
    }
  }

  /**
   * Get media statistics (with Redis caching)
   */
  async getStats() {
    try {
      // Try to get from cache first
      return await cacheService.getOrSet(
        CacheKeys.mediaStats(),
        async () => {
          const [total, imageCount, videoCount, recentCount] =
            await Promise.all([
              prisma.media.count(),
              prisma.media.count({ where: { type: "image" } }),
              prisma.media.count({ where: { type: "video" } }),
              prisma.media.count({
                where: {
                  createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                  },
                },
              }),
            ]);

          return {
            total,
            images: imageCount,
            videos: videoCount,
            last24h: recentCount,
          };
        },
        CacheTTL.mediaStats
      );
    } catch (error) {
      console.error("Error getting media stats:", error);
      throw error;
    }
  }

  /**
   * Invalidate caches after media changes
   */
  async invalidateCaches(): Promise<void> {
    await cacheService.invalidateMediaCaches();
  }
}

// Export singleton instance
export const mediaService = new MediaService();
