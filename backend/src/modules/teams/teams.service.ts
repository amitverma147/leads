import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { ApiError } from '../../utils/api-error';
import { parsePaginationParams, PaginatedResult } from '../../utils/pagination';
import {
  CreateTeamInput,
  UpdateTeamInput,
  TeamFilters,
  TeamListResponse,
  TeamDetailResponse,
  TeamMemberResponse,
} from './teams.types';

export class TeamsService {
  /**
   * Create a new team
   */
  async createTeam(input: CreateTeamInput, organizationId: string): Promise<TeamDetailResponse> {
    const { name, description, type, settings } = input;

    // Check for duplicate team name in organization
    const existingTeam = await prisma.team.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        organizationId,
      },
    });

    if (existingTeam) {
      throw ApiError.conflict('A team with this name already exists');
    }

    // Create team
    const team = await prisma.team.create({
      data: {
        name,
        description,
        type,
        settings: settings || {},
        organizationId,
      },
      include: {
        members: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true,
            isActive: true,
          },
        },
        _count: { select: { members: true } },
      },
    });

    logger.info(`Team created: ${team.id} in organization: ${organizationId}`);

    return this.formatTeamDetailResponse(team);
  }

  /**
   * Get all teams with pagination and filters
   */
  async getTeams(
    organizationId: string,
    filters: TeamFilters,
    page?: number,
    limit?: number,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResult<TeamListResponse>> {
    const pagination = parsePaginationParams(page, limit);

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    // Get total count
    const total = await prisma.team.count({ where });

    // Get teams
    const teams = await prisma.team.findMany({
      where,
      include: {
        _count: { select: { members: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: pagination.skip,
      take: pagination.limit,
    });

    const formattedTeams = teams.map((team) => this.formatTeamListResponse(team));

    return {
      data: formattedTeams,
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
   * Get team by ID
   */
  async getTeamById(teamId: string, organizationId: string): Promise<TeamDetailResponse> {
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        organizationId,
      },
      include: {
        members: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true,
            isActive: true,
          },
        },
        _count: { select: { members: true } },
      },
    });

    if (!team) {
      throw ApiError.notFound('Team not found');
    }

    return this.formatTeamDetailResponse(team);
  }

  /**
   * Update team
   */
  async updateTeam(
    teamId: string,
    organizationId: string,
    input: UpdateTeamInput
  ): Promise<TeamDetailResponse> {
    // Check if team exists
    const existingTeam = await prisma.team.findFirst({
      where: {
        id: teamId,
        organizationId,
      },
    });

    if (!existingTeam) {
      throw ApiError.notFound('Team not found');
    }

    // Check for duplicate name if changing
    if (input.name && input.name !== existingTeam.name) {
      const duplicateName = await prisma.team.findFirst({
        where: {
          name: { equals: input.name, mode: 'insensitive' },
          organizationId,
          id: { not: teamId },
        },
      });

      if (duplicateName) {
        throw ApiError.conflict('A team with this name already exists');
      }
    }

    // Update team
    const team = await prisma.team.update({
      where: { id: teamId },
      data: input,
      include: {
        members: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true,
            isActive: true,
          },
        },
        _count: { select: { members: true } },
      },
    });

    logger.info(`Team updated: ${teamId}`);

    return this.formatTeamDetailResponse(team);
  }

  /**
   * Delete team
   */
  async deleteTeam(teamId: string, organizationId: string): Promise<void> {
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        organizationId,
      },
      include: {
        _count: { select: { members: true } },
      },
    });

    if (!team) {
      throw ApiError.notFound('Team not found');
    }

    // Check if team has members
    if (team._count.members > 0) {
      throw ApiError.badRequest(
        `Cannot delete team with ${team._count.members} members. Remove all members first or deactivate the team.`
      );
    }

    await prisma.team.delete({
      where: { id: teamId },
    });

    logger.info(`Team deleted: ${teamId}`);
  }

  /**
   * Add member to team
   */
  async addMember(
    teamId: string,
    userId: string,
    organizationId: string
  ): Promise<TeamDetailResponse> {
    // Check if team exists
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        organizationId,
      },
    });

    if (!team) {
      throw ApiError.notFound('Team not found');
    }

    // Check if user exists and belongs to same organization
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Check if user is already in a team
    if (user.teamId) {
      if (user.teamId === teamId) {
        throw ApiError.badRequest('User is already a member of this team');
      }
      throw ApiError.badRequest('User is already a member of another team');
    }

    // Add user to team
    await prisma.user.update({
      where: { id: userId },
      data: { teamId },
    });

    logger.info(`User ${userId} added to team ${teamId}`);

    return this.getTeamById(teamId, organizationId);
  }

  /**
   * Remove member from team
   */
  async removeMember(
    teamId: string,
    userId: string,
    organizationId: string
  ): Promise<TeamDetailResponse> {
    // Check if team exists
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        organizationId,
      },
    });

    if (!team) {
      throw ApiError.notFound('Team not found');
    }

    // Check if user exists and is member of this team
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
        teamId,
      },
    });

    if (!user) {
      throw ApiError.notFound('User is not a member of this team');
    }

    // Remove user from team
    await prisma.user.update({
      where: { id: userId },
      data: { teamId: null },
    });

    logger.info(`User ${userId} removed from team ${teamId}`);

    return this.getTeamById(teamId, organizationId);
  }

  /**
   * Get team members
   */
  async getTeamMembers(teamId: string, organizationId: string): Promise<TeamMemberResponse[]> {
    // Check if team exists
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        organizationId,
      },
    });

    if (!team) {
      throw ApiError.notFound('Team not found');
    }

    const members = await prisma.user.findMany({
      where: { teamId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        isActive: true,
      },
      orderBy: { firstName: 'asc' },
    });

    return members.map((member) => ({
      id: member.id,
      email: member.email,
      firstName: member.firstName,
      lastName: member.lastName,
      role: member.role,
      avatar: member.avatar,
      isActive: member.isActive,
    }));
  }

  /**
   * Format team list response
   */
  private formatTeamListResponse(team: any): TeamListResponse {
    return {
      id: team.id,
      name: team.name,
      description: team.description,
      type: team.type,
      isActive: team.isActive,
      membersCount: team._count?.members || 0,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };
  }

  /**
   * Format team detail response
   */
  private formatTeamDetailResponse(team: any): TeamDetailResponse {
    return {
      ...this.formatTeamListResponse(team),
      settings: (team.settings as Record<string, any>) || {},
      organizationId: team.organizationId,
      members: team.members?.map((member: any) => ({
        id: member.id,
        email: member.email,
        firstName: member.firstName,
        lastName: member.lastName,
        role: member.role,
        avatar: member.avatar,
        isActive: member.isActive,
      })) || [],
    };
  }
}

export const teamsService = new TeamsService();