import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { ApiError } from '../utils/api-error';
import { ApiResponse } from '../utils/api-response';
import { logger } from '../config/logger';
import { config } from '../config';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    userId: req.user?.userId,
  });

  // Handle ApiError (our custom error)
  if (err instanceof ApiError) {
    return ApiResponse.error(res, err.message, err.statusCode, err.errors);
  }

  // Handle Zod Validation Error
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return ApiResponse.badRequest(res, 'Validation failed', errors);
  }

  // Handle JWT Token Expired Error
  if (err instanceof TokenExpiredError) {
    return ApiResponse.unauthorized(res, 'Token has expired');
  }

  // Handle JWT Invalid Token Error
  if (err instanceof JsonWebTokenError) {
    return ApiResponse.unauthorized(res, 'Invalid token');
  }

  // Handle Prisma Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        // Unique constraint violation
        const field = (err.meta?.target as string[])?.join(', ') || 'field';
        return ApiResponse.conflict(res, `Duplicate value for ${field}`);
      }

      case 'P2003': {
        // Foreign key constraint violation
        return ApiResponse.badRequest(res, 'Invalid reference to related record');
      }

      case 'P2025': {
        // Record not found
        return ApiResponse.notFound(res, 'Record not found');
      }

      default: {
        logger.error('Prisma error:', { code: err.code, message: err.message });
        return ApiResponse.internalError(res, 'Database error occurred');
      }
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return ApiResponse.badRequest(res, 'Invalid data provided');
  }

  // Handle SyntaxError (invalid JSON)
  if (err instanceof SyntaxError && 'body' in err) {
    return ApiResponse.badRequest(res, 'Invalid JSON in request body');
  }

  // Default Error Response
  const statusCode = 500;
  const message = config.isProduction ? 'Internal server error' : err.message || 'Internal server error';

  return ApiResponse.internalError(res, message);
};

/**
 * Not found handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response, _next: NextFunction): Response => {
  return ApiResponse.notFound(res, `Route ${req.method} ${req.path} not found`);
};