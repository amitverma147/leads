import { z } from 'zod';

const priorityValues = ['low', 'medium', 'high'] as const;
const statusValues = ['pending', 'completed', 'snoozed', 'cancelled'] as const;
const recurrenceValues = ['none', 'daily', 'weekly', 'monthly'] as const;
const notifyChannelValues = ['in_app', 'sms', 'email'] as const;

// Snooze options in minutes
const SNOOZE_OPTIONS = [15, 30, 60, 120, 1440] as const;

/**
 * Create reminder schema
 */
export const createReminderSchema = z.object({
  leadId: z.string().uuid('Invalid lead ID'),
  title: z.string().min(2, 'Title must be at least 2 characters').max(200).trim(),
  description: z.string().max(1000).trim().optional(),
  reminderAt: z
    .string()
    .datetime('Invalid date-time format')
    .refine(
      (val) => new Date(val) > new Date(),
      'Reminder time must be in the future'
    ),
  priority: z.enum(priorityValues).optional().default('medium'),
  recurrence: z.enum(recurrenceValues).optional().default('none'),
  notifyChannels: z
    .array(z.enum(notifyChannelValues))
    .min(1, 'At least one notification channel required')
    .optional()
    .default(['in_app']),
});

/**
 * Update reminder schema
 */
export const updateReminderSchema = z.object({
  title: z.string().min(2).max(200).trim().optional(),
  description: z.string().max(1000).trim().optional().nullable(),
  reminderAt: z
    .string()
    .datetime()
    .refine(
      (val) => new Date(val) > new Date(),
      'Reminder time must be in the future'
    )
    .optional(),
  priority: z.enum(priorityValues).optional(),
  recurrence: z.enum(recurrenceValues).optional(),
  notifyChannels: z.array(z.enum(notifyChannelValues)).min(1).optional(),
});

/**
 * Reminder ID param schema
 */
export const reminderIdParamSchema = z.object({
  id: z.string().uuid('Invalid reminder ID'),
});

/**
 * Reminder list query schema
 */
export const reminderListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().transform(Number),
  limit: z.string().regex(/^\d+$/).optional().transform(Number),
  search: z.string().optional(),
  leadId: z.string().uuid().optional(),
  status: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',') : undefined)),
  priority: z.enum(priorityValues).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  isOverdue: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
  sortBy: z.enum(['reminderAt', 'createdAt', 'priority', 'title']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Snooze reminder schema
 */
export const snoozeReminderSchema = z.object({
  snoozeMinutes: z
    .number()
    .int()
    .refine(
      (val) => (SNOOZE_OPTIONS as readonly number[]).includes(val),
      `Snooze must be one of: ${SNOOZE_OPTIONS.join(', ')} minutes`
    ),
});

/**
 * Complete reminder schema
 */
export const completeReminderSchema = z.object({
  note: z.string().max(500).optional(),
});

// Type exports
export type CreateReminderSchemaType = z.infer<typeof createReminderSchema>;
export type UpdateReminderSchemaType = z.infer<typeof updateReminderSchema>;
export type ReminderIdParamSchemaType = z.infer<typeof reminderIdParamSchema>;
export type ReminderListQuerySchemaType = z.infer<typeof reminderListQuerySchema>;
export type SnoozeReminderSchemaType = z.infer<typeof snoozeReminderSchema>;
export type CompleteReminderSchemaType = z.infer<typeof completeReminderSchema>;