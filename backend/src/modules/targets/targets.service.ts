import { TargetPeriod, TargetType } from '@prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { ApiError } from '../../utils/api-error';
import { parsePaginationParams, PaginatedResult } from '../../utils/pagination';
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  endOfDay,
  endOfWeek,
  endOfMonth,
} from '../../utils/date';
import {
  CreateTargetInput,
  UpdateTargetInput,
  AssignTargetInput,
  TargetResponse,
  TargetDetailResponse,
  TargetFilters,
  TargetProgressData,
  TargetProgressSummary,
  TeamPerformanceResponse,
  UserPerformanceResponse,
  LeaderboardEntry,
  LeaderboardResponse,
} from './targets.types';

export class TargetsService {
  /**
   * Create a new target
   */
  async createTarget(
    input: CreateTargetInput,
    organizationId: string
  ): Promise<TargetResponse> {
    const { name, description, type, period, value, startDate, endDate } = input;

    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
      throw ApiError.badRequest('Start date must be before end date');
    }

    // Create target
    const target = await prisma.target.create({
      data: {
        name,
        description,
        type,
        period,
        value,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        organizationId,
      },
      include: {
        _count: {
          select: {
            teamTargets: true,
            userTargets: true,
          },
        },
      },
    });

    logger.info(`Target created: ${target.id} in organization: ${organizationId}`);

