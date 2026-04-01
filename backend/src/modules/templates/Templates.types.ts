// ─── Enums ────────────────────────────────────────────────────────────────────

export type TemplateChannel = 'sms' | 'email' | 'whatsapp';

export type TemplateCategory =
  | 'lead_followup'
  | 'lead_introduction'
  | 'appointment_reminder'
  | 'status_update'
  | 'welcome'
  | 'promotional'
  | 'feedback'
  | 'general';

// ─── Input Types ──────────────────────────────────────────────────────────────

export interface CreateTemplateInput {
  name: string;
  channel: TemplateChannel;
  category: TemplateCategory;
  subject?: string;         // Required for email
  content: string;          // Body with {{variable}} placeholders
  description?: string;
  variables?: string[];     // Extracted from content e.g. ["firstName","phone"]
  tags?: string[];
  settings?: TemplateSettings;
}

export interface UpdateTemplateInput {
  name?: string;
  channel?: TemplateChannel;
  category?: TemplateCategory;
  subject?: string;
  content?: string;
  description?: string;
  variables?: string[];
  tags?: string[];
  settings?: TemplateSettings;
  isActive?: boolean;
}

export interface PreviewTemplateInput {
  templateId: string;
  sampleData: Record<string, string>;  // { firstName: "John", phone: "9876543210" }
}

export interface SendTemplateInput {
  templateId: string;
  leadId: string;
  overrideVariables?: Record<string, string>;  // Override auto-resolved variables
}

export interface BulkSendTemplateInput {
  templateId: string;
  leadIds: string[];
  overrideVariables?: Record<string, string>;
}

// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface TemplateSettings {
  // SMS specific
  unicode?: boolean;               // Allows special chars (doubles SMS count)
  senderId?: string;               // DLT sender ID

  // Email specific
  fromName?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  trackOpens?: boolean;
  trackClicks?: boolean;
  attachments?: TemplateAttachment[];

  // WhatsApp specific
  whatsappTemplateId?: string;     // Pre-approved WA template ID
  headerType?: 'text' | 'image' | 'document' | 'video';
  headerValue?: string;
  footer?: string;
  buttons?: WhatsAppButton[];

  // General
  scheduledAt?: string;            // ISO datetime for scheduled send
}

export interface TemplateAttachment {
  filename: string;
  url: string;
  mimeType: string;
}

export interface WhatsAppButton {
  type: 'url' | 'phone' | 'quick_reply';
  text: string;
  value: string;
}

// ─── Response Types ───────────────────────────────────────────────────────────

export interface TemplateListResponse {
  id: string;
  name: string;
  channel: TemplateChannel;
  category: TemplateCategory;
  subject: string | null;
  description: string | null;
  variables: string[];
  tags: string[];
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateDetailResponse extends TemplateListResponse {
  content: string;
  settings: TemplateSettings;
  organizationId: string;
  previewHtml?: string;
}

export interface TemplatePreviewResponse {
  channel: TemplateChannel;
  subject: string | null;
  rendered: string;        // Content with variables substituted
  charCount: number;
  smsSegments: number | null;
  missingVariables: string[];
}

export interface TemplateSendResult {
  success: boolean;
  leadId: string;
  leadName: string;
  recipient: string;       // Phone or email
  message?: string;        // Error message if failed
  sentAt: Date | null;
}

export interface BulkSendResult {
  total: number;
  sent: number;
  failed: number;
  results: TemplateSendResult[];
}

// ─── Filter Types ─────────────────────────────────────────────────────────────

export interface TemplateFilters {
  search?: string;
  channel?: TemplateChannel;
  category?: TemplateCategory;
  isActive?: boolean;
  tags?: string[];
}