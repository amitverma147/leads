import { InvoiceFieldRole } from '../../config/constants';

// ─── Template Field Definition ───────────────────────────────────────────────

export interface InvoiceTemplateFieldOption {
  label: string;
  value: string;
}

export interface InvoiceTemplateField {
  id: string;
  /** Semantic role — drives how data is extracted for customer profile / analytics */
  role: InvoiceFieldRole;
  /** The generic field type (text, number, date, dropdown, …) */
  type: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  defaultValue?: unknown;
  options?: InvoiceTemplateFieldOption[];
  required?: boolean;
  /** Flagged for marketing data extraction (email, phone, preferences, …) */
  isMarketingRelevant?: boolean;
  /** Is this part of the customer-info section? */
  isCustomerField?: boolean;
  /** Is this a pricing/financial field? */
  isPricingField?: boolean;
  order: number;
  width?: 'full' | 'half' | 'third';
  /** Arbitrary extra properties */
  properties?: Record<string, unknown>;
}

// ─── Template Settings ────────────────────────────────────────────────────────

export interface InvoiceTemplateSettings {
  currency?: string;           // default 'INR'
  defaultTaxRate?: number;     // percentage 0–100
  discountEnabled?: boolean;
  logoUrl?: string;
  companyName?: string;
  companyAddress?: string;
  termsAndConditions?: string;
  paymentInstructions?: string;
  /** Allow agents to add multiple line items */
  lineItemsEnabled?: boolean;
}

// ─── CRUD Inputs ─────────────────────────────────────────────────────────────

export interface CreateInvoiceTemplateInput {
  name: string;
  description?: string;
  fields?: InvoiceTemplateField[];
  settings?: InvoiceTemplateSettings;
}

export interface UpdateInvoiceTemplateInput {
  name?: string;
  description?: string;
  fields?: InvoiceTemplateField[];
  settings?: InvoiceTemplateSettings;
  isActive?: boolean;
}

// ─── Response Shapes ──────────────────────────────────────────────────────────

export interface InvoiceTemplateListResponse {
  id: string;
  name: string;
  description: string | null;
  fieldsCount: number;
  isActive: boolean;
  version: number;
  settings: InvoiceTemplateSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceTemplateDetailResponse extends InvoiceTemplateListResponse {
  fields: InvoiceTemplateField[];
  organizationId: string;
  createdById: string;
}
