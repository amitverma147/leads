import { z } from 'zod';
import { INVOICE_STATUS } from '../../config/constants';

const statusValues = Object.values(INVOICE_STATUS) as [string, ...string[]];

const customerInputSchema = z.object({
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().max(100).trim().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  leadId: z.string().uuid().optional(),
});

const lineItemSchema = z.object({
  description: z.string().min(1).max(500).trim(),
  hsnCode: z.string().max(40).trim().optional(),
  productId: z.string().uuid().optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  discountPct: z.number().min(0).max(100).optional(),
  taxRatePct: z.number().min(0).max(100).optional(),
  order: z.number().int().min(0).optional(),
  metadata: z.record(z.any()).optional(),
});

const dateStringSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date format');

export const createInvoiceSchema = z.object({
  templateId: z.string().uuid('Invalid template ID'),
  customer: customerInputSchema,
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  discount: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  currency: z.string().max(10).optional(),
  invoiceDate: dateStringSchema.optional(),
  dueDate: dateStringSchema.optional(),
  notes: z.string().max(2000).optional(),
  formData: z.record(z.any()).optional(),
  leadId: z.string().uuid().optional(),
});

export const updateInvoiceSchema = z.object({
  status: z.enum(statusValues).optional(),
  notes: z.string().max(2000).optional(),
  dueDate: dateStringSchema.optional().nullable(),
  paidAt: dateStringSchema.optional().nullable(),
});

export const invoiceIdParamSchema = z.object({
  id: z.string().uuid('Invalid invoice ID'),
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

export const invoiceListQuerySchema = z.object({
  page: numberQuery.default(1),
  limit: numberQuery.default(20),
  search: z.string().optional(),
  status: z.enum(statusValues).optional(),
  customerId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  createdById: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'invoiceDate', 'total', 'invoiceNumber']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const customerIdParamSchema = z.object({
  id: z.string().uuid('Invalid customer ID'),
});

export const customerListQuerySchema = z.object({
  page: numberQuery.default(1),
  limit: numberQuery.default(20),
  search: z.string().optional(),
  tags: z.string().optional(),   // comma-separated
  sortBy: z.enum(['createdAt', 'totalSpend', 'invoiceCount', 'lastInvoiceAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const createInvoiceProductSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  hsnCode: z.string().min(1).max(40).trim(),
  unitPrice: z.number().min(0),
  taxRatePct: z.number().min(0).max(100),
});

export const updateInvoiceProductSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  hsnCode: z.string().min(1).max(40).trim().optional(),
  unitPrice: z.number().min(0).optional(),
  taxRatePct: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

export const invoiceProductIdParamSchema = z.object({
  id: z.string().uuid('Invalid product ID'),
});

export const invoiceProductListQuerySchema = z.object({
  page: numberQuery.default(1),
  limit: numberQuery.default(200),
  search: z.string().optional(),
  isActive: booleanQuery,
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'hsnCode', 'unitPrice']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type CreateInvoiceSchemaType = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceSchemaType = z.infer<typeof updateInvoiceSchema>;
export type UpdateInvoiceProductSchemaType = z.infer<typeof updateInvoiceProductSchema>;