    return this.formatTargetResponse(target);
  }

  /**
   * Get all targets with pagination and filters
   */
  async getTargets(
    organizationId: string,
    filters: TargetFilters,
    page?: number,
    limit?: number,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResult<TargetResponse>> {
    const pagination = parsePaginationParams(page, limit);

    const where: any = { organizationId };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.period) {
      where.period = filters.period;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const total = await prisma.target.count({ where });

    const targets = await prisma.target.findMany({
      where,
      include: {
        _count: {
          select: {
            teamTargets: true,
            userTargets: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: pagination.skip,
      take: pagination.limit,
    });

    const formattedTargets = targets.map((target) => this.formatTargetResponse(target));

    return {
      data: formattedTargets,
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
   * Get target by ID with full details
   */
  async getTargetById(
    targetId: string,
    organizationId: string
  ): Promise<TargetDetailResponse> {
    const target = await prisma.target.findFirst({
      where: {
        id: targetId,
        organizationId,
      },
      include: {
        teamTargets: {
          include: {
            team: {
              select: { id: true, name: true },
            },
          },
        },
        userTargets: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                team: { select: { name: true } },
              },
            },
          },
        },
        _count: {
          select: {
            teamTargets: true,
            userTargets: true,
          },
        },
      },
    });

    if (!target) {
      throw ApiError.notFound('Target not found');
    }

    // Get progress for each assignment
    const periodRange = this.getCurrentPeriodRange(target.period);

    const assignedTeams = await Promise.all(
      target.teamTargets.map(async (tt) => {
        const progress = await this.getTeamProgress(
          target.id,
          tt.team.id,
          target.type,
          periodRange.start,
          periodRange.end,
          tt.targetValue
        );

        return {
          teamId: tt.team.id,
          teamName: tt.team.name,
          targetValue: tt.targetValue,
          progress,
        };
      })
    );

    const assignedUsers = await Promise.all(
      target.userTargets.map(async (ut) => {
        const progress = await this.getUserProgress(
          target.id,
          ut.user.id,
          target.type,
          periodRange.start,
          periodRange.end,
          ut.targetValue
        );

        return {
          userId: ut.user.id,
          userName: [ut.user.firstName, ut.user.lastName].filter(Boolean).join(' '),
          teamName: ut.user.team?.name || null,
          targetValue: ut.targetValue,
          progress,
        };
      })
    );

    return {
      ...this.formatTargetResponse(target),
      assignedTeams,
      assignedUsers,
    };
  }

  /**
   * Update target
   */
  async updateTarget(
    targetId: string,
    organizationId: string,
    input: UpdateTargetInput
  ): Promise<TargetResponse> {
    const existing = await prisma.target.findFirst({
      where: { id: targetId, organizationId },
    });

    if (!existing) {
      throw ApiError.notFound('Target not found');
    }

    // Validate dates if updating
    if (input.startDate && input.endDate) {
      if (new Date(input.startDate) >= new Date(input.endDate)) {
        throw ApiError.badRequest('Start date must be before end date');
      }
    } else if (input.startDate && new Date(input.startDate) >= existing.endDate) {
      throw ApiError.badRequest('Start date must be before end date');
    } else if (input.endDate && existing.startDate >= new Date(input.endDate)) {
      throw ApiError.badRequest('Start date must be before end date');
    }

    const target = await prisma.target.update({
      where: { id: targetId },
      data: {
        ...input,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      },
      include: {
        _count: {
          select: {
            teamTargets: true,
            userTargets: true,
          },
        },
      },
    });

    logger.info(`Target updated: ${targetId}`);

    return this.formatTargetResponse(target);
  }

  /**
   * Delete target
   */
  async deleteTarget(targetId: string, organizationId: string): Promise<void> {
    const target = await prisma.target.findFirst({
      where: { id: targetId, organizationId },
    });

    if (!target) {
      throw ApiError.notFound('Target not found');
    }

    await prisma.target.delete({
      where: { id: targetId },
    });

    logger.info(`Target deleted: ${targetId}`);
  }

  /**
   * Assign target to teams and/or users
   */
  async assignTarget(
    input: AssignTargetInput,
    organizationId: string
  ): Promise<TargetDetailResponse> {
    const { targetId, teamIds, userIds, customValue } = input;

    if ((!teamIds || teamIds.length === 0) && (!userIds || userIds.length === 0)) {
      throw ApiError.badRequest('At least one team or agent must be selected');
    }

    // Verify target exists
    const target = await prisma.target.findFirst({
      where: { id: targetId, organizationId },
    });

    if (!target) {
      throw ApiError.notFound('Target not found');
    }

    const targetValue = customValue || target.value;

    // Assign to teams
    if (teamIds && teamIds.length > 0) {
      // Verify all teams exist in organization
      const teams = await prisma.team.findMany({
        where: {
          id: { in: teamIds },
          organizationId,
        },
      });

      if (teams.length !== teamIds.length) {
        throw ApiError.badRequest('One or more teams not found');
      }

      // Create team target assignments
      await prisma.teamTarget.createMany({
        data: teamIds.map((teamId) => ({
          teamId,
          targetId,
          targetValue,
        })),
        skipDuplicates: true,
      });
    }

    // Assign to users
    if (userIds && userIds.length > 0) {
      // Verify all users exist in organization
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          organizationId,
        },
      });

      if (users.length !== userIds.length) {
        throw ApiError.badRequest('One or more users not found');
      }

      // Create user target assignments
      await prisma.userTarget.createMany({
        data: userIds.map((userId) => ({
          userId,
          targetId,
          targetValue,
        })),
        skipDuplicates: true,
      });
    }

    logger.info(`Target ${targetId} assigned to ${teamIds?.length || 0} teams and ${userIds?.length || 0} users`);

    return this.getTargetById(targetId, organizationId);
  }

  /**
   * Unassign target from teams and/or users
   */
  async unassignTarget(
    targetId: string,
    organizationId: string,
    teamIds?: string[],
    userIds?: string[]
  ): Promise<TargetDetailResponse> {
    // Verify target exists
    const target = await prisma.target.findFirst({
      where: { id: targetId, organizationId },
    });

    if (!target) {
      throw ApiError.notFound('Target not found');
    }

    // Unassign from teams
    if (teamIds && teamIds.length > 0) {
      await prisma.teamTarget.deleteMany({
        where: {
          targetId,
          teamId: { in: teamIds },
        },
      });
    }

    // Unassign from users
    if (userIds && userIds.length > 0) {
      await prisma.userTarget.deleteMany({
        where: {
          targetId,
          userId: { in: userIds },
        },
      });
    }

    logger.info(`Target ${targetId} unassigned from ${teamIds?.length || 0} teams and ${userIds?.length || 0} users`);

    return this.getTargetById(targetId, organizationId);
  }

  /**
   * Get team performance
   */
  async getTeamPerformance(
    teamId: string,
    organizationId: string
  ): Promise<TeamPerformanceResponse> {
    const team = await prisma.team.findFirst({
      where: { id: teamId, organizationId },
      include: {
        teamTargets: {
          include: {
            target: true,
          },
        },
      },
    });

    if (!team) {
      throw ApiError.notFound('Team not found');
    }

    const targets: TargetProgressSummary[] = await Promise.all(
      team.teamTargets.map(async (tt) => {
        const periodRange = this.getCurrentPeriodRange(tt.target.period);
        const progress = await this.getTeamProgress(
          tt.target.id,
          teamId,
          tt.target.type,
          periodRange.start,
          periodRange.end,
          tt.targetValue
        );

        return {
          targetId: tt.target.id,
          targetName: tt.target.name,
          type: tt.target.type,
          period: tt.target.period,
          currentValue: progress?.currentValue || 0,
          targetValue: tt.targetValue,
          percentage: progress?.percentage || 0,
          status: progress?.status || 'behind',
        };
      })
    );

    const overallPerformance =
      targets.length > 0
        ? targets.reduce((sum, t) => sum + t.percentage, 0) / targets.length
        : 0;

    return {
      teamId,
      teamName: team.name,
      targets,
      overallPerformance: Math.round(overallPerformance * 100) / 100,
    };
  }

  /**
   * Get user performance
   */
  async getUserPerformance(
    userId: string,
    organizationId: string
  ): Promise<UserPerformanceResponse> {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId },
      include: {
        team: { select: { name: true } },
        userTargets: {
          include: {
            target: true,
          },
        },
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const targets: TargetProgressSummary[] = await Promise.all(
      user.userTargets.map(async (ut) => {
        const periodRange = this.getCurrentPeriodRange(ut.target.period);
        const progress = await this.getUserProgress(
          ut.target.id,
          userId,
          ut.target.type,
          periodRange.start,
          periodRange.end,
          ut.targetValue
        );

        return {
          targetId: ut.target.id,
          targetName: ut.target.name,
          type: ut.target.type,
          period: ut.target.period,
          currentValue: progress?.currentValue || 0,
          targetValue: ut.targetValue,
          percentage: progress?.percentage || 0,
          status: progress?.status || 'behind',
        };
      })
    );

    const overallPerformance =
      targets.length > 0
        ? targets.reduce((sum, t) => sum + t.percentage, 0) / targets.length
        : 0;

    // Calculate rank (simplified - just count users with higher performance)
    const rank = 1; // Would need more complex query for actual rank

    return {
      userId,
      userName: [user.firstName, user.lastName].filter(Boolean).join(' '),
      teamName: user.team?.name || null,
      targets,
      overallPerformance: Math.round(overallPerformance * 100) / 100,
      rank,
    };
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(
    organizationId: string,
    type: TargetType,
    period: TargetPeriod,
    teamId?: string,
    limit = 10
  ): Promise<LeaderboardResponse> {
    const periodRange = this.getCurrentPeriodRange(period);

    // Get all users with targets of this type and period
    const userTargets = await prisma.userTarget.findMany({
      where: {
        target: {
          organizationId,
          type,
          period,
          isActive: true,
        },
        user: teamId ? { teamId } : {},
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            team: { select: { name: true } },
          },
        },
        target: true,
      },
    });

    // Calculate progress for each user
    const entries: LeaderboardEntry[] = await Promise.all(
      userTargets.map(async (ut) => {
        const currentValue = await this.calculateUserMetric(
          ut.user.id,
          type,
          periodRange.start,
          periodRange.end
        );

        const percentage = Math.min((currentValue / ut.targetValue) * 100, 100);

        return {
          rank: 0, // Will be set after sorting
          userId: ut.user.id,
          userName: [ut.user.firstName, ut.user.lastName].filter(Boolean).join(' '),
          avatar: ut.user.avatar,
          teamName: ut.user.team?.name || null,
          value: currentValue,
          targetValue: ut.targetValue,
          percentage: Math.round(percentage * 100) / 100,
          trend: 'same' as const, // Would need historical data for trend
        };
      })
    );

    // Sort by percentage descending and assign ranks
    entries.sort((a, b) => b.percentage - a.percentage);
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return {
      period,
      type,
      entries: entries.slice(0, limit),
      updatedAt: new Date(),
    };
  }

  /**
   * Calculate user metric for a target type
   */
  private async calculateUserMetric(
    userId: string,
    type: TargetType,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    switch (type) {
      case 'leads_collected':
        return prisma.lead.count({
          where: {
            createdById: userId,
            createdAt: { gte: startDate, lte: endDate },
          },
        });

      case 'leads_converted':
        return prisma.lead.count({
          where: {
            createdById: userId,
            status: 'converted',
            convertedAt: { gte: startDate, lte: endDate },
          },
        });

      case 'calls_made':
        return prisma.callLog.count({
          where: {
            userId,
            direction: 'outbound',
            startedAt: { gte: startDate, lte: endDate },
          },
        });

      case 'follow_ups':
        return prisma.leadActivity.count({
          where: {
            userId,
            type: 'follow_up',
            createdAt: { gte: startDate, lte: endDate },
          },
        });

      case 'visits':
        // Count leads with geolocation data
        return prisma.lead.count({
          where: {
            createdById: userId,
            latitude: { not: null },
            createdAt: { gte: startDate, lte: endDate },
          },
        });

      case 'revenue':
        const leads = await prisma.lead.findMany({
          where: {
            createdById: userId,
            status: 'converted',
            convertedAt: { gte: startDate, lte: endDate },
          },
          select: { dealValue: true },
        });
        return leads.reduce((sum, lead) => sum + (lead.dealValue || 0), 0);

      default:
        return 0;
    }
  }

  /**
   * Get team progress for a target
   */
  private async getTeamProgress(
    targetId: string,
    teamId: string,
    type: TargetType,
    startDate: Date,
    endDate: Date,
    targetValue: number
  ): Promise<TargetProgressData | null> {
    // Get all team members
    const teamMembers = await prisma.user.findMany({
      where: { teamId },
      select: { id: true },
    });

    if (teamMembers.length === 0) {
      return null;
    }

    const memberIds = teamMembers.map((m) => m.id);

    // Calculate total progress for team
    let currentValue = 0;

    for (const memberId of memberIds) {
      currentValue += await this.calculateUserMetric(memberId, type, startDate, endDate);
    }

    const percentage = Math.min((currentValue / targetValue) * 100, 100);
    const remaining = Math.max(targetValue - currentValue, 0);

    return {
      currentValue,
      targetValue,
      percentage: Math.round(percentage * 100) / 100,
      remaining,
      periodStart: startDate,
      periodEnd: endDate,
      status: this.getProgressStatus(percentage),
    };
  }

  /**
   * Get user progress for a target
   */
  private async getUserProgress(
    targetId: string,
    userId: string,
    type: TargetType,
    startDate: Date,
    endDate: Date,
    targetValue: number
  ): Promise<TargetProgressData | null> {
    const currentValue = await this.calculateUserMetric(userId, type, startDate, endDate);

    const percentage = Math.min((currentValue / targetValue) * 100, 100);
    const remaining = Math.max(targetValue - currentValue, 0);

    return {
      currentValue,
      targetValue,
      percentage: Math.round(percentage * 100) / 100,
      remaining,
      periodStart: startDate,
      periodEnd: endDate,
      status: this.getProgressStatus(percentage),
    };
  }

  /**
   * Get current period date range
   */
  private getCurrentPeriodRange(period: TargetPeriod): { start: Date; end: Date } {
    const now = new Date();

    switch (period) {
      case 'daily':
        return {
          start: startOfDay(now),
          end: endOfDay(now),
        };

      case 'weekly':
        return {
          start: startOfWeek(now),
          end: endOfWeek(now),
        };

      case 'monthly':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
        };

      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        return {
          start: new Date(now.getFullYear(), quarter * 3, 1),
          end: new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59, 999),
        };

      default:
        return {
          start: startOfDay(now),
          end: endOfDay(now),
        };
    }
  }

  /**
   * Get progress status based on percentage
   */
  private getProgressStatus(
    percentage: number
  ): 'on_track' | 'behind' | 'achieved' | 'exceeded' {
    if (percentage > 100) return 'exceeded';
    if (percentage >= 100) return 'achieved';
    if (percentage >= 70) return 'on_track';
    return 'behind';
  }

  /**
   * Format target response
   */
  private formatTargetResponse(target: any): TargetResponse {
    return {
      id: target.id,
      name: target.name,
      description: target.description,
      type: target.type,
      period: target.period,
      value: target.value,
      startDate: target.startDate,
      endDate: target.endDate,
      isActive: target.isActive,
      assignedTeamsCount: target._count?.teamTargets || 0,
      assignedUsersCount: target._count?.userTargets || 0,
      createdAt: target.createdAt,
      updatedAt: target.updatedAt,
    };
  }
}

export const targetsService = new TargetsService();