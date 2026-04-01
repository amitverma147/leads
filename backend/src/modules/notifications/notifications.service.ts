import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { NotificationType } from '../../config/constants';
import { ApiError } from '../../utils/api-error';
import { parsePaginationParams, PaginatedResult } from '../../utils/pagination';
import {
  CreateNotificationInput,
  NotificationResponse,
  NotificationFilters,
  UnreadCountResponse,
} from './notifications.types';

export class NotificationsService {
  /**
   * Create a notification
   */
  async createNotification(input: CreateNotificationInput): Promise<NotificationResponse> {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data || {},
      },
    });

    logger.debug(`Notification created for user: ${input.userId}`);

    return this.formatNotificationResponse(notification);
  }

  /**
   * Create notifications for multiple users
   */
  async createBulkNotifications(
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<number> {
    const result = await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type,
        title,
        message,
        data: data || {},
      })),
    });

    logger.debug(`Bulk notifications created for ${result.count} users`);

    return result.count;
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    filters: NotificationFilters,
    page?: number,
    limit?: number
  ): Promise<PaginatedResult<NotificationResponse>> {
    const pagination = parsePaginationParams(page, limit);

    const where: any = { userId };

    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    const total = await prisma.notification.count({ where });

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    const formattedNotifications = notifications.map((n) => this.formatNotificationResponse(n));

    return {
      data: formattedNotifications,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        hasNextPage: pagination.page < Math.ceil(total / pagination.limit),
        hasPrevPage: pagination.page > 1,
      },
    };
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId: string): Promise<UnreadCountResponse> {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { count };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<NotificationResponse> {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw ApiError.notFound('Notification not found');
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return this.formatNotificationResponse(updated);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { updated: result.count };
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw ApiError.notFound('Notification not found');
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Delete all read notifications
   */
  async deleteReadNotifications(userId: string): Promise<{ deleted: number }> {
    const result = await prisma.notification.deleteMany({
      where: {
        userId,
        isRead: true,
      },
    });

    return { deleted: result.count };
  }

  /**
   * Format notification response
   */
  private formatNotificationResponse(notification: any): NotificationResponse {
    return {
      id: notification.id,
      type: notification.type as NotificationType,
      title: notification.title,
      message: notification.message,
      data: notification.data as Record<string, any>,
      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
  }
}

export const notificationsService = new NotificationsService();