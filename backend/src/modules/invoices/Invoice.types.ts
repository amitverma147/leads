import { InvoiceStatus } from '../../config/constants';

// ─── Line Item ────────────────────────────────────────────────────────────────

export interface CreateLineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  discountPct?: number;   // 0–100
  taxRatePct?: number;    // 0–100
  order?: number;
  metadata?: Record<string, unknown>;
}

export interface LineItemResponse {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  taxRatePct: number;
  amount: number;
  order: number;
}

// ─── Customer Input ───────────────────────────────────────────────────────────

export interface InvoiceCustomerInput {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  leadId?: string;
}

// ─── Create / Update Invoice ─────────────────────────────────────────────────

export interface CreateInvoiceInput {
  templateId: string;
  customer: InvoiceCustomerInput;
  lineItems: CreateLineItemInput[];
  /** Global discount amount (absolute, not percentage) */
  discount?: number;
  /** Invoice-level tax rate override (overrides template default) */
  taxRate?: number;
  currency?: string;
  invoiceDate?: string;   // ISO date string
  dueDate?: string;
  notes?: string;
  /** Full form field data (field_id → value) for analytics / replay */
  formData?: Record<string, unknown>;
  leadId?: string;
}

export interface UpdateInvoiceInput {
  status?: InvoiceStatus;
  notes?: string;
  dueDate?: string;
  paidAt?: string;
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface InvoiceFilters {
  search?: string;
  status?: InvoiceStatus | InvoiceStatus[];
  customerId?: string;
  templateId?: string;
  createdById?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ─── Response Shapes ──────────────────────────────────────────────────────────

export interface InvoiceCustomerResponse {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  country: string | null;
  tags: string[];
  totalSpend: number;
  invoiceCount: number;
  lastInvoiceAt: Date | null;
}

export interface InvoiceListResponse {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  currency: string;
  invoiceDate: Date;
  dueDate: Date | null;
  createdById: string;
  createdByName: string;
  templateId: string;
  templateName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceDetailResponse extends InvoiceListResponse {
  lineItems: LineItemResponse[];
  customer: InvoiceCustomerResponse;
  customerSnapshot: Record<string, unknown>;
  formData: Record<string, unknown>;
  notes: string | null;
  paidAt: Date | null;
  leadId: string | null;
}

export interface InvoiceStatsResponse {
  total: number;
  byStatus: Record<InvoiceStatus, number>;
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  thisMonthCount: number;
  thisMonthRevenue: number;
}
