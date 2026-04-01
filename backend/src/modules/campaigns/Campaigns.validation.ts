import { z } from 'zod';

// ─── Enum Values ──────────────────────────────────────────────────────────────

const campaignTypeValues = [
  'field_collection',
  'telecalling',
  'email',
  'sms',
  'whatsapp',
  'mixed',
] as const;

const campaignStatusValues = [
  'draft',
  'active',
  'paused',
  'completed',
  'cancelled',
] as const;

const autoAssignStrategyValues = ['round_robin', 'least_loaded', 'manual'] as const;

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const targetAudienceSchema = z.object({
  cities: z.array(z.string().max(100)).optional(),
  states: z.array(z.string().max(100)).optional(),
  pincodes: z.array(z.string().regex(/^\d{6}$/, 'Invalid pincode')).optional(),
  ageRange: z
    .object({
      min: z.number().int().min(0).max(120).optional(),
      max: z.number().int().min(0).max(120).optional(),
    })
    .optional(),
  incomeRange: z
    .object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional(),
    })
    .optional(),
  tags: z.array(z.string().max(50)).optional(),
  existingLeadStatuses: z.array(z.string()).optional(),
});

const campaignSettingsSchema = z.object({
  dailyLeadTarget: z.number().int().min(1).optional(),
  maxLeadsTotal: z.number().int().min(1).optional(),
  allowDuplicates: z.boolean().optional(),
  autoAssign: z.boolean().optional(),
  autoAssignStrategy: z.enum(autoAssignStrategyValues).optional(),
  workingHours: z
    .object({
      start: z
        .string()
        .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
      end: z
        .string()
        .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    })
    .optional(),
  notifyOnNewLead: z.boolean().optional(),
  requireGeolocation: z.boolean().optional(),
  formRequired: z.boolean().optional(),
  script: z.string().max(5000).optional(),
  incentive: z.string().max(500).optional(),
});

// ─── Primary Schemas ──────────────────────────────────────────────────────────

/**
 * Create campaign schema
 */
export const createCampaignSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
    description: z.string().max(500).trim().optional(),
    type: z.enum(campaignTypeValues, {
      errorMap: () => ({ message: 'Invalid campaign type' }),
    }),
    startDate: z.string().datetime('Invalid start date').optional(),
    endDate: z.string().datetime('Invalid end date').optional(),
    budget: z.number().min(0, 'Budget must be non-negative').optional(),
    formId: z.string().uuid('Invalid form ID').optional(),
    targetAudience: targetAudienceSchema.optional(),
    settings: campaignSettingsSchema.optional(),
    assignedTeamIds: z.array(z.string().uuid()).optional(),
    assignedUserIds: z.array(z.string().uuid()).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) < new Date(data.endDate);
      }
      return true;
    },
    { message: 'Start date must be before end date', path: ['endDate'] }
  );

/**
 * Update campaign schema
 */
export const updateCampaignSchema = z
  .object({
    name: z.string().min(2).max(100).trim().optional(),
    description: z.string().max(500).trim().optional().nullable(),
    type: z.enum(campaignTypeValues).optional(),
    status: z.enum(campaignStatusValues).optional(),
    startDate: z.string().datetime().optional().nullable(),
    endDate: z.string().datetime().optional().nullable(),
    budget: z.number().min(0).optional().nullable(),
    formId: z.string().uuid().optional().nullable(),
    targetAudience: targetAudienceSchema.optional().nullable(),
    settings: campaignSettingsSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) < new Date(data.endDate);
      }
      return true;
    },
    { message: 'Start date must be before end date', path: ['endDate'] }
  );

/**
 * Campaign ID param schema
 */
export const campaignIdParamSchema = z.object({
  id: z.string().uuid('Invalid campaign ID'),
});

/**
 * Campaign list query schema
 */
export const campaignListQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .transform(Number),
  limit: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .transform(Number),
  search: z.string().optional(),
  type: z.enum(campaignTypeValues).optional(),
  status: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',') : undefined)),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  formId: z.string().uuid().optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'name', 'startDate', 'endDate', 'status'])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Campaign leads query schema
 */
export const campaignLeadsQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .transform(Number),
  limit: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .transform(Number),
  search: z.string().optional(),
  status: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',') : undefined)),
  assignedToId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z
    .enum(['createdAt', 'firstName', 'status', 'priority', 'score'])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Add leads to campaign schema
 */
export const addLeadsSchema = z.object({
  leadIds: z
    .array(z.string().uuid('Invalid lead ID'))
    .min(1, 'At least one lead ID is required')
    .max(500, 'Cannot add more than 500 leads at once'),
});

/**
 * Remove leads from campaign schema
 */
export const removeLeadsSchema = z.object({
  leadIds: z
    .array(z.string().uuid('Invalid lead ID'))
    .min(1, 'At least one lead ID is required')
    .max(500),
});

/**
 * Assign teams schema
 */
export const assignTeamsSchema = z.object({
  teamIds: z
    .array(z.string().uuid('Invalid team ID'))
    .min(1, 'At least one team ID is required'),
});

/**
 * Assign users schema
 */
export const assignUsersSchema = z.object({
  userIds: z
    .array(z.string().uuid('Invalid user ID'))
    .min(1, 'At least one user ID is required'),
});

/**
 * Campaign status change schema
 */
export const changeCampaignStatusSchema = z.object({
  status: z.enum(campaignStatusValues, {
    errorMap: () => ({ message: 'Invalid campaign status' }),
  }),
  reason: z.string().max(500).optional(),
});

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type CreateCampaignSchemaType = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignSchemaType = z.infer<typeof updateCampaignSchema>;
export type CampaignIdParamSchemaType = z.infer<typeof campaignIdParamSchema>;
export type CampaignListQuerySchemaType = z.infer<typeof campaignListQuerySchema>;
export type CampaignLeadsQuerySchemaType = z.infer<typeof campaignLeadsQuerySchema>;
export type AddLeadsSchemaType = z.infer<typeof addLeadsSchema>;
export type RemoveLeadsSchemaType = z.infer<typeof removeLeadsSchema>;
export type AssignTeamsSchemaType = z.infer<typeof assignTeamsSchema>;
export type AssignUsersSchemaType = z.infer<typeof assignUsersSchema>;
export type ChangeCampaignStatusSchemaType = z.infer<typeof changeCampaignStatusSchema>;