import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { Role, ROLES } from '../../config/constants';
import { ApiError } from '../../utils/api-error';
import { hashPassword } from '../../utils/password';
import { parsePaginationParams, PaginatedResult } from '../../utils/pagination';
import {
  CreateUserInput,
  UpdateUserInput,
  UserFilters,
  UserListResponse,
  UserDetailResponse,
} from './users.types';

export class UsersService {
  /**
   * Create a new user
   */
  async createUser(
    input: CreateUserInput,
    organizationId: string,
    createdByRole: Role
  ): Promise<UserDetailResponse> {
    const { email, password, firstName, lastName, phone, role, teamId, reportingToId } = input;

    // Check if current user can create users with this role
    this.validateRoleAssignment(createdByRole, role);

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      throw ApiError.conflict('Email already registered');
    }

    // Check if phone already exists
    if (phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone },
      });

      if (existingPhone) {
        throw ApiError.conflict('Phone number already registered');
      }
    }

    // Validate team belongs to organization
    if (teamId) {
      const team = await prisma.team.findFirst({
        where: { id: teamId, organizationId },
      });

      if (!team) {
        throw ApiError.notFound('Team not found');
      }
    }

    // Validate reporting user belongs to organization
    if (reportingToId) {
      const reportingTo = await prisma.user.findFirst({
        where: { id: reportingToId, organizationId },
      });

      if (!reportingTo) {
        throw ApiError.notFound('Reporting user not found');
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        role,
        teamId,
        reportingToId,
        organizationId,
      },
      include: {
        organization: true,
        team: true,
        reportingTo: true,
        _count: {
          select: {
            subordinates: true,
            createdLeads: true,
            assignedLeads: true,
          },
        },
      },
    });

    logger.info(`User created: ${user.email} by organization: ${organizationId}`);

    return this.formatUserDetailResponse(user);
  }

  /**
   * Get all users with pagination and filters
   */
  async getUsers(
    organizationId: string,
    filters: UserFilters,
    page?: number,
    limit?: number,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResult<UserListResponse>> {
    const pagination = parsePaginationParams(page, limit);

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
      ];
    }

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.teamId) {
      where.teamId = filters.teamId;
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get users
    const users = await prisma.user.findMany({
      where,
      include: {
        team: {
          select: { id: true, name: true },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: pagination.skip,
      take: pagination.limit,
    });

    const formattedUsers = users.map((user) => this.formatUserListResponse(user));

    return {
      data: formattedUsers,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        hasNextPage: pagination.page < Math.ceil(total / pagination.limit),
        hasPrevPage: pagination.page > 1,
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string, organizationId: string): Promise<UserDetailResponse> {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
      },
      include: {
        organization: true,
        team: true,
        reportingTo: true,
        _count: {
          select: {
            subordinates: true,
            createdLeads: true,
            assignedLeads: true,
          },
        },
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return this.formatUserDetailResponse(user);
  }

  /**
   * Update user
   */
  async updateUser(
    userId: string,
    organizationId: string,
    input: UpdateUserInput,
    updatedByRole: Role
  ): Promise<UserDetailResponse> {
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { id: userId, organizationId },
    });

    if (!existingUser) {
      throw ApiError.notFound('User not found');
    }

    // Validate role assignment if changing role
    if (input.role) {
      this.validateRoleAssignment(updatedByRole, input.role);
    }

    // Check phone uniqueness if updating
    if (input.phone && input.phone !== existingUser.phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone: input.phone },
      });

      if (existingPhone) {
        throw ApiError.conflict('Phone number already registered');
      }
    }

    // Validate team if updating
    if (input.teamId) {
      const team = await prisma.team.findFirst({
        where: { id: input.teamId, organizationId },
      });

      if (!team) {
        throw ApiError.notFound('Team not found');
      }
    }

    // Validate reporting user if updating
    if (input.reportingToId) {
      if (input.reportingToId === userId) {
        throw ApiError.badRequest('User cannot report to themselves');
      }

      const reportingTo = await prisma.user.findFirst({
        where: { id: input.reportingToId, organizationId },
      });

      if (!reportingTo) {
        throw ApiError.notFound('Reporting user not found');
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...input,
        teamId: input.teamId === null ? null : input.teamId,
        reportingToId: input.reportingToId === null ? null : input.reportingToId,
      },
      include: {
        organization: true,
        team: true,
        reportingTo: true,
        _count: {
          select: {
            subordinates: true,
            createdLeads: true,
            assignedLeads: true,
          },
        },
      },
    });

    logger.info(`User updated: ${user.email}`);

    return this.formatUserDetailResponse(user);
  }

  /**
   * Delete user (soft delete - deactivate)
   */
  async deleteUser(userId: string, organizationId: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Deactivate user and revoke all tokens
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      }),
      prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      }),
    ]);

    logger.info(`User deactivated: ${user.email}`);
  }

  /**
   * Activate user
   */
  async activateUser(userId: string, organizationId: string): Promise<UserDetailResponse> {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
      include: {
        organization: true,
        team: true,
        reportingTo: true,
        _count: {
          select: {
            subordinates: true,
            createdLeads: true,
            assignedLeads: true,
          },
        },
      },
    });

    logger.info(`User activated: ${user.email}`);

    return this.formatUserDetailResponse(updatedUser);
  }

  /**
   * Validate role assignment permissions
   */
  private validateRoleAssignment(assignerRole: Role, targetRole: Role): void {
    const roleHierarchy: Record<Role, number> = {
      [ROLES.SUPER_ADMIN]: 100,
      [ROLES.ADMIN]: 80,
      [ROLES.MARKETING_MANAGER]: 60,
      [ROLES.AGENT_SUPERVISOR]: 60,
      [ROLES.MARKETING_AGENT]: 40,
      [ROLES.FIELD_AGENT]: 40,
    };

    const assignerLevel = roleHierarchy[assignerRole] || 0;
    const targetLevel = roleHierarchy[targetRole] || 0;

    // Cannot assign role higher than or equal to own (except super_admin)
    if (assignerRole !== ROLES.SUPER_ADMIN && targetLevel >= assignerLevel) {
      throw ApiError.forbidden('You cannot assign this role');
    }
  }

  /**
   * Format user list response
   */
  private formatUserListResponse(user: any): UserListResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role as Role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      teamId: user.teamId,
      teamName: user.team?.name || null,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }

  /**
   * Format user detail response
   */
  private formatUserDetailResponse(user: any): UserDetailResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role as Role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      teamId: user.teamId,
      teamName: user.team?.name || null,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      organizationId: user.organizationId,
      organizationName: user.organization.name,
      reportingToId: user.reportingToId,
      reportingToName: user.reportingTo
        ? `${user.reportingTo.firstName} ${user.reportingTo.lastName}`
        : null,
      subordinatesCount: user._count.subordinates,
      leadsCreatedCount: user._count.createdLeads,
      leadsAssignedCount: user._count.assignedLeads,
      updatedAt: user.updatedAt,
    };
  }
}

export const usersService = new UsersService();