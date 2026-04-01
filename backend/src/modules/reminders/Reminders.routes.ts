import { Router } from 'express';
import * as remindersController from './reminders.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { ROLES } from '../../config/constants';
import {
  createReminderSchema,
  updateReminderSchema,
  reminderIdParamSchema,
  reminderListQuerySchema,
  snoozeReminderSchema,
  completeReminderSchema,
} from './reminders.validation';

const router = Router();
router.use(authenticate);

// Special routes first (before /:id)
router.get('/summary', remindersController.getSummary);
router.get(
  '/overdue',
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MARKETING_MANAGER, ROLES.AGENT_SUPERVISOR),
  remindersController.getOverdueReminders
);

// CRUD
router.post('/', validate({ body: createReminderSchema }), remindersController.createReminder);
router.get('/', validate({ query: reminderListQuerySchema }), remindersController.getReminders);
router.get('/:id', validate({ params: reminderIdParamSchema }), remindersController.getReminderById);
router.patch('/:id', validate({ params: reminderIdParamSchema, body: updateReminderSchema }), remindersController.updateReminder);
router.delete('/:id', validate({ params: reminderIdParamSchema }), remindersController.deleteReminder);

// Actions
router.post('/:id/snooze', validate({ params: reminderIdParamSchema, body: snoozeReminderSchema }), remindersController.snoozeReminder);
router.post('/:id/complete', validate({ params: reminderIdParamSchema, body: completeReminderSchema }), remindersController.completeReminder);
router.post('/:id/cancel', validate({ params: reminderIdParamSchema }), remindersController.cancelReminder);

export default router;