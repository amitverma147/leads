import { z } from 'zod';

const targetTypeValues = [
  'leads_collected',
  'leads_converted',
  'calls_made',
  'revenue',
  'visits',
  'follow_ups',
] as const;

const targetPeriodValues = ['daily', 'weekly', 'monthly', 'quarterly'] as const;

/**
 * Create target validation schema
 */
export const createTargetSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  description: z.string().max(500).trim().optional(),
  type: z.enum(targetTypeValues, {
    errorMap: () => ({ message: 'Invalid target type' }),
  }),
  period: z.enum(targetPeriodValues, {
    errorMap: () => ({ message: 'Invalid target period' }),
  }),
  value: z.number().int().min(1, 'Target value must be at least 1'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

/**
 * Update target validation schema
 */
export const updateTargetSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  description: z.string().max(500).trim().optional().nullable(),
  value: z.number().int().min(1).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
});

/**
 * Assign target validation schema
 */
export const assignTargetSchema = z.object({
  targetId: z.string().uuid('Invalid target ID'),
  teamIds: z.array(z.string().uuid()).optional(),
  userIds: z.array(z.string().uuid()).optional(),
  customValue: z.number().int().min(1).optional(),
});

/**
 * Target ID param validation schema
 */
export const targetIdParamSchema = z.object({
  id: z.string().uuid('Invalid target ID'),
});

/**
 * Target list query validation schema
 */
export const targetListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().transform(Number),
  limit: z.string().regex(/^\d+$/).optional().transform(Number),
  search: z.string().optional(),
  type: z.enum(targetTypeValues).optional(),
  period: z.enum(targetPeriodValues).optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
  sortBy: z.enum(['createdAt', 'name', 'startDate', 'endDate']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Leaderboard query validation schema
 */
export const leaderboardQuerySchema = z.object({
  type: z.enum(targetTypeValues),
  period: z.enum(targetPeriodValues),
  teamId: z.string().uuid().optional(),
  limit: z.string().regex(/^\d+$/).optional().transform(Number),
});

// Type exports
export type CreateTargetSchemaType = z.infer<typeof createTargetSchema>;
export type UpdateTargetSchemaType = z.infer<typeof updateTargetSchema>;
export type AssignTargetSchemaType = z.infer<typeof assignTargetSchema>;
export type TargetIdParamSchemaType = z.infer<typeof targetIdParamSchema>;
export type TargetListQuerySchemaType = z.infer<typeof targetListQuerySchema>;
export type LeaderboardQuerySchemaType = z.infer<typeof leaderboardQuerySchema>;