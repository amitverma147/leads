// User Roles
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MARKETING_MANAGER: 'marketing_manager',
  MARKETING_AGENT: 'marketing_agent',
  AGENT_SUPERVISOR: 'agent_supervisor',
  FIELD_AGENT: 'field_agent',
} as const;

// Lead Status
export const LEAD_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  NEGOTIATION: 'negotiation',
  CONVERTED: 'converted',
  LOST: 'lost',
  INVALID: 'invalid',
  JUNK: 'junk',
} as const;

// Lead Source
export const LEAD_SOURCE = {
  FIELD_COLLECTION: 'field_collection',
  WEBSITE: 'website',
  REFERRAL: 'referral',
  SOCIAL_MEDIA: 'social_media',
  IMPORT: 'import',
  API: 'api',
} as const;

// Lead Priority
export const LEAD_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

// Activity Types
export const ACTIVITY_TYPE = {
  CALL: 'call',
  EMAIL: 'email',
  SMS: 'sms',
  WHATSAPP: 'whatsapp',
  MEETING: 'meeting',
  NOTE: 'note',
  STATUS_CHANGE: 'status_change',
  ASSIGNMENT: 'assignment',
} as const;

// Form Field Types
export const FIELD_TYPES = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  NUMBER: 'number',
  EMAIL: 'email',
  PHONE: 'phone',
  DROPDOWN: 'dropdown',
  RADIO: 'radio',
  CHECKBOX: 'checkbox',
  TOGGLE: 'toggle',
  DATE: 'date',
  TIME: 'time',
  DATETIME: 'datetime',
  RATING: 'rating',
  SLIDER: 'slider',
  SIGNATURE: 'signature',
  FILE_UPLOAD: 'file_upload',
  IMAGE_UPLOAD: 'image_upload',
  CAMERA: 'camera',
  LOCATION: 'location',
  ADDRESS: 'address',
  SECTION: 'section',
  DIVIDER: 'divider',
  HEADING: 'heading',
  PARAGRAPH: 'paragraph',
} as const;

// Notification Types
export const NOTIFICATION_TYPE = {
  LEAD_ASSIGNED: 'lead_assigned',
  LEAD_STATUS_CHANGED: 'lead_status_changed',
  FOLLOW_UP_REMINDER: 'follow_up_reminder',
  NEW_LEAD: 'new_lead',
  TEAM_INVITE: 'team_invite',
  SYSTEM_ALERT: 'system_alert',
} as const;

// Invoice Status
export const INVOICE_STATUS = {
  DRAFT: 'draft',
  ISSUED: 'issued',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
  VOID: 'void',
} as const;

// Invoice Template Field Roles (semantic mapping)
export const INVOICE_FIELD_ROLE = {
  CUSTOMER_NAME: 'customer_name',
  CUSTOMER_EMAIL: 'customer_email',
  CUSTOMER_PHONE: 'customer_phone',
  CUSTOMER_ADDRESS: 'customer_address',
  CUSTOMER_CITY: 'customer_city',
  CUSTOMER_STATE: 'customer_state',
  CUSTOMER_PINCODE: 'customer_pincode',
  LINE_ITEM_DESCRIPTION: 'line_item_description',
  LINE_ITEM_QUANTITY: 'line_item_quantity',
  LINE_ITEM_UNIT_PRICE: 'line_item_unit_price',
  NOTES: 'notes',
  CUSTOM: 'custom',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Type exports
export type Role = (typeof ROLES)[keyof typeof ROLES];
export type LeadStatus = (typeof LEAD_STATUS)[keyof typeof LEAD_STATUS];
export type LeadSource = (typeof LEAD_SOURCE)[keyof typeof LEAD_SOURCE];
export type LeadPriority = (typeof LEAD_PRIORITY)[keyof typeof LEAD_PRIORITY];
export type ActivityType = (typeof ACTIVITY_TYPE)[keyof typeof ACTIVITY_TYPE];
export type FieldType = (typeof FIELD_TYPES)[keyof typeof FIELD_TYPES];
export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];
export type InvoiceStatus = (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS];
export type InvoiceFieldRole = (typeof INVOICE_FIELD_ROLE)[keyof typeof INVOICE_FIELD_ROLE];