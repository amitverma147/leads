import { Router } from 'express';
import * as templatesController from './templates.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin, requireRole } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { ROLES } from '../../config/constants';
import {
  createTemplateSchema,
  updateTemplateSchema,
  templateIdParamSchema,
  templateListQuerySchema,
  previewTemplateSchema,
  sendTemplateSchema,
  bulkSendTemplateSchema,
} from './templates.validation';

const router = Router();

router.use(authenticate);

const canManage = requireRole(
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.MARKETING_MANAGER
);

const canSend = requireRole(
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.MARKETING_MANAGER,
  ROLES.MARKETING_AGENT
);

// ─── CRUD ─────────────────────────────────────────────────────────────────────
router.post('/', canManage, validate({ body: createTemplateSchema }), templatesController.createTemplate);
router.get('/', validate({ query: templateListQuerySchema }), templatesController.getTemplates);
router.get('/:id', validate({ params: templateIdParamSchema }), templatesController.getTemplateById);
router.patch('/:id', canManage, validate({ params: templateIdParamSchema, body: updateTemplateSchema }), templatesController.updateTemplate);
router.delete('/:id', requireAdmin, validate({ params: templateIdParamSchema }), templatesController.deleteTemplate);
router.post('/:id/duplicate', canManage, validate({ params: templateIdParamSchema }), templatesController.duplicateTemplate);

// ─── Preview ──────────────────────────────────────────────────────────────────
router.post('/preview', validate({ body: previewTemplateSchema }), templatesController.previewTemplate);
router.post('/preview/lead/:leadId', templatesController.previewWithLead);

// ─── Send ─────────────────────────────────────────────────────────────────────
router.post('/send', canSend, validate({ body: sendTemplateSchema }), templatesController.sendTemplate);
router.post('/send/bulk', canSend, validate({ body: bulkSendTemplateSchema }), templatesController.bulkSendTemplate);

export default router;