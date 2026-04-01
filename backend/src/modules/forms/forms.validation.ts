import { z } from 'zod';
import { FIELD_TYPES } from '../../config/constants.js';

const fieldTypeValues = Object.values(FIELD_TYPES) as [string, ...string[]];

/**
 * Form field option schema
 */
const formFieldOptionSchema = z.object({
  label: z.string().min(1).max(100),
  value: z.string().min(1).max(100),
});

/**
 * Form field validation schema
 */
const formFieldValidationSchema = z.object({
  required: z.boolean().optional(),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(1).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  message: z.string().max(200).optional(),
});

/**
 * Form field conditional schema
 */
const formFieldConditionalSchema = z.object({
  field: z.string(),
  operator: z.enum([
    'equals',
    'notEquals',
    'contains',
    'greaterThan',
    'lessThan',
    'isEmpty',
    'isNotEmpty',
  ]),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  action: z.enum(['show', 'hide', 'require']),
});

/**
 * Form field schema
 */
const formFieldSchema = z.object({
  id: z.string().min(1).max(50),
  type: z.enum(fieldTypeValues),
  label: z.string().min(1).max(200),
  placeholder: z.string().max(200).optional(),
  helpText: z.string().max(500).optional(),
  defaultValue: z.any().optional(),

  options: z.array(formFieldOptionSchema).optional(),

  validation: formFieldValidationSchema.optional(),
  conditional: formFieldConditionalSchema.optional(),

  order: z.number().int().min(0),

  width: z.enum(['full', 'half', 'third']).optional(),

  properties: z.record(z.any()).optional(),
});

/**
 * Create form validation schema
 */
export const createFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100)
    .trim(),

  description: z.string().max(500).trim().optional(),

  fields: z.array(formFieldSchema).optional(),

  settings: z.record(z.any()).optional(),
});

/**
 * Update form validation schema
 */
export const updateFormSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),

  description: z.string().max(500).trim().optional().nullable(),

  fields: z.array(formFieldSchema).optional(),

  settings: z.record(z.any()).optional(),

  isPublished: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

/**
 * Form ID param validation schema
 */
export const formIdParamSchema = z.object({
  id: z.string().uuid('Invalid form ID'),
});

/**
 * Helper for boolean query parsing
 */
const booleanQuery = z.preprocess((val) => {
  if (val === 'true') return true;
  if (val === 'false') return false;
  return undefined;
}, z.boolean().optional());

/**
 * Helper for number query parsing
 */
const numberQuery = z.preprocess((val) => {
  if (typeof val === 'string' && /^\d+$/.test(val)) return Number(val);
  return undefined;
}, z.number().optional());

/**
 * Form list query validation schema
 */
export const formListQuerySchema = z.object({
  page: numberQuery.default(1),
  limit: numberQuery.default(10),

  search: z.string().optional(),

  isPublished: booleanQuery,
  isActive: booleanQuery,

  sortBy: z.enum(['createdAt', 'updatedAt', 'name']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Type exports
 */
export type CreateFormSchemaType = z.infer<typeof createFormSchema>;
export type UpdateFormSchemaType = z.infer<typeof updateFormSchema>;
export type FormIdParamSchemaType = z.infer<typeof formIdParamSchema>;
export type FormListQuerySchemaType = z.infer<typeof formListQuerySchema>;