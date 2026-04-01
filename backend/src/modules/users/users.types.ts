import { Role } from '../../config/constants';

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  teamId?: string;
  reportingToId?: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  role?: Role;
  teamId?: string;
  reportingToId?: string;
  isActive?: boolean;
}

export interface UserFilters {
  search?: string;
  role?: Role;
  isActive?: boolean;
  teamId?: string;
}

export interface UserListResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatar: string | null;
  role: Role;
  isActive: boolean;
  isEmailVerified: boolean;
  teamId: string | null;
  teamName: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface UserDetailResponse extends UserListResponse {
  organizationId: string;
  organizationName: string;
  reportingToId: string | null;
  reportingToName: string | null;
  subordinatesCount: number;
  leadsCreatedCount: number;
  leadsAssignedCount: number;
  updatedAt: Date;
}