export interface UpdateOrganizationInput {
  name?: string;
  logo?: string;
  settings?: OrganizationSettings;
}

export interface OrganizationSettings {
  timezone?: string;
  dateFormat?: string;
  currency?: string;
  language?: string;
  leadAutoAssignment?: boolean;
  leadDuplicateCheck?: boolean;
  requireGeolocation?: boolean;
  maxLeadsPerAgent?: number;
  workingHours?: WorkingHours;
  notifications?: NotificationSettings;
}

export interface WorkingHours {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface DaySchedule {
  enabled: boolean;
  start?: string;
  end?: string;
}

export interface NotificationSettings {
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  newLeadAlert?: boolean;
  leadAssignmentAlert?: boolean;
  dailyDigest?: boolean;
}

export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  settings: OrganizationSettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  stats: OrganizationStats;
}

export interface OrganizationStats {
  totalUsers: number;
  activeUsers: number;
  totalLeads: number;
  totalForms: number;
  totalTeams: number;
}