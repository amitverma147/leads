import { TargetPeriod, TargetType } from '@prisma/client';

export interface CreateTargetInput {
  name: string;
  description?: string;
  type: TargetType;
  period: TargetPeriod;
  value: number;
  startDate: Date;
  endDate: Date;
}

export interface UpdateTargetInput {
  name?: string;
  description?: string;
  value?: number;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
}

export interface AssignTargetInput {
  targetId: string;
  teamIds?: string[];
  userIds?: string[];
  customValue?: number; // Override default target value
}

export interface TargetResponse {
  id: string;
  name: string;
  description: string | null;
  type: TargetType;
  period: TargetPeriod;
  value: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  assignedTeamsCount: number;
  assignedUsersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TargetDetailResponse extends TargetResponse {
  assignedTeams: AssignedTeamTarget[];
  assignedUsers: AssignedUserTarget[];
}

export interface AssignedTeamTarget {
  teamId: string;
  teamName: string;
  targetValue: number;
  progress: TargetProgressData | null;
}

export interface AssignedUserTarget {
  userId: string;
  userName: string;
  teamName: string | null;
  targetValue: number;
  progress: TargetProgressData | null;
}

export interface TargetProgressData {
  currentValue: number;
  targetValue: number;
  percentage: number;
  remaining: number;
  periodStart: Date;
  periodEnd: Date;
  status: 'on_track' | 'behind' | 'achieved' | 'exceeded';
}

export interface TargetFilters {
  type?: TargetType;
  period?: TargetPeriod;
  isActive?: boolean;
  search?: string;
}

export interface TeamPerformanceResponse {
  teamId: string;
  teamName: string;
  targets: TargetProgressSummary[];
  overallPerformance: number; // Percentage
}

export interface UserPerformanceResponse {
  userId: string;
  userName: string;
  teamName: string | null;
  targets: TargetProgressSummary[];
  overallPerformance: number;
  rank: number;
}

export interface TargetProgressSummary {
  targetId: string;
  targetName: string;
  type: TargetType;
  period: TargetPeriod;
  currentValue: number;
  targetValue: number;
  percentage: number;
  status: 'on_track' | 'behind' | 'achieved' | 'exceeded';
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  avatar: string | null;
  teamName: string | null;
  value: number;
  targetValue: number;
  percentage: number;
  trend: 'up' | 'down' | 'same';
}

export interface LeaderboardResponse {
  period: TargetPeriod;
  type: TargetType;
  entries: LeaderboardEntry[];
  updatedAt: Date;
}