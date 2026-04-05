import { z } from 'zod';
import { INVOICE_FIELD_ROLE, FIELD_TYPES } from '../../config/constants';

const fieldRoleValues = Object.values(INVOICE_FIELD_ROLE) as [string, ...string[]];
const fieldTypeValues = Object.values(FIELD_TYPES) as [string, ...string[]];

const templateFieldSchema = z.object({
  id: z.string().min(1).max(50),
  role: z.enum(fieldRoleValues),
  type: z.enum(fieldTypeValues),
  label: z.string().min(1).max(200),
  placeholder: z.string().max(200).optional(),
  helpText: z.string().max(500).optional(),
  defaultValue: z.any().optional(),
  options: z
    .array(z.object({ label: z.string().min(1).max(100), value: z.string().min(1).max(100) }))
    .optional(),
  required: z.boolean().optional(),
  isMarketingRelevant: z.boolean().optional(),
  isCustomerField: z.boolean().optional(),
  isPricingField: z.boolean().optional(),
  order: z.number().int().min(0),
  width: z.enum(['full', 'half', 'third']).optional(),
  properties: z.record(z.any()).optional(),
});

const templateSettingsSchema = z.object({
  currency: z.string().max(10).optional(),
  defaultTaxRate: z.number().min(0).max(100).optional(),
  discountEnabled: z.boolean().optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  companyName: z.string().max(200).optional(),
  companyAddress: z.string().max(500).optional(),
  termsAndConditions: z.string().max(2000).optional(),
  paymentInstructions: z.string().max(1000).optional(),
  lineItemsEnabled: z.boolean().optional(),
});

export const createInvoiceTemplateSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  description: z.string().max(500).trim().optional(),
  fields: z.array(templateFieldSchema).optional(),
  settings: templateSettingsSchema.optional(),
});

export const updateInvoiceTemplateSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  description: z.string().max(500).trim().optional().nullable(),
  fields: z.array(templateFieldSchema).optional(),
  settings: templateSettingsSchema.optional(),
  isActive: z.boolean().optional(),
});

export const templateIdParamSchema = z.object({
  id: z.string().uuid('Invalid template ID'),
});

const booleanQuery = z.preprocess((v) => {
  if (v === 'true') return true;
  if (v === 'false') return false;
  return undefined;
}, z.boolean().optional());

const numberQuery = z.preprocess((v) => {
  if (typeof v === 'string' && /^\d+$/.test(v)) return Number(v);
  return undefined;
}, z.number().optional());

export const templateListQuerySchema = z.object({
  page: numberQuery.default(1),
  limit: numberQuery.default(20),
  search: z.string().optional(),
  isActive: booleanQuery,
  sortBy: z.enum(['createdAt', 'updatedAt', 'name']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type CreateInvoiceTemplateSchemaType = z.infer<typeof createInvoiceTemplateSchema>;
export type UpdateInvoiceTemplateSchemaType = z.infer<typeof updateInvoiceTemplateSchema>;
