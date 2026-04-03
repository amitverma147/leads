// ─── Controller ───────────────────────────────────────────────────────────────
import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { ApiResponse } from '../../utils/api-response';
import { remindersService } from './Reminders.service';
import { Role } from '../../config/constants';

/**
 * @swagger
 * /reminders:
 *   post:
 *     summary: Create a reminder for a lead
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [leadId, title, reminderAt]
 *             properties:
 *               leadId:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *                 example: "Call back regarding premium plan"
 *               description:
 *                 type: string
 *               reminderAt:
 *                 type: string
 *                 format: date-time
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               recurrence:
 *                 type: string
 *                 enum: [none, daily, weekly, monthly]
 *               notifyChannels:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [in_app, sms, email]
 *     responses:
 *       201:
 *         description: Reminder created
 */
export const createReminder = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;
    const userId = req.user!.userId;
    const reminder = await remindersService.createReminder(req.body, organizationId, userId);
    return ApiResponse.created(res, reminder, 'Reminder created successfully');
  }
);

/**
 * @swagger
 * /reminders:
 *   get:
 *     summary: List reminders (role-scoped)
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: leadId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *         description: "Comma-separated: pending,completed,snoozed,cancelled"
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high] }
 *       - in: query
 *         name: isOverdue
 *         schema: { type: boolean }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [reminderAt, createdAt, priority, title] }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: Paginated reminders
 */
export const getReminders = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;
    const userId = req.user!.userId;
    const userRole = req.user!.role as Role;
    const { page, limit, search, leadId, status, priority, isOverdue, dateFrom, dateTo, sortBy, sortOrder } =
      req.query;

    const result = await remindersService.getReminders(
      organizationId,
      userId,
      userRole,
      {
        search: search as string,
        leadId: leadId as string,
        status: status as any,
        priority: priority as any,
        isOverdue: isOverdue as boolean | undefined,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      },
      page as unknown as number,
      limit as unknown as number,
      sortBy as string,
      sortOrder as 'asc' | 'desc'
    );

    return ApiResponse.paginated(res, result.data, result.meta.page, result.meta.limit, result.meta.total, 'Reminders retrieved successfully');
  }
);

/**
 * @swagger
 * /reminders/summary:
 *   get:
 *     summary: Get reminder dashboard summary counts
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary with overdue/today/upcoming counts and next reminder
 */
export const getSummary = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;
    const userId = req.user!.userId;
    const userRole = req.user!.role as Role;
    const summary = await remindersService.getSummary(userId, organizationId, userRole);
    return ApiResponse.success(res, summary, 'Reminder summary retrieved');
  }
);

/**
 * @swagger
 * /reminders/overdue:
 *   get:
 *     summary: Get all overdue reminders (admin/manager only)
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of overdue reminders
 */
export const getOverdueReminders = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;
    const reminders = await remindersService.getOverdueReminders(organizationId);
    return ApiResponse.success(res, reminders, 'Overdue reminders retrieved');
  }
);

/**
 * @swagger
 * /reminders/{id}:
 *   get:
 *     summary: Get reminder detail
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Reminder detail
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const getReminderById = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const userId = req.user!.userId;
    const reminder = await remindersService.getDetailById(id, organizationId, userId);
    return ApiResponse.success(res, reminder, 'Reminder retrieved successfully');
  }
);

/**
 * @swagger
 * /reminders/{id}:
 *   patch:
 *     summary: Update reminder
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Reminder updated
 */
export const updateReminder = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const userId = req.user!.userId;
    const userRole = req.user!.role as Role;
    const reminder = await remindersService.updateReminder(id, organizationId, userId, userRole, req.body);
    return ApiResponse.success(res, reminder, 'Reminder updated successfully');
  }
);

/**
 * @swagger
 * /reminders/{id}/snooze:
 *   post:
 *     summary: Snooze a reminder
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [snoozeMinutes]
 *             properties:
 *               snoozeMinutes:
 *                 type: integer
 *                 enum: [15, 30, 60, 120, 1440]
 *                 description: "15=15min, 30=30min, 60=1hr, 120=2hr, 1440=1day"
 *     responses:
 *       200:
 *         description: Reminder snoozed
 */
export const snoozeReminder = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const userId = req.user!.userId;
    const userRole = req.user!.role as Role;
    const reminder = await remindersService.snoozeReminder(id, organizationId, userId, userRole, req.body);
    return ApiResponse.success(res, reminder, 'Reminder snoozed successfully');
  }
);

/**
 * @swagger
 * /reminders/{id}/complete:
 *   post:
 *     summary: Mark reminder as completed
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 description: What was done / outcome of the follow-up
 *     responses:
 *       200:
 *         description: Reminder completed and follow-up activity logged on lead
 */
export const completeReminder = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const userId = req.user!.userId;
    const userRole = req.user!.role as Role;
    const reminder = await remindersService.completeReminder(id, organizationId, userId, userRole, req.body);
    return ApiResponse.success(res, reminder, 'Reminder completed successfully');
  }
);

/**
 * @swagger
 * /reminders/{id}/cancel:
 *   post:
 *     summary: Cancel a reminder
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Reminder cancelled
 */
export const cancelReminder = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const userId = req.user!.userId;
    const userRole = req.user!.role as Role;
    await remindersService.cancelReminder(id, organizationId, userId, userRole);
    return ApiResponse.success(res, null, 'Reminder cancelled');
  }
);

/**
 * @swagger
 * /reminders/{id}:
 *   delete:
 *     summary: Delete a reminder permanently
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Reminder deleted
 */
export const deleteReminder = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const userId = req.user!.userId;
    const userRole = req.user!.role as Role;
    await remindersService.deleteReminder(id, organizationId, userId, userRole);
    return ApiResponse.success(res, null, 'Reminder deleted successfully');
  }
);