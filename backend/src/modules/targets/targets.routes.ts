import { Router } from 'express';
import * as targetsController from './targets.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin, requireRole } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { ROLES } from '../../config/constants';
import {
  createTargetSchema,
  updateTargetSchema,
  assignTargetSchema,
  targetIdParamSchema,
  targetListQuerySchema,
  leaderboardQuerySchema,
} from './targets.validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Target CRUD routes (Admin only)
 */
router.post(
  '/',
  requireAdmin,
  validate({ body: createTargetSchema }),
  targetsController.createTarget
);

router.get(
  '/',
  validate({ query: targetListQuerySchema }),
  targetsController.getTargets
);

router.get(
  '/:id',
  validate({ params: targetIdParamSchema }),
  targetsController.getTargetById
);

router.patch(
  '/:id',
  requireAdmin,
  validate({ params: targetIdParamSchema, body: updateTargetSchema }),
  targetsController.updateTarget
);

router.delete(
  '/:id',
  requireAdmin,
  validate({ params: targetIdParamSchema }),
  targetsController.deleteTarget
);

/**
 * Target assignment routes (Admin only)
 */
router.post(
  '/assign',
  requireAdmin,
  validate({ body: assignTargetSchema }),
  targetsController.assignTarget
);

router.post(
  '/:id/unassign',
  requireAdmin,
  validate({ params: targetIdParamSchema }),
  targetsController.unassignTarget
);

/**
 * Performance routes
 */
router.get(
  '/my-performance',
  targetsController.getMyPerformance
);

router.get(
  '/team/:teamId/performance',
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MARKETING_MANAGER, ROLES.AGENT_SUPERVISOR),
  targetsController.getTeamPerformance
);

router.get(
  '/user/:userId/performance',
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MARKETING_MANAGER, ROLES.AGENT_SUPERVISOR),
  targetsController.getUserPerformance
);

/**
 * Leaderboard route
 */
router.get(
  '/leaderboard',
  validate({ query: leaderboardQuerySchema }),
  targetsController.getLeaderboard
);

export default router;