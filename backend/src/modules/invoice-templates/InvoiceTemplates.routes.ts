import { Router } from 'express';
import * as ctrl from './InvoiceTemplates.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createInvoiceTemplateSchema,
  updateInvoiceTemplateSchema,
  templateIdParamSchema,
  templateListQuerySchema,
} from './InvoiceTemplates.validation';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requireAdmin,
  validate({ body: createInvoiceTemplateSchema }),
  ctrl.createTemplate
);

router.get(
  '/',
  validate({ query: templateListQuerySchema }),
  ctrl.getTemplates
);

router.get(
  '/:id',
  validate({ params: templateIdParamSchema }),
  ctrl.getTemplateById
);

router.patch(
  '/:id',
  requireAdmin,
  validate({ params: templateIdParamSchema, body: updateInvoiceTemplateSchema }),
  ctrl.updateTemplate
);

router.delete(
  '/:id',
  requireAdmin,
  validate({ params: templateIdParamSchema }),
  ctrl.deleteTemplate
);

router.post(
  '/:id/duplicate',
  requireAdmin,
  validate({ params: templateIdParamSchema }),
  ctrl.duplicateTemplate
);

export default router;
