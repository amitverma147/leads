export interface CreateTeamInput {
  name: string;
  description?: string;
  type: 'marketing' | 'field';
  settings?: Record<string, any>;
}

export interface UpdateTeamInput {
  name?: string;
  description?: string;
  type?: 'marketing' | 'field';
  settings?: Record<string, any>;
  isActive?: boolean;
}

export interface TeamListResponse {
  id: string;
  name: string;
  description: string | null;
  type: string;
  isActive: boolean;
  membersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamDetailResponse extends TeamListResponse {
  settings: Record<string, any>;
  organizationId: string;
  members: TeamMemberResponse[];
}

export interface TeamMemberResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar: string | null;
  isActive: boolean;
}

export interface AddTeamMemberInput {
  userId: string;
}

export interface TeamFilters {
  search?: string;
  type?: 'marketing' | 'field';
  isActive?: boolean;
}