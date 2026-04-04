import { z } from 'zod';
import { LEAD_STATUS, LEAD_SOURCE, LEAD_PRIORITY, ACTIVITY_TYPE } from '../../config/constants';

// Phone validation regex
const phoneRegex = /^[6-9]\d{9}$/;

const normalizeIndianPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }

  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }

  return digits;
};

const normalizeLeadSource = (source?: string): string | undefined => {
  if (!source) return undefined;
  if (source === 'telecalling') return 'api';
  return source;
};

// Enum values
const leadStatusValues = Object.values(LEAD_STATUS) as [string, ...string[]];
const leadSourceValues = Object.values(LEAD_SOURCE) as [string, ...string[]];
const leadPriorityValues = Object.values(LEAD_PRIORITY) as [string, ...string[]];
const activityTypeValues = Object.values(ACTIVITY_TYPE) as [string, ...string[]];

/**
 * Create lead validation schema
 */
export const createLeadSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50).trim(),
  lastName: z.string().max(50).trim().optional(),
  email: z.string().email('Invalid email address').toLowerCase().trim().optional(),
  phone: z
    .string()
    .transform((value) => normalizeIndianPhone(value))
    .refine((value) => phoneRegex.test(value), { message: 'Invalid phone number' }),
  alternatePhone: z
    .string()
    .optional()
    .transform((value) => (value ? normalizeIndianPhone(value) : undefined))
    .refine((value) => !value || phoneRegex.test(value), { message: 'Invalid phone number' }),
  source: z
    .string()
    .optional()
    .transform((value) => normalizeLeadSource(value))
    .refine((value) => !value || leadSourceValues.includes(value), {
      message: `Invalid enum value. Expected ${leadSourceValues.map((v) => `'${v}'`).join(' | ')}`,
    }),
  priority: z.enum(leadPriorityValues).optional(),
  formId: z.string().uuid().optional(),
  formData: z.record(z.any()).optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode').optional(),
  assignedToId: z.string().uuid().optional(),
});

/**
 * Update lead validation schema
 */
export const updateLeadSchema = z.object({
  firstName: z.string().min(1).max(50).trim().optional(),
  lastName: z.string().max(50).trim().optional().nullable(),
  email: z.string().email().toLowerCase().trim().optional().nullable(),
  phone: z
    .string()
    .optional()
    .transform((value) => (value ? normalizeIndianPhone(value) : undefined))
    .refine((value) => !value || phoneRegex.test(value), { message: 'Invalid phone number' }),
  alternatePhone: z
    .string()
    .optional()
    .nullable()
    .transform((value) => (value ? normalizeIndianPhone(value) : value))
    .refine((value) => !value || phoneRegex.test(value), { message: 'Invalid phone number' }),
  status: z.enum(leadStatusValues).optional(),
  priority: z.enum(leadPriorityValues).optional(),
  formData: z.record(z.any()).optional(),
  notes: z.string().max(1000).optional().nullable(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  pincode: z.string().regex(/^\d{6}$/).optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
  followUpAt: z.string().datetime().optional().nullable(),
});

/**
 * Lead ID param validation schema
 */
export const leadIdParamSchema = z.object({
  id: z.string().uuid('Invalid lead ID'),
});

/**
 * Lead list query validation schema
 */
export const leadListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().transform(Number),
  limit: z.string().regex(/^\d+$/).optional().transform(Number),
  search: z.string().optional(),
  status: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',') : undefined)),
  source: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').map((item) => normalizeLeadSource(item) as string) : undefined)),
  priority: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',') : undefined)),
  assignedToId: z.string().uuid().optional(),
  createdById: z.string().uuid().optional(),
  formId: z.string().uuid().optional(),
  tags: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',') : undefined)),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  hasFollowUp: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'firstName', 'status', 'priority', 'score', 'followUpAt'])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Add activity validation schema
 */
export const addActivitySchema = z.object({
  type: z.enum(activityTypeValues),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Bulk assign validation schema
 */
export const bulkAssignSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1, 'At least one lead ID is required').max(100),
  assignedToId: z.string().uuid('Invalid user ID'),
});

/**
 * Bulk update status validation schema
 */
export const bulkUpdateStatusSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1, 'At least one lead ID is required').max(100),
  status: z.enum(leadStatusValues),
});

// Type exports
export type CreateLeadSchemaType = z.infer<typeof createLeadSchema>;
export type UpdateLeadSchemaType = z.infer<typeof updateLeadSchema>;
export type LeadIdParamSchemaType = z.infer<typeof leadIdParamSchema>;
export type LeadListQuerySchemaType = z.infer<typeof leadListQuerySchema>;
export type AddActivitySchemaType = z.infer<typeof addActivitySchema>;
export type BulkAssignSchemaType = z.infer<typeof bulkAssignSchema>;
export type BulkUpdateStatusSchemaType = z.infer<typeof bulkUpdateStatusSchema>;