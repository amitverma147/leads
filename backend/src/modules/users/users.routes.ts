import { Router } from 'express';
import * as usersController from './users.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
  userListQuerySchema,
} from './users.validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * User management routes (Admin only)
 */
router.post(
  '/',
  requireAdmin,
  validate({ body: createUserSchema }),
  usersController.createUser
);

router.get(
  '/',
  requireAdmin,
  validate({ query: userListQuerySchema }),
  usersController.getUsers
);

router.get(
  '/:id',
  requireAdmin,
  validate({ params: userIdParamSchema }),
  usersController.getUserById
);

router.patch(
  '/:id',
  requireAdmin,
  validate({ params: userIdParamSchema, body: updateUserSchema }),
  usersController.updateUser
);

router.delete(
  '/:id',
  requireAdmin,
  validate({ params: userIdParamSchema }),
  usersController.deleteUser
);

router.post(
  '/:id/activate',
  requireAdmin,
  validate({ params: userIdParamSchema }),
  usersController.activateUser
);

export default router;