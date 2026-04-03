import { CampaignStatus } from '@prisma/client';

// ─── Input Types ──────────────────────────────────────────────────────────────

export interface CreateCampaignInput {
  name: string;
  description?: string;
  type: CampaignType;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  formId?: string;
  targetAudience?: TargetAudience;
  settings?: CampaignSettings;
  assignedTeamIds?: string[];
  assignedUserIds?: string[];
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  type?: CampaignType;
  status?: CampaignStatus;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  formId?: string;
  targetAudience?: TargetAudience;
  settings?: CampaignSettings;
}

export interface AddLeadsToCampaignInput {
  leadIds: string[];
}

export interface RemoveLeadsFromCampaignInput {
  leadIds: string[];
}

export interface AssignCampaignTeamsInput {
  teamIds: string[];
}

export interface AssignCampaignUsersInput {
  userIds: string[];
}

// ─── Domain Types ─────────────────────────────────────────────────────────────

export type CampaignType =
  | 'field_collection'
  | 'telecalling'
  | 'email'
  | 'sms'
  | 'whatsapp'
  | 'mixed';

export interface TargetAudience {
  cities?: string[];
  states?: string[];
  pincodes?: string[];
  ageRange?: { min?: number; max?: number };
  incomeRange?: { min?: number; max?: number };
  tags?: string[];
  existingLeadStatuses?: string[];
}

export interface CampaignSettings {
  dailyLeadTarget?: number;
  maxLeadsTotal?: number;
  allowDuplicates?: boolean;
  autoAssign?: boolean;
  autoAssignStrategy?: 'round_robin' | 'least_loaded' | 'manual';
  workingHours?: { start: string; end: string };
  notifyOnNewLead?: boolean;
  requireGeolocation?: boolean;
  formRequired?: boolean;
  script?: string;             // Calling script / pitch notes
  incentive?: string;          // Agent incentive description
}

// ─── Response Types ───────────────────────────────────────────────────────────

export interface CampaignListResponse {
  id: string;
  name: string;
  description: string | null;
  type: CampaignType;
  status: CampaignStatus;
  startDate: Date | null;
  endDate: Date | null;
  budget: number | null;
  formId: string | null;
  formName: string | null;
  leadsCount: number;
  assignedTeamsCount: number;
  assignedUsersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignDetailResponse extends CampaignListResponse {
  targetAudience: TargetAudience | null;
  settings: CampaignSettings;
  metadata: Record<string, any>;
  organizationId: string;
  assignedTeams: CampaignTeamResponse[];
  assignedUsers: CampaignUserResponse[];
  stats: CampaignStats;
}

export interface CampaignTeamResponse {
  teamId: string;
  teamName: string;
  membersCount: number;
}

export interface CampaignUserResponse {
  userId: string;
  userName: string;
  role: string;
  teamName: string | null;
}

export interface CampaignStats {
  totalLeads: number;
  leadsByStatus: Record<string, number>;
  leadsToday: number;
  leadsThisWeek: number;
  conversionRate: number;
  totalCallsMade: number;
  avgLeadsPerDay: number;
  daysRemaining: number | null;
  budgetSpent: number | null;
  budgetRemaining: number | null;
  topPerformer: { userId: string; userName: string; leadsCount: number } | null;
}

export interface CampaignLeadResponse {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string;
  email: string | null;
  status: string;
  priority: string;
  assignedToName: string | null;
  city: string | null;
  state: string | null;
  createdAt: Date;
}

// ─── Filter / Query Types ──────────────────────────────────────────────────────

export interface CampaignFilters {
  search?: string;
  type?: CampaignType;
  status?: CampaignStatus | CampaignStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  formId?: string;
}

export interface CampaignLeadFilters {
  search?: string;
  status?: string | string[];
  assignedToId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}