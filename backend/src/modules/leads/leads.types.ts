import { LeadStatus, LeadSource, LeadPriority } from '../../config/constants';

export interface CreateLeadInput {
  firstName: string;
  lastName?: string;
  email?: string;
  phone: string;
  alternatePhone?: string;
  source?: LeadSource;
  priority?: LeadPriority;
  formId?: string;
  formData?: Record<string, any>;
  notes?: string;
  tags?: string[];
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  assignedToId?: string;
}

export interface UpdateLeadInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  status?: LeadStatus;
  priority?: LeadPriority;
  formData?: Record<string, any>;
  notes?: string;
  tags?: string[];
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  assignedToId?: string;
  followUpAt?: Date;
}

export interface LeadFilters {
  search?: string;
  status?: LeadStatus | LeadStatus[];
  source?: LeadSource | LeadSource[];
  priority?: LeadPriority | LeadPriority[];
  assignedToId?: string;
  createdById?: string;
  formId?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  hasFollowUp?: boolean;
}

export interface LeadListResponse {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string;
  status: LeadStatus;
  source: LeadSource;
  priority: LeadPriority;
  score: number;
  tags: string[];
  city: string | null;
  state: string | null;
  assignedToId: string | null;
  assignedToName: string | null;
  createdById: string;
  createdByName: string;
  followUpAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadDetailResponse extends LeadListResponse {
  alternatePhone: string | null;
  formId: string | null;
  formName: string | null;
  formData: Record<string, any>;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  pincode: string | null;
  locationData: Record<string, any> | null;
  deviceInfo: Record<string, any> | null;
  ipAddress: string | null;
  contactedAt: Date | null;
  convertedAt: Date | null;
  activitiesCount: number;
}

export interface AddActivityInput {
  type: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface LeadActivityResponse {
  id: string;
  type: string;
  title: string;
  description: string | null;
  metadata: Record<string, any>;
  userId: string;
  userName: string;
  createdAt: Date;
}

export interface LeadStatsResponse {
  total: number;
  byStatus: Record<LeadStatus, number>;
  bySource: Record<LeadSource, number>;
  byPriority: Record<LeadPriority, number>;
  todayCount: number;
  thisWeekCount: number;
  thisMonthCount: number;
}

export interface BulkAssignInput {
  leadIds: string[];
  assignedToId: string;
}

export interface BulkUpdateStatusInput {
  leadIds: string[];
  status: LeadStatus;
}