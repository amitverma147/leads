import { Router } from 'express';
import * as authController from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from './auth.validation';

const router = Router();

/**
 * Public routes
 */
router.post('/register', validateBody(registerSchema), authController.register);

router.post('/login', validateBody(loginSchema), authController.login);

router.post('/refresh', validateBody(refreshTokenSchema), authController.refreshToken);

/**
 * Protected routes
 */
router.post(
  '/logout',
  authenticate,
  validateBody(refreshTokenSchema),
  authController.logout
);

router.post('/logout-all', authenticate, authController.logoutAll);

router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  authController.changePassword
);

router.get('/me', authenticate, authController.getProfile);

export default router;