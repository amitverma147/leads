import { z } from 'zod';

const dayScheduleSchema = z.object({
  enabled: z.boolean(),
  start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
});

const workingHoursSchema = z.object({
  monday: dayScheduleSchema.optional(),
  tuesday: dayScheduleSchema.optional(),
  wednesday: dayScheduleSchema.optional(),
  thursday: dayScheduleSchema.optional(),
  friday: dayScheduleSchema.optional(),
  saturday: dayScheduleSchema.optional(),
  sunday: dayScheduleSchema.optional(),
});

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  newLeadAlert: z.boolean().optional(),
  leadAssignmentAlert: z.boolean().optional(),
  dailyDigest: z.boolean().optional(),
});

const organizationSettingsSchema = z.object({
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  currency: z.string().max(3).optional(),
  language: z.string().max(5).optional(),
  leadAutoAssignment: z.boolean().optional(),
  leadDuplicateCheck: z.boolean().optional(),
  requireGeolocation: z.boolean().optional(),
  maxLeadsPerAgent: z.number().int().min(1).max(1000).optional(),
  workingHours: workingHoursSchema.optional(),
  notifications: notificationSettingsSchema.optional(),
});

/**
 * Update organization validation schema
 */
export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  logo: z.string().url().optional().nullable(),
  settings: organizationSettingsSchema.optional(),
});

// Type exports
export type UpdateOrganizationSchemaType = z.infer<typeof updateOrganizationSchema>;