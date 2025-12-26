import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Validation middleware factory
 * Validates request body, query, or params against a Zod schema
 */
export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = req[source];
      const validated = schema.parse(data);

      // Replace request data with validated data
      (req as any)[source] = validated;

      next();
    } catch (error) {
      next(error); // Pass to error handler
    }
  };
};

/**
 * Common validation schemas
 */
export const schemas = {
  // Login request validation
  loginRequest: z.object({
    username: z
      .string()
      .min(1, { message: 'Username is required' })
      .max(255, { message: 'Username must be less than 255 characters' }),
    password: z
      .string()
      .min(1, { message: 'Password is required' }),
  }),

  // Scrape request validation
  scrapeRequest: z.object({
    urls: z
      .array(z.string().url({ message: 'Each URL must be a valid URL' }))
      .min(1, { message: 'At least one URL is required' })
      .max(100, { message: 'Maximum 100 URLs allowed per request' }),
  }),

  // Job ID parameter validation
  jobId: z.object({
    id: z.string().regex(/^\d+$/, 'Job ID must be a number').transform(Number),
  }),

  // Media ID parameter validation
  mediaId: z.object({
    id: z.string().regex(/^\d+$/, 'Media ID must be a number').transform(Number),
  }),

  // Media query parameters validation
  mediaQuery: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? Number(val) : 1))
      .refine((val) => val > 0, 'Page must be greater than 0'),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? Number(val) : 20))
      .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
    type: z
      .enum(['image', 'video'])
      .optional(),
    search: z
      .string()
      .optional()
      .transform((val) => (val && val.trim().length > 0 ? val.trim() : undefined)),
  }),

  // Job query parameters validation
  jobQuery: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? Number(val) : 1))
      .refine((val) => val > 0, 'Page must be greater than 0'),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? Number(val) : 20))
      .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  }),
};
