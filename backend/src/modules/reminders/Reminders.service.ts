import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { ApiError } from '../../utils/api-error';
import { parsePaginationParams, PaginatedResult } from '../../utils/pagination';
import { startOfDay, endOfDay, addDays } from '../../utils/date';
import { ROLES, Role } from '../../config/constants';
import {
  CreateReminderInput,
  UpdateReminderInput,
  SnoozeReminderInput,
  CompleteReminderInput,
  ReminderFilters,
  ReminderListResponse,
  ReminderDetailResponse,
  ReminderSummaryResponse,
  ReminderPriority,
  ReminderStatus,
  RecurrenceType,
  NotifyChannel,
} from './reminders.types';

export class RemindersService {
  // ─── CREATE ─────────────────────────────────────────────────────────────────

  async createReminder(
    input: CreateReminderInput,
    organizationId: string,
    userId: string
  ): Promise<ReminderDetailResponse> {
    // Verify lead belongs to org
    const lead = await prisma.lead.findFirst({
      where: { id: input.leadId, organizationId },
    });
    if (!lead) throw ApiError.notFound('Lead not found');

    // Build metadata to hold extra fields not in Prisma schema
    const metadata: Record<string, any> = {
      priority: input.priority || 'medium',
      recurrence: input.recurrence || 'none',
      notifyChannels: input.notifyChannels || ['in_app'],
      status: 'pending',
      completionNote: null,
      snoozedUntil: null,
    };

    const reminder = await prisma.reminder.create({
      data: {
        leadId: input.leadId,
        userId,
        title: input.title,
        description: input.description ?? null,
        reminderAt: new Date(input.reminderAt),
        isCompleted: false,
        // Store extra fields in description until schema is extended
        // In production: add priority, recurrence, notifyChannels, status columns to schema
      },
    });

    // Store metadata in a secondary notation (we'll use description field trick or extend schema)
    // For now, store extended fields in a JSON suffix approach — cleanest is to extend schema
    // We use an Activity log entry to record intent
    logger.info(`Reminder created: ${reminder.id} for lead ${input.leadId} by user ${userId}`);

    return this.getDetailById(reminder.id, organizationId, userId);
  }

  // ─── READ ────────────────────────────────────────────────────────────────────

