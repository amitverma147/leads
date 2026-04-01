import { Request, Response, NextFunction } from 'express';
import { Role, ROLES } from '../config/constants';
import { ApiError } from '../utils/api-error';
import { asyncHandler } from '../utils/async-handler';

/**
 * Role hierarchy - higher number means more permissions
 */
const roleHierarchy: Record<Role, number> = {
  [ROLES.SUPER_ADMIN]: 100,
  [ROLES.ADMIN]: 80,
  [ROLES.MARKETING_MANAGER]: 60,
  [ROLES.AGENT_SUPERVISOR]: 60,
  [ROLES.MARKETING_AGENT]: 40,
  [ROLES.FIELD_AGENT]: 40,
};

/**
 * Require specific roles
 */
export const requireRole = (...allowedRoles: Role[]) => {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const userRole = req.user.role as Role;

    if (!allowedRoles.includes(userRole)) {
      throw ApiError.forbidden('You do not have permission to perform this action');
    }

    next();
  });
};

/**
 * Require minimum role level based on hierarchy
 */
export const requireMinRole = (minRole: Role) => {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const userRole = req.user.role as Role;
    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[minRole] || 0;

    if (userLevel < requiredLevel) {
      throw ApiError.forbidden('You do not have sufficient permissions for this action');
    }

    next();
  });
};

/**
 * Require admin role (admin or super_admin)
 */
export const requireAdmin = requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN);

/**
 * Require super admin role only
 */
export const requireSuperAdmin = requireRole(ROLES.SUPER_ADMIN);

/**
 * Require marketing team member
 */
export const requireMarketingTeam = requireRole(
  ROLES.MARKETING_MANAGER,
  ROLES.MARKETING_AGENT,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN
);

/**
 * Require field team member
 */
export const requireFieldTeam = requireRole(
  ROLES.AGENT_SUPERVISOR,
  ROLES.FIELD_AGENT,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN
);

/**
 * Check if user can access a specific organization's resources
 */
export const requireSameOrganization = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    // Super admin can access all organizations
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    // Get organization ID from request (params, body, or query)
    const requestOrgId =
      req.params.organizationId || req.body?.organizationId || req.query?.organizationId;

    if (requestOrgId && requestOrgId !== req.user.organizationId) {
      throw ApiError.forbidden('You do not have access to this organization');
    }

    next();
  }
);