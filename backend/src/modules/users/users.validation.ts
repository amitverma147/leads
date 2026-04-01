import { z } from 'zod';
import { ROLES } from '../../config/constants';

// Password validation regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

// Phone validation regex
const phoneRegex = /^[6-9]\d{9}$/;

// Role enum values
const roleValues = Object.values(ROLES) as [string, ...string[]];

/**
 * Create user validation schema
 */
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      passwordRegex,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50).trim(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50).trim(),
  phone: z.string().regex(phoneRegex, 'Invalid phone number').optional(),
  role: z.enum(roleValues, { errorMap: () => ({ message: 'Invalid role' }) }),
  teamId: z.string().uuid('Invalid team ID').optional(),
  reportingToId: z.string().uuid('Invalid reporting user ID').optional(),
});

/**
 * Update user validation schema
 */
export const updateUserSchema = z.object({
  firstName: z.string().min(2).max(50).trim().optional(),
  lastName: z.string().min(2).max(50).trim().optional(),
  phone: z.string().regex(phoneRegex, 'Invalid phone number').optional().nullable(),
  avatar: z.string().url('Invalid avatar URL').optional().nullable(),
  role: z.enum(roleValues).optional(),
  teamId: z.string().uuid().optional().nullable(),
  reportingToId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

/**
 * User ID param validation schema
 */
export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
});

/**
 * User list query validation schema
 */
export const userListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().transform(Number),
  limit: z.string().regex(/^\d+$/).optional().transform(Number),
  search: z.string().optional(),
  role: z.enum(roleValues).optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
  teamId: z.string().uuid().optional(),
  sortBy: z.enum(['createdAt', 'firstName', 'lastName', 'email', 'lastLoginAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Type exports
export type CreateUserSchemaType = z.infer<typeof createUserSchema>;
export type UpdateUserSchemaType = z.infer<typeof updateUserSchema>;
export type UserIdParamSchemaType = z.infer<typeof userIdParamSchema>;
export type UserListQuerySchemaType = z.infer<typeof userListQuerySchema>;