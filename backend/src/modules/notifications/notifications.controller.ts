import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { ApiResponse } from '../../utils/api-response';
import { notificationsService } from './notifications.service';
import { NotificationType } from '../../config/constants';

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of notifications
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getNotifications = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const { page, limit, isRead, type } = req.query;

    const result = await notificationsService.getUserNotifications(
      userId,
      {
        isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
        type: type as NotificationType,
      },
      parseInt(page as string) || undefined,
      parseInt(limit as string) || undefined
    );

    return ApiResponse.paginated(
      res,
      result.data,
      result.meta.page,
      result.meta.limit,
      result.meta.total,
      'Notifications retrieved successfully'
    );
  }
);

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: Get unread notifications count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getUnreadCount = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;

    const result = await notificationsService.getUnreadCount(userId);

    return ApiResponse.success(res, result, 'Unread count retrieved successfully');
  }
);

/**
 * @swagger
 * /notifications/{id}/read:
 *   post:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const markAsRead = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const userId = req.user!.userId;

    const notification = await notificationsService.markAsRead(id, userId);

    return ApiResponse.success(res, notification, 'Notification marked as read');
  }
);

/**
 * @swagger
 * /notifications/read-all:
 *   post:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const markAllAsRead = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;

    const result = await notificationsService.markAllAsRead(userId);

    return ApiResponse.success(res, result, `${result.updated} notifications marked as read`);
  }
);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification deleted
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const deleteNotification = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const userId = req.user!.userId;

    await notificationsService.deleteNotification(id, userId);

    return ApiResponse.success(res, null, 'Notification deleted successfully');
  }
);

/**
 * @swagger
 * /notifications/delete-read:
 *   delete:
 *     summary: Delete all read notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Read notifications deleted
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const deleteReadNotifications = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;

    const result = await notificationsService.deleteReadNotifications(userId);

    return ApiResponse.success(res, result, `${result.deleted} notifications deleted`);
  }
);