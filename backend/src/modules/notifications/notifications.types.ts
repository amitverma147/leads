import { NotificationType } from '../../config/constants';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export interface NotificationFilters {
  isRead?: boolean;
  type?: NotificationType;
}

export interface UnreadCountResponse {
  count: number;
}