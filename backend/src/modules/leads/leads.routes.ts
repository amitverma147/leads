import { Router } from 'express';
import * as leadsController from './leads.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole, requireMarketingTeam } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { ROLES } from '../../config/constants';
import {
  createLeadSchema,
  updateLeadSchema,
  leadIdParamSchema,
  leadListQuerySchema,
  addActivitySchema,
  bulkAssignSchema,
  bulkUpdateStatusSchema,
} from './leads.validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Lead CRUD routes
 */
router.post('/', validate({ body: createLeadSchema }), leadsController.createLead);

router.get('/', validate({ query: leadListQuerySchema }), leadsController.getLeads);

router.get(
  '/stats',
  requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MARKETING_MANAGER, ROLES.AGENT_SUPERVISOR),
  leadsController.getLeadStats
);

router.get('/:id', validate({ params: leadIdParamSchema }), leadsController.getLeadById);

router.patch(
  '/:id',
  validate({ params: leadIdParamSchema, body: updateLeadSchema }),
  leadsController.updateLead
);

router.delete(
  '/:id',
  requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  validate({ params: leadIdParamSchema }),
  leadsController.deleteLead
);

/**
 * Lead activity routes
 */
router.post(
  '/:id/activities',
  validate({ params: leadIdParamSchema, body: addActivitySchema }),
  leadsController.addActivity
);

router.get(
  '/:id/activities',
  validate({ params: leadIdParamSchema }),
  leadsController.getLeadActivities
);

/**
 * Bulk operations (Admin/Manager only)
 */
router.post(
  '/bulk/assign',
  requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MARKETING_MANAGER),
  validate({ body: bulkAssignSchema }),
  leadsController.bulkAssign
);

router.post(
  '/bulk/status',
  requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MARKETING_MANAGER),
  validate({ body: bulkUpdateStatusSchema }),
  leadsController.bulkUpdateStatus
);

export default router;