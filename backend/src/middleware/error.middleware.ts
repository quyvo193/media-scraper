import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Global error handling middleware
 * Catches all errors and formats them consistently
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      })),
    });
    return;
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (error.code === 'P2002') {
      res.status(409).json({
        error: 'Conflict',
        message: 'Resource already exists',
        details: error.meta,
      });
      return;
    }

    // Record not found
    if (error.code === 'P2025') {
      res.status(404).json({
        error: 'Not Found',
        message: 'Resource not found',
      });
      return;
    }

    // Foreign key constraint violation
    if (error.code === 'P2003') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid reference',
        details: error.meta,
      });
      return;
    }
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid data provided',
    });
    return;
  }

  // Handle custom API errors
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      error: error.name,
      message: error.message,
      details: error.details,
    });
    return;
  }

  // Handle generic errors
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development'
      ? error.message
      : 'An unexpected error occurred',
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
