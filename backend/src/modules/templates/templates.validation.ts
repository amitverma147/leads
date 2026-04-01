import { z } from 'zod';

// ─── Enum Values ──────────────────────────────────────────────────────────────

const channelValues = ['sms', 'email', 'whatsapp'] as const;

const categoryValues = [
  'lead_followup',
  'lead_introduction',
  'appointment_reminder',
  'status_update',
  'welcome',
  'promotional',
  'feedback',
  'general',
] as const;

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const templateAttachmentSchema = z.object({
  filename: z.string().min(1),
  url: z.string().url(),
  mimeType: z.string().min(1),
});

const whatsAppButtonSchema = z.object({
  type: z.enum(['url', 'phone', 'quick_reply']),
  text: z.string().max(25),
  value: z.string().max(300),
});

const templateSettingsSchema = z.object({
  // SMS
  unicode: z.boolean().optional(),
  senderId: z.string().max(20).optional(),

  // Email
  fromName: z.string().max(100).optional(),
  replyTo: z.string().email().optional(),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  trackOpens: z.boolean().optional(),
  trackClicks: z.boolean().optional(),
  attachments: z.array(templateAttachmentSchema).optional(),

  // WhatsApp
  whatsappTemplateId: z.string().optional(),
  headerType: z.enum(['text', 'image', 'document', 'video']).optional(),
  headerValue: z.string().optional(),
  footer: z.string().max(60).optional(),
  buttons: z.array(whatsAppButtonSchema).max(3).optional(),

  // General
  scheduledAt: z.string().datetime().optional(),
});

// ─── Variable extraction helper ───────────────────────────────────────────────
// Validates that variable names are safe (alphanumeric + underscore)
const variableNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

// ─── Primary Schemas ──────────────────────────────────────────────────────────

/**
 * Create template schema
 */
export const createTemplateSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
    channel: z.enum(channelValues, {
      errorMap: () => ({ message: 'Channel must be sms, email, or whatsapp' }),
    }),
    category: z.enum(categoryValues, {
      errorMap: () => ({ message: 'Invalid category' }),
    }),
    subject: z.string().min(2).max(200).trim().optional(),
    content: z
      .string()
      .min(5, 'Content must be at least 5 characters')
      .max(10000, 'Content must be less than 10,000 characters'),
    description: z.string().max(500).trim().optional(),
    variables: z
      .array(
        z
          .string()
          .regex(variableNameRegex, 'Variable names must be alphanumeric/underscore')
      )
      .optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
    settings: templateSettingsSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.channel === 'email' && !data.subject) {
        return false;
      }
      return true;
    },
    { message: 'Subject is required for email templates', path: ['subject'] }
  );

/**
 * Update template schema
 */
export const updateTemplateSchema = z
  .object({
    name: z.string().min(2).max(100).trim().optional(),
    channel: z.enum(channelValues).optional(),
    category: z.enum(categoryValues).optional(),
    subject: z.string().min(2).max(200).trim().optional().nullable(),
    content: z.string().min(5).max(10000).optional(),
    description: z.string().max(500).trim().optional().nullable(),
    variables: z
      .array(z.string().regex(variableNameRegex))
      .optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
    settings: templateSettingsSchema.optional(),
    isActive: z.boolean().optional(),
  });

/**
 * Template ID param schema
 */
export const templateIdParamSchema = z.object({
  id: z.string().uuid('Invalid template ID'),
});

/**
 * Template list query schema
 */
export const templateListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().transform(Number),
  limit: z.string().regex(/^\d+$/).optional().transform(Number),
  search: z.string().optional(),
  channel: z.enum(channelValues).optional(),
  category: z.enum(categoryValues).optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
  tags: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',') : undefined)),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'channel', 'category']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Preview template schema
 */
export const previewTemplateSchema = z.object({
  templateId: z.string().uuid('Invalid template ID'),
  sampleData: z.record(z.string()),
});

/**
 * Send template to single lead schema
 */
export const sendTemplateSchema = z.object({
  templateId: z.string().uuid('Invalid template ID'),
  leadId: z.string().uuid('Invalid lead ID'),
  overrideVariables: z.record(z.string()).optional(),
});

/**
 * Bulk send template schema
 */
export const bulkSendTemplateSchema = z.object({
  templateId: z.string().uuid('Invalid template ID'),
  leadIds: z
    .array(z.string().uuid())
    .min(1, 'At least one lead ID required')
    .max(200, 'Cannot bulk send to more than 200 leads at once'),
  overrideVariables: z.record(z.string()).optional(),
});

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type CreateTemplateSchemaType = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateSchemaType = z.infer<typeof updateTemplateSchema>;
export type TemplateIdParamSchemaType = z.infer<typeof templateIdParamSchema>;
export type TemplateListQuerySchemaType = z.infer<typeof templateListQuerySchema>;
export type PreviewTemplateSchemaType = z.infer<typeof previewTemplateSchema>;
export type SendTemplateSchemaType = z.infer<typeof sendTemplateSchema>;
export type BulkSendTemplateSchemaType = z.infer<typeof bulkSendTemplateSchema>;