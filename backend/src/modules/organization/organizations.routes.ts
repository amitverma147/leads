import { Router } from 'express';
import * as organizationsController from './organizations.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { updateOrganizationSchema } from './organizations.validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/current', organizationsController.getCurrentOrganization);

router.patch(
  '/current',
  requireAdmin,
  validateBody(updateOrganizationSchema),
  organizationsController.updateCurrentOrganization
);

router.get('/current/stats', organizationsController.getOrganizationStats);

export default router;