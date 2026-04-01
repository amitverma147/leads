import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt';
import { asyncHandler } from '../utils/async-handler';
import { prisma } from '../config/database';

/**
 * Authentication middleware - requires valid JWT token
 */
export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      throw ApiError.unauthorized('Access token is required');
    }

    try {
      const payload = verifyAccessToken(token);

      if (payload.type !== 'access') {
        throw ApiError.unauthorized('Invalid token type');
      }

      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, isActive: true },
      });

      if (!user) {
        throw ApiError.unauthorized('User not found');
      }

      if (!user.isActive) {
        throw ApiError.unauthorized('User account is deactivated');
      }

      // Attach user to request
      req.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        organizationId: payload.organizationId,
      };

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.unauthorized('Invalid or expired token');
    }
  }
);

/**
 * Optional authentication - attaches user if token is valid, continues if not
 */
export const optionalAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return next();
    }

    try {
      const payload = verifyAccessToken(token);

      if (payload.type === 'access') {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { id: true, isActive: true },
        });

        if (user && user.isActive) {
          req.user = {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
            organizationId: payload.organizationId,
          };
        }
      }
    } catch {
      // Token is invalid, but we continue without user
    }

    next();
  }
);