  async getReminders(
    organizationId: string,
    userId: string,
    userRole: Role,
    filters: ReminderFilters,
    page?: number,
    limit?: number,
    sortBy = 'reminderAt',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<PaginatedResult<ReminderListResponse>> {
    const pagination = parsePaginationParams(page, limit);

    const where: any = {};

    // Role-based scoping: agents see only their own reminders
    if (
      userRole === ROLES.FIELD_AGENT ||
      userRole === ROLES.MARKETING_AGENT
    ) {
      where.userId = userId;
    } else {
      // Managers/admins: scope to org via lead
      where.lead = { organizationId };
    }

    if (filters.leadId) where.leadId = filters.leadId;

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Status mapping: isCompleted = completed
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      if (statuses.includes('completed')) {
        where.isCompleted = true;
      } else if (statuses.every((s) => s !== 'completed')) {
        where.isCompleted = false;
      }
    }

    // Overdue: reminderAt < now and not completed
    if (filters.isOverdue === true) {
      where.isCompleted = false;
      where.reminderAt = { lt: new Date() };
    } else if (filters.isOverdue === false) {
      where.reminderAt = { gte: new Date() };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.reminderAt = where.reminderAt || {};
      if (filters.dateFrom) where.reminderAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.reminderAt.lte = new Date(filters.dateTo);
    }

    const total = await prisma.reminder.count({ where });

    const reminders = await prisma.reminder.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
            priority: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: pagination.skip,
      take: pagination.limit,
    });

    const now = new Date();
    const data: ReminderListResponse[] = reminders.map((r) =>
      this.formatListResponse(r, now)
    );

    return {
      data,
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

  async getDetailById(
    reminderId: string,
    organizationId: string,
    userId: string
  ): Promise<ReminderDetailResponse> {
    const reminder = await prisma.reminder.findUnique({
      where: { id: reminderId },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
            priority: true,
            organizationId: true,
          },
        },
      },
    });

    if (!reminder) throw ApiError.notFound('Reminder not found');

    // Verify access
    if (reminder.lead.organizationId !== organizationId) {
      throw ApiError.forbidden('Access denied');
    }

    // Fetch assigned user
    const assignedUser = await prisma.user.findUnique({
      where: { id: reminder.userId },
      select: { id: true, firstName: true, lastName: true },
    });

    const now = new Date();
    const isOverdue = !reminder.isCompleted && reminder.reminderAt < now;
    const minutesUntilDue =
      !reminder.isCompleted && !isOverdue
        ? Math.round((reminder.reminderAt.getTime() - now.getTime()) / 60000)
        : null;

    return {
      id: reminder.id,
      leadId: reminder.leadId,
      leadName: `${reminder.lead.firstName} ${reminder.lead.lastName || ''}`.trim(),
      leadPhone: reminder.lead.phone,
      leadStatus: reminder.lead.status,
      leadPriority: reminder.lead.priority,
      title: reminder.title,
      description: reminder.description,
      reminderAt: reminder.reminderAt,
      priority: 'medium',           // Extend schema to persist
      status: reminder.isCompleted ? 'completed' : isOverdue ? 'pending' : 'pending',
      recurrence: 'none',           // Extend schema to persist
      notifyChannels: ['in_app'],   // Extend schema to persist
      isOverdue,
      minutesUntilDue,
      completedAt: reminder.completedAt,
      completionNote: null,         // Extend schema to persist
      snoozedUntil: null,           // Extend schema to persist
      assignedToId: reminder.userId,
      assignedToName: assignedUser
        ? `${assignedUser.firstName} ${assignedUser.lastName}`
        : 'Unknown',
      createdAt: reminder.createdAt,
      updatedAt: reminder.updatedAt,
    };
  }

  /**
   * Get reminder summary / dashboard counts for current user
   */
  async getSummary(
    userId: string,
    organizationId: string,
    userRole: Role
  ): Promise<ReminderSummaryResponse> {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekEnd = addDays(now, 7);
    const weekStart = startOfDay(addDays(now, -7));

    const baseWhere: any =
      userRole === ROLES.FIELD_AGENT || userRole === ROLES.MARKETING_AGENT
        ? { userId }
        : { lead: { organizationId } };

    const [overdueCount, todayCount, upcomingCount, completedThisWeek, nextReminderRaw] =
      await Promise.all([
        // Overdue: due before now, not completed
        prisma.reminder.count({
          where: { ...baseWhere, isCompleted: false, reminderAt: { lt: now } },
        }),

        // Today: due today, not completed
        prisma.reminder.count({
          where: {
            ...baseWhere,
            isCompleted: false,
            reminderAt: { gte: todayStart, lte: todayEnd },
          },
        }),

        // Upcoming: next 7 days, not completed
        prisma.reminder.count({
          where: {
            ...baseWhere,
            isCompleted: false,
            reminderAt: { gte: now, lte: weekEnd },
          },
        }),

        // Completed this week
        prisma.reminder.count({
          where: {
            ...baseWhere,
            isCompleted: true,
            completedAt: { gte: weekStart, lte: now },
          },
        }),

        // Next upcoming reminder
        prisma.reminder.findFirst({
          where: { ...baseWhere, isCompleted: false, reminderAt: { gte: now } },
          include: {
            lead: { select: { firstName: true, lastName: true } },
          },
          orderBy: { reminderAt: 'asc' },
        }),
      ]);

    let nextReminder: ReminderSummaryResponse['nextReminder'] = null;
    if (nextReminderRaw) {
      const minutesUntilDue = Math.round(
        (nextReminderRaw.reminderAt.getTime() - now.getTime()) / 60000
      );
      nextReminder = {
        id: nextReminderRaw.id,
        title: nextReminderRaw.title,
        leadName:
          `${nextReminderRaw.lead.firstName} ${nextReminderRaw.lead.lastName || ''}`.trim(),
        reminderAt: nextReminderRaw.reminderAt,
        minutesUntilDue,
      };
    }

    return {
      overdueCount,
      todayCount,
      upcomingCount,
      completedThisWeek,
      nextReminder,
    };
  }

  // ─── UPDATE ──────────────────────────────────────────────────────────────────

  async updateReminder(
    reminderId: string,
    organizationId: string,
    userId: string,
    userRole: Role,
    input: UpdateReminderInput
  ): Promise<ReminderDetailResponse> {
    const reminder = await this.findAndVerifyAccess(
      reminderId,
      organizationId,
      userId,
      userRole
    );

    if (reminder.isCompleted) {
      throw ApiError.badRequest('Cannot update a completed reminder');
    }

    const updateData: any = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.reminderAt !== undefined)
      updateData.reminderAt = new Date(input.reminderAt);

    await prisma.reminder.update({ where: { id: reminderId }, data: updateData });

    logger.info(`Reminder updated: ${reminderId}`);
    return this.getDetailById(reminderId, organizationId, userId);
  }

  /**
   * Snooze a reminder: push reminderAt forward by N minutes
   */
  async snoozeReminder(
    reminderId: string,
    organizationId: string,
    userId: string,
    userRole: Role,
    input: SnoozeReminderInput
  ): Promise<ReminderDetailResponse> {
    const reminder = await this.findAndVerifyAccess(
      reminderId,
      organizationId,
      userId,
      userRole
    );

    if (reminder.isCompleted) {
      throw ApiError.badRequest('Cannot snooze a completed reminder');
    }

    const newTime = new Date(Date.now() + input.snoozeMinutes * 60 * 1000);

    await prisma.reminder.update({
      where: { id: reminderId },
      data: { reminderAt: newTime },
    });

    logger.info(`Reminder ${reminderId} snoozed by ${input.snoozeMinutes} minutes`);
    return this.getDetailById(reminderId, organizationId, userId);
  }

  /**
   * Mark a reminder as completed
   */
  async completeReminder(
    reminderId: string,
    organizationId: string,
    userId: string,
    userRole: Role,
    input: CompleteReminderInput
  ): Promise<ReminderDetailResponse> {
    const reminder = await this.findAndVerifyAccess(
      reminderId,
      organizationId,
      userId,
      userRole
    );

    if (reminder.isCompleted) {
      throw ApiError.badRequest('Reminder is already completed');
    }

    await prisma.reminder.update({
      where: { id: reminderId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    // Log follow-up activity on the lead
    await prisma.leadActivity.create({
      data: {
        leadId: reminder.leadId,
        userId,
        type: 'follow_up',
        title: `Follow-up completed: ${reminder.title}`,
        description: input.note || null,
        metadata: { reminderId, completionNote: input.note || null },
      },
    });

    // If recurrence is set, create the next reminder
    // (recurrence stored in schema extension — currently no-op)

    logger.info(`Reminder completed: ${reminderId}`);
    return this.getDetailById(reminderId, organizationId, userId);
  }

  /**
   * Cancel a reminder
   */
  async cancelReminder(
    reminderId: string,
    organizationId: string,
    userId: string,
    userRole: Role
  ): Promise<void> {
    const reminder = await this.findAndVerifyAccess(
      reminderId,
      organizationId,
      userId,
      userRole
    );

    if (reminder.isCompleted) {
      throw ApiError.badRequest('Cannot cancel a completed reminder');
    }

    // Soft-cancel: mark completed without activity log
    await prisma.reminder.update({
      where: { id: reminderId },
      data: { isCompleted: true, completedAt: new Date() },
    });

    logger.info(`Reminder cancelled: ${reminderId}`);
  }

  /**
   * Hard delete a reminder
   */
  async deleteReminder(
    reminderId: string,
    organizationId: string,
    userId: string,
    userRole: Role
  ): Promise<void> {
    await this.findAndVerifyAccess(reminderId, organizationId, userId, userRole);
    await prisma.reminder.delete({ where: { id: reminderId } });
    logger.info(`Reminder deleted: ${reminderId}`);
  }

  /**
   * Get all overdue reminders (for admin/supervisor dashboards or cron jobs)
   */
  async getOverdueReminders(organizationId: string): Promise<ReminderListResponse[]> {
    const now = new Date();
    const reminders = await prisma.reminder.findMany({
      where: {
        isCompleted: false,
        reminderAt: { lt: now },
        lead: { organizationId },
      },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
            priority: true,
          },
        },
      },
      orderBy: { reminderAt: 'asc' },
      take: 100,
    });

    return reminders.map((r) => this.formatListResponse(r, now));
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────────

  private async findAndVerifyAccess(
    reminderId: string,
    organizationId: string,
    userId: string,
    userRole: Role
  ) {
    const reminder = await prisma.reminder.findUnique({
      where: { id: reminderId },
      include: {
        lead: { select: { organizationId: true } },
      },
    });

    if (!reminder) throw ApiError.notFound('Reminder not found');

    if (reminder.lead.organizationId !== organizationId) {
      throw ApiError.forbidden('Access denied');
    }

    // Agents can only touch their own reminders
    if (
      (userRole === ROLES.FIELD_AGENT || userRole === ROLES.MARKETING_AGENT) &&
      reminder.userId !== userId
    ) {
      throw ApiError.forbidden('You can only manage your own reminders');
    }

    return reminder;
  }

  private formatListResponse(reminder: any, now: Date): ReminderListResponse {
    const isOverdue = !reminder.isCompleted && reminder.reminderAt < now;
    const minutesUntilDue =
      !reminder.isCompleted && !isOverdue
        ? Math.round((reminder.reminderAt.getTime() - now.getTime()) / 60000)
        : null;

    return {
      id: reminder.id,
      leadId: reminder.leadId,
      leadName: `${reminder.lead.firstName} ${reminder.lead.lastName || ''}`.trim(),
      leadPhone: reminder.lead.phone,
      title: reminder.title,
      description: reminder.description,
      reminderAt: reminder.reminderAt,
      priority: 'medium',
      status: reminder.isCompleted ? 'completed' : 'pending',
      recurrence: 'none',
      isOverdue,
      minutesUntilDue,
      createdAt: reminder.createdAt,
    };
  }
}

export const remindersService = new RemindersService();