import { Router } from 'express';
import * as formsController from './forms.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createFormSchema,
  updateFormSchema,
  formIdParamSchema,
  formListQuerySchema,
} from './forms.validation';

const router = Router();

/**
 * Public route - get published form
 */
router.get(
  '/public/:id',
  validate({ params: formIdParamSchema }),
  formsController.getPublishedForm
);

// Protected routes below
router.use(authenticate);

/**
 * Form CRUD routes (Admin only)
 */
router.post(
  '/',
  requireAdmin,
  validate({ body: createFormSchema }),
  formsController.createForm
);

router.get(
  '/',
  validate({ query: formListQuerySchema }),
  formsController.getForms
);

router.get(
  '/:id',
  validate({ params: formIdParamSchema }),
  formsController.getFormById
);

router.patch(
  '/:id',
  requireAdmin,
  validate({ params: formIdParamSchema, body: updateFormSchema }),
  formsController.updateForm
);

router.delete(
  '/:id',
  requireAdmin,
  validate({ params: formIdParamSchema }),
  formsController.deleteForm
);

/**
 * Form actions
 */
router.post(
  '/:id/duplicate',
  requireAdmin,
  validate({ params: formIdParamSchema }),
  formsController.duplicateForm
);

router.post(
  '/:id/toggle-publish',
  requireAdmin,
  validate({ params: formIdParamSchema }),
  formsController.togglePublish
);

export default router;