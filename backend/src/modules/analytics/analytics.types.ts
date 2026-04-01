import { LeadStatus, LeadSource, LeadPriority } from '../../config/constants';

export interface DateRangeFilter {
  startDate: Date;
  endDate: Date;
}

export interface DashboardStats {
  leads: {
    total: number;
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
    conversionRate: number;
  };
  users: {
    total: number;
    active: number;
    agents: number;
    marketing: number;
  };
  forms: {
    total: number;
    published: number;
  };
  todayActivity: {
    leadsCreated: number;
    leadsContacted: number;
    leadsConverted: number;
  };
}

export interface LeadsByStatusData {
  status: LeadStatus;
  count: number;
  percentage: number;
}

export interface LeadsBySourceData {
  source: LeadSource;
  count: number;
  percentage: number;
}

export interface LeadsByPriorityData {
  priority: LeadPriority;
  count: number;
  percentage: number;
}

export interface LeadsTrendData {
  date: string;
  created: number;
  converted: number;
}

export interface AgentPerformanceData {
  userId: string;
  userName: string;
  leadsCreated: number;
  leadsConverted: number;
  conversionRate: number;
  avgResponseTime: number | null;
}

export interface TopPerformersData {
  agents: AgentPerformanceData[];
  marketingTeam: AgentPerformanceData[];
}

export interface ConversionFunnelData {
  stage: string;
  count: number;
  percentage: number;
  dropOff: number;
}

export interface GeographicData {
  city: string;
  state: string;
  count: number;
  percentage: number;
}