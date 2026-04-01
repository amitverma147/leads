import { Router } from 'express';
import * as teamsController from './teams.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createTeamSchema,
  updateTeamSchema,
  teamIdParamSchema,
  addTeamMemberSchema,
  teamListQuerySchema,
} from './teams.validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Team CRUD routes (Admin only for create, update, delete)
 */
router.post(
  '/',
  requireAdmin,
  validate({ body: createTeamSchema }),
  teamsController.createTeam
);

router.get(
  '/',
  validate({ query: teamListQuerySchema }),
  teamsController.getTeams
);

router.get(
  '/:id',
  validate({ params: teamIdParamSchema }),
  teamsController.getTeamById
);

router.patch(
  '/:id',
  requireAdmin,
  validate({ params: teamIdParamSchema, body: updateTeamSchema }),
  teamsController.updateTeam
);

router.delete(
  '/:id',
  requireAdmin,
  validate({ params: teamIdParamSchema }),
  teamsController.deleteTeam
);

/**
 * Team member routes
 */
router.get(
  '/:id/members',
  validate({ params: teamIdParamSchema }),
  teamsController.getTeamMembers
);

router.post(
  '/:id/members',
  requireAdmin,
  validate({ params: teamIdParamSchema, body: addTeamMemberSchema }),
  teamsController.addTeamMember
);

router.delete(
  '/:id/members/:userId',
  requireAdmin,
  teamsController.removeTeamMember
);

export default router;