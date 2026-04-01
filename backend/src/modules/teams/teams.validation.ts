import { z } from 'zod';

/**
 * Create team validation schema
 */
export const createTeamSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  description: z.string().max(500).trim().optional(),
  type: z.enum(['marketing', 'field'], {
    errorMap: () => ({ message: 'Type must be either marketing or field' }),
  }),
  settings: z.record(z.any()).optional(),
});

/**
 * Update team validation schema
 */
export const updateTeamSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  description: z.string().max(500).trim().optional().nullable(),
  type: z.enum(['marketing', 'field']).optional(),
  settings: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Team ID param validation schema
 */
export const teamIdParamSchema = z.object({
  id: z.string().uuid('Invalid team ID'),
});

/**
 * Add team member validation schema
 */
export const addTeamMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

/**
 * Team list query validation schema
 */
export const teamListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().transform(Number),
  limit: z.string().regex(/^\d+$/).optional().transform(Number),
  search: z.string().optional(),
  type: z.enum(['marketing', 'field']).optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Type exports
export type CreateTeamSchemaType = z.infer<typeof createTeamSchema>;
export type UpdateTeamSchemaType = z.infer<typeof updateTeamSchema>;
export type TeamIdParamSchemaType = z.infer<typeof teamIdParamSchema>;
export type AddTeamMemberSchemaType = z.infer<typeof addTeamMemberSchema>;
export type TeamListQuerySchemaType = z.infer<typeof teamListQuerySchema>;