import { CampaignStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { ApiError } from '../../utils/api-error';
import { parsePaginationParams, PaginatedResult } from '../../utils/pagination';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, daysBetween } from '../../utils/date';
import { LEAD_STATUS, ROLES, Role } from '../../config/constants';
import {
  CreateCampaignInput,
  UpdateCampaignInput,
  CampaignFilters,
  CampaignLeadFilters,
  CampaignListResponse,
  CampaignDetailResponse,
  CampaignStats,
  CampaignLeadResponse,
  CampaignTeamResponse,
  CampaignUserResponse,
  CampaignSettings,
  TargetAudience,
} from './campaigns.types';

export class CampaignsService {
  // ─── CREATE ─────────────────────────────────────────────────────────────────

  /**
   * Create a new campaign
   */
  async createCampaign(
    input: CreateCampaignInput,
    organizationId: string
  ): Promise<CampaignDetailResponse> {
    const {
      name,
      description,
      type,
      startDate,
      endDate,
      budget,
      formId,
      targetAudience,
      settings,
      assignedTeamIds,
      assignedUserIds,
    } = input;

    // Duplicate name check within org
    const existing = await prisma.campaign.findFirst({
      where: { name: { equals: name, mode: 'insensitive' }, organizationId },
    });
    if (existing) {
      throw ApiError.conflict('A campaign with this name already exists');
    }

    // Validate form if provided
    if (formId) {
      const form = await prisma.form.findFirst({
        where: { id: formId, organizationId, isActive: true },
      });
      if (!form) throw ApiError.notFound('Form not found or inactive');
    }

    // Validate teams if provided
    if (assignedTeamIds?.length) {
      const teams = await prisma.team.findMany({
        where: { id: { in: assignedTeamIds }, organizationId },
      });
      if (teams.length !== assignedTeamIds.length) {
        throw ApiError.badRequest('One or more teams not found in this organization');
      }
    }

    // Validate users if provided
    if (assignedUserIds?.length) {
      const users = await prisma.user.findMany({
        where: { id: { in: assignedUserIds }, organizationId, isActive: true },
      });
      if (users.length !== assignedUserIds.length) {
        throw ApiError.badRequest('One or more users not found or inactive');
      }
    }

    // Build metadata with assigned teams/users for quick reference
    const metadata: Record<string, any> = {
      assignedTeamIds: assignedTeamIds || [],
      assignedUserIds: assignedUserIds || [],
      statusHistory: [{ status: 'draft', changedAt: new Date().toISOString() }],
    };

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        type,
        status: 'draft',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: budget ?? null,
        formId: formId ?? null,
        settings: settings || {},
        metadata,
        organizationId,
      },
      include: {
        form: { select: { id: true, name: true } },
        _count: { select: { leads: true } },
      },
    });

    logger.info(`Campaign created: ${campaign.id} [${type}] org: ${organizationId}`);

    return this.getDetailResponse(campaign, targetAudience || null, organizationId);
  }

  // ─── READ ────────────────────────────────────────────────────────────────────

  /**
   * List campaigns with filters & pagination
   */
  async getCampaigns(
    organizationId: string,
    filters: CampaignFilters,
    page?: number,
    limit?: number,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResult<CampaignListResponse>> {
    const pagination = parsePaginationParams(page, limit);

    const where: any = { organizationId };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.type) where.type = filters.type;
    if (filters.formId) where.formId = filters.formId;
    if (filters.status) {
      where.status = Array.isArray(filters.status)
        ? { in: filters.status }
        : filters.status;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    const total = await prisma.campaign.count({ where });

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        form: { select: { id: true, name: true } },
        _count: { select: { leads: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: pagination.skip,
      take: pagination.limit,
    });

    const data = campaigns.map((c) => this.formatListResponse(c));

    return {
      data,
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
   * Get campaign by ID with full detail
   */
  async getCampaignById(
    campaignId: string,
    organizationId: string
  ): Promise<CampaignDetailResponse> {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
      include: {
        form: { select: { id: true, name: true } },
        _count: { select: { leads: true } },
      },
    });

    if (!campaign) throw ApiError.notFound('Campaign not found');

    const meta = campaign.metadata as Record<string, any>;
    const targetAudience = meta?.targetAudience || null;

    return this.getDetailResponse(campaign, targetAudience, organizationId);
  }

  /**
   * Get leads belonging to a campaign
   */
  async getCampaignLeads(
    campaignId: string,
    organizationId: string,
    userId: string,
    userRole: Role,
    filters: CampaignLeadFilters,
    page?: number,
    limit?: number,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResult<CampaignLeadResponse>> {
    // Verify campaign belongs to org
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
    });
    if (!campaign) throw ApiError.notFound('Campaign not found');

    const pagination = parsePaginationParams(page, limit);

    const where: any = { campaignId, organizationId };

    // Role-based scoping
    if (userRole === ROLES.FIELD_AGENT) where.createdById = userId;
    if (userRole === ROLES.MARKETING_AGENT) where.assignedToId = userId;

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.status) {
      where.status = Array.isArray(filters.status)
        ? { in: filters.status }
        : filters.status;
    }
    if (filters.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    const total = await prisma.lead.count({ where });

    const leads = await prisma.lead.findMany({
      where,
      include: {
        assignedTo: { select: { firstName: true, lastName: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: pagination.skip,
      take: pagination.limit,
    });

    const data: CampaignLeadResponse[] = leads.map((l) => ({
      id: l.id,
      firstName: l.firstName,
      lastName: l.lastName,
      phone: l.phone,
      email: l.email,
      status: l.status,
      priority: l.priority,
      assignedToName: l.assignedTo
        ? `${l.assignedTo.firstName} ${l.assignedTo.lastName}`
        : null,
      city: l.city,
      state: l.state,
      createdAt: l.createdAt,
    }));

    return {
      data,
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
   * Get campaign statistics
   */
  async getCampaignStats(
    campaignId: string,
    organizationId: string
  ): Promise<CampaignStats> {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
    });
    if (!campaign) throw ApiError.notFound('Campaign not found');

    const today = startOfDay(new Date());
    const weekStart = startOfWeek(new Date());

    // Parallel queries for performance
    const [
      totalLeads,
      leadsByStatus,
      leadsToday,
      leadsThisWeek,
      topPerformerRaw,
      totalCalls,
    ] = await Promise.all([
      prisma.lead.count({ where: { campaignId, organizationId } }),

      prisma.lead.groupBy({
        by: ['status'],
        where: { campaignId, organizationId },
        _count: true,
      }),

      prisma.lead.count({
        where: {
          campaignId,
          organizationId,
          createdAt: { gte: today, lte: endOfDay(new Date()) },
        },
      }),

      prisma.lead.count({
        where: {
          campaignId,
          organizationId,
          createdAt: { gte: weekStart, lte: endOfWeek(new Date()) },
        },
      }),

      prisma.lead.groupBy({
        by: ['createdById'],
        where: { campaignId, organizationId },
        _count: true,
        orderBy: { _count: { createdById: 'desc' } },
        take: 1,
      }),

      prisma.callLog.count({
        where: {
          lead: { campaignId, organizationId },
          direction: 'outbound',
        },
      }),
    ]);

    // Build status map
    const leadsByStatusMap: Record<string, number> = {};
    for (const item of leadsByStatus) {
      leadsByStatusMap[item.status] = item._count;
    }

    // Conversion rate
    const converted = leadsByStatusMap[LEAD_STATUS.CONVERTED] || 0;
    const conversionRate =
      totalLeads > 0 ? Math.round((converted / totalLeads) * 10000) / 100 : 0;

    // Average leads per day
    let avgLeadsPerDay = 0;
    if (campaign.startDate) {
      const daysRunning = Math.max(
        daysBetween(campaign.startDate, new Date()),
        1
      );
      avgLeadsPerDay = Math.round((totalLeads / daysRunning) * 100) / 100;
    }

    // Days remaining
    let daysRemaining: number | null = null;
    if (campaign.endDate && campaign.endDate > new Date()) {
      daysRemaining = daysBetween(new Date(), campaign.endDate);
    }

    // Top performer
    let topPerformer: CampaignStats['topPerformer'] = null;
    if (topPerformerRaw.length > 0) {
      const tp = topPerformerRaw[0];
      const tpUser = await prisma.user.findUnique({
        where: { id: tp.createdById },
        select: { id: true, firstName: true, lastName: true },
      });
      if (tpUser) {
        topPerformer = {
          userId: tpUser.id,
          userName: `${tpUser.firstName} ${tpUser.lastName}`,
          leadsCount: tp._count,
        };
      }
    }

    // Budget metrics
    const settings = campaign.settings as CampaignSettings;
    let budgetSpent: number | null = null;
    let budgetRemaining: number | null = null;
    if (campaign.budget !== null) {
      // Simple estimate: budget / maxLeads * leadsGenerated
      const maxLeads = settings?.maxLeadsTotal || 1;
      budgetSpent = Math.round((campaign.budget / maxLeads) * totalLeads * 100) / 100;
      budgetRemaining = Math.max(campaign.budget - budgetSpent, 0);
    }

    return {
      totalLeads,
      leadsByStatus: leadsByStatusMap,
      leadsToday,
      leadsThisWeek,
      conversionRate,
      totalCallsMade: totalCalls,
      avgLeadsPerDay,
      daysRemaining,
      budgetSpent,
      budgetRemaining,
      topPerformer,
    };
  }

  // ─── UPDATE ──────────────────────────────────────────────────────────────────

  /**
   * Update campaign fields
   */
  async updateCampaign(
    campaignId: string,
    organizationId: string,
    input: UpdateCampaignInput
  ): Promise<CampaignDetailResponse> {
    const existing = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
    });
    if (!existing) throw ApiError.notFound('Campaign not found');

    // Cannot edit a completed/cancelled campaign
    if (['completed', 'cancelled'].includes(existing.status)) {
      throw ApiError.badRequest(
        `Cannot update a campaign with status '${existing.status}'`
      );
    }

    // Duplicate name check (excluding self)
    if (input.name && input.name !== existing.name) {
      const dup = await prisma.campaign.findFirst({
        where: {
          name: { equals: input.name, mode: 'insensitive' },
          organizationId,
          id: { not: campaignId },
        },
      });
      if (dup) throw ApiError.conflict('A campaign with this name already exists');
    }

    // Validate form if changing
    if (input.formId) {
      const form = await prisma.form.findFirst({
        where: { id: input.formId, organizationId, isActive: true },
      });
      if (!form) throw ApiError.notFound('Form not found or inactive');
    }

    // Build update payload
    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.startDate !== undefined)
      updateData.startDate = input.startDate ? new Date(input.startDate) : null;
    if (input.endDate !== undefined)
      updateData.endDate = input.endDate ? new Date(input.endDate) : null;
    if (input.budget !== undefined) updateData.budget = input.budget;
    if (input.formId !== undefined) updateData.formId = input.formId;
    if (input.settings !== undefined) {
      // Merge settings instead of replacing
      updateData.settings = {
        ...(existing.settings as object),
        ...input.settings,
      };
    }
    if (input.targetAudience !== undefined) {
      const existingMeta = existing.metadata as Record<string, any>;
      updateData.metadata = {
        ...existingMeta,
        targetAudience: input.targetAudience,
      };
    }

    // Track status change in history
    if (input.status && input.status !== existing.status) {
      const existingMeta = (updateData.metadata ||
        existing.metadata) as Record<string, any>;
      const history = existingMeta?.statusHistory || [];
      history.push({ status: input.status, changedAt: new Date().toISOString() });
      updateData.metadata = { ...existingMeta, statusHistory: history };
      updateData.status = input.status;
    }

    const campaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: updateData,
      include: {
        form: { select: { id: true, name: true } },
        _count: { select: { leads: true } },
      },
    });

    logger.info(`Campaign updated: ${campaignId}`);
    return this.getCampaignById(campaign.id, organizationId);
  }

  /**
   * Change campaign status with validation rules
   *
   * Allowed transitions:
   *   draft     → active | cancelled
   *   active    → paused | completed | cancelled
   *   paused    → active | cancelled
   *   completed → (none)
   *   cancelled → (none)
   */
  async changeCampaignStatus(
    campaignId: string,
    organizationId: string,
    newStatus: CampaignStatus,
    reason?: string
  ): Promise<CampaignDetailResponse> {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
    });
    if (!campaign) throw ApiError.notFound('Campaign not found');

    const current = campaign.status as CampaignStatus;

    // Validate transition
    const allowed: Record<string, CampaignStatus[]> = {
      draft: ['active', 'cancelled'],
      active: ['paused', 'completed', 'cancelled'],
      paused: ['active', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    if (!allowed[current]?.includes(newStatus)) {
      throw ApiError.badRequest(
        `Cannot transition from '${current}' to '${newStatus}'`
      );
    }

    // Extra check: must have a form when activating if formRequired
    const settings = campaign.settings as CampaignSettings;
    if (newStatus === 'active' && settings?.formRequired && !campaign.formId) {
      throw ApiError.badRequest(
        'This campaign requires a form to be assigned before activation'
      );
    }

    // Update status and history
    const existingMeta = campaign.metadata as Record<string, any>;
    const history = existingMeta?.statusHistory || [];
    history.push({
      status: newStatus,
      changedAt: new Date().toISOString(),
      reason: reason || null,
    });

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: newStatus,
        metadata: { ...existingMeta, statusHistory: history },
      },
    });

    logger.info(`Campaign ${campaignId} status: ${current} → ${newStatus}`);
    return this.getCampaignById(campaignId, organizationId);
  }

  // ─── LEAD MANAGEMENT ─────────────────────────────────────────────────────────

  /**
   * Add existing leads to a campaign
   */
  async addLeadsToCampaign(
    campaignId: string,
    organizationId: string,
    leadIds: string[]
  ): Promise<{ added: number; skipped: number }> {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
    });
    if (!campaign) throw ApiError.notFound('Campaign not found');

    if (campaign.status === 'completed' || campaign.status === 'cancelled') {
      throw ApiError.badRequest(
        `Cannot add leads to a '${campaign.status}' campaign`
      );
    }

    // Verify leads belong to org
    const validLeads = await prisma.lead.findMany({
      where: { id: { in: leadIds }, organizationId },
      select: { id: true, campaignId: true },
    });

    const settings = campaign.settings as CampaignSettings;
    const alreadyAssigned = validLeads.filter(
      (l) => l.campaignId !== null && l.campaignId !== campaignId
    );

    let toUpdate = validLeads;

    // Skip leads already in another campaign unless duplicates allowed
    if (!settings?.allowDuplicates) {
      toUpdate = validLeads.filter(
        (l) => l.campaignId === null || l.campaignId === campaignId
      );
    }

    if (toUpdate.length === 0) {
      return { added: 0, skipped: leadIds.length };
    }

    const result = await prisma.lead.updateMany({
      where: { id: { in: toUpdate.map((l) => l.id) } },
      data: { campaignId },
    });

    logger.info(
      `Added ${result.count} leads to campaign ${campaignId}, skipped ${leadIds.length - result.count}`
    );

    return {
      added: result.count,
      skipped: leadIds.length - result.count,
    };
  }

  /**
   * Remove leads from a campaign (set campaignId to null)
   */
  async removeLeadsFromCampaign(
    campaignId: string,
    organizationId: string,
    leadIds: string[]
  ): Promise<{ removed: number }> {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
    });
    if (!campaign) throw ApiError.notFound('Campaign not found');

    const result = await prisma.lead.updateMany({
      where: {
        id: { in: leadIds },
        campaignId,
        organizationId,
      },
      data: { campaignId: null },
    });

    logger.info(`Removed ${result.count} leads from campaign ${campaignId}`);
    return { removed: result.count };
  }

  // ─── TEAM / USER ASSIGNMENT ───────────────────────────────────────────────────

  /**
   * Assign teams to a campaign (stored in metadata)
   */
  async assignTeams(
    campaignId: string,
    organizationId: string,
    teamIds: string[]
  ): Promise<CampaignDetailResponse> {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
    });
    if (!campaign) throw ApiError.notFound('Campaign not found');

    // Validate teams exist in org
    const teams = await prisma.team.findMany({
      where: { id: { in: teamIds }, organizationId },
    });
    if (teams.length !== teamIds.length) {
      throw ApiError.badRequest('One or more teams not found in this organization');
    }

    const existingMeta = campaign.metadata as Record<string, any>;
    const existing: string[] = existingMeta?.assignedTeamIds || [];
    const merged = Array.from(new Set([...existing, ...teamIds]));

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { metadata: { ...existingMeta, assignedTeamIds: merged } },
    });

    logger.info(`Assigned ${teamIds.length} teams to campaign ${campaignId}`);
    return this.getCampaignById(campaignId, organizationId);
  }

  /**
   * Remove teams from a campaign
   */
  async removeTeams(
    campaignId: string,
    organizationId: string,
    teamIds: string[]
  ): Promise<CampaignDetailResponse> {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
    });
    if (!campaign) throw ApiError.notFound('Campaign not found');

    const existingMeta = campaign.metadata as Record<string, any>;
    const existing: string[] = existingMeta?.assignedTeamIds || [];
    const filtered = existing.filter((id) => !teamIds.includes(id));

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { metadata: { ...existingMeta, assignedTeamIds: filtered } },
    });

    logger.info(`Removed ${teamIds.length} teams from campaign ${campaignId}`);
    return this.getCampaignById(campaignId, organizationId);
  }

  /**
   * Assign users to a campaign (stored in metadata)
   */
  async assignUsers(
    campaignId: string,
    organizationId: string,
    userIds: string[]
  ): Promise<CampaignDetailResponse> {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
    });
    if (!campaign) throw ApiError.notFound('Campaign not found');

    const users = await prisma.user.findMany({
      where: { id: { in: userIds }, organizationId, isActive: true },
    });
    if (users.length !== userIds.length) {
      throw ApiError.badRequest('One or more users not found or inactive');
    }

    const existingMeta = campaign.metadata as Record<string, any>;
    const existing: string[] = existingMeta?.assignedUserIds || [];
    const merged = Array.from(new Set([...existing, ...userIds]));

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { metadata: { ...existingMeta, assignedUserIds: merged } },
    });

    logger.info(`Assigned ${userIds.length} users to campaign ${campaignId}`);
    return this.getCampaignById(campaignId, organizationId);
  }

  /**
   * Remove users from a campaign
   */
  async removeUsers(
    campaignId: string,
    organizationId: string,
    userIds: string[]
  ): Promise<CampaignDetailResponse> {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
    });
    if (!campaign) throw ApiError.notFound('Campaign not found');

    const existingMeta = campaign.metadata as Record<string, any>;
    const existing: string[] = existingMeta?.assignedUserIds || [];
    const filtered = existing.filter((id) => !userIds.includes(id));

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { metadata: { ...existingMeta, assignedUserIds: filtered } },
    });

    logger.info(`Removed ${userIds.length} users from campaign ${campaignId}`);
    return this.getCampaignById(campaignId, organizationId);
  }

  // ─── AUTO-ASSIGN ─────────────────────────────────────────────────────────────

  /**
   * Auto-assign unassigned campaign leads to users based on strategy
   * Strategies: round_robin | least_loaded
   */
  async autoAssignLeads(
    campaignId: string,
    organizationId: string
  ): Promise<{ assigned: number }> {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
    });
    if (!campaign) throw ApiError.notFound('Campaign not found');
    if (campaign.status !== 'active') {
      throw ApiError.badRequest('Auto-assign is only available for active campaigns');
    }

    const settings = campaign.settings as CampaignSettings;
    const strategy = settings?.autoAssignStrategy || 'round_robin';
    const meta = campaign.metadata as Record<string, any>;
    const assignedUserIds: string[] = meta?.assignedUserIds || [];

    if (assignedUserIds.length === 0) {
      throw ApiError.badRequest(
        'No users assigned to this campaign. Assign users first.'
      );
    }

    // Get eligible users (active + in assignedUserIds)
    const users = await prisma.user.findMany({
      where: { id: { in: assignedUserIds }, organizationId, isActive: true },
      select: {
        id: true,
        _count: { select: { assignedLeads: true } },
      },
    });

    if (users.length === 0) {
      throw ApiError.badRequest('No active users available for assignment');
    }

    // Sort by strategy
    if (strategy === 'least_loaded') {
      users.sort((a, b) => a._count.assignedLeads - b._count.assignedLeads);
    }

    // Get unassigned leads for this campaign
    const unassignedLeads = await prisma.lead.findMany({
      where: { campaignId, organizationId, assignedToId: null },
      select: { id: true },
    });

    if (unassignedLeads.length === 0) {
      return { assigned: 0 };
    }

    // Distribute leads
    const updates: Promise<any>[] = [];
    unassignedLeads.forEach((lead, index) => {
      const user = users[index % users.length];
      updates.push(
        prisma.lead.update({
          where: { id: lead.id },
          data: { assignedToId: user.id },
        })
      );
    });

    await Promise.all(updates);

    logger.info(
      `Auto-assigned ${unassignedLeads.length} leads in campaign ${campaignId} using ${strategy}`
    );

    return { assigned: unassignedLeads.length };
  }

  // ─── DELETE ──────────────────────────────────────────────────────────────────

  /**
   * Delete a campaign (only draft/cancelled allowed)
   */
  async deleteCampaign(campaignId: string, organizationId: string): Promise<void> {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
      include: { _count: { select: { leads: true } } },
    });
    if (!campaign) throw ApiError.notFound('Campaign not found');

    if (!['draft', 'cancelled'].includes(campaign.status)) {
      throw ApiError.badRequest(
        `Only draft or cancelled campaigns can be deleted. Current status: '${campaign.status}'`
      );
    }

    // Detach leads before deleting
    if (campaign._count.leads > 0) {
      await prisma.lead.updateMany({
        where: { campaignId, organizationId },
        data: { campaignId: null },
      });
    }

    await prisma.campaign.delete({ where: { id: campaignId } });
    logger.info(`Campaign deleted: ${campaignId}`);
  }

  /**
   * Duplicate a campaign (as new draft)
   */
  async duplicateCampaign(
    campaignId: string,
    organizationId: string
  ): Promise<CampaignDetailResponse> {
    const source = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
    });
    if (!source) throw ApiError.notFound('Campaign not found');

    // Generate unique name
    let newName = `${source.name} (Copy)`;
    let counter = 1;
    while (true) {
      const dup = await prisma.campaign.findFirst({
        where: { name: { equals: newName, mode: 'insensitive' }, organizationId },
      });
      if (!dup) break;
      counter++;
      newName = `${source.name} (Copy ${counter})`;
    }

    const newCampaign = await prisma.campaign.create({
      data: {
        name: newName,
        description: source.description,
        type: source.type,
        status: 'draft',
        budget: source.budget,
        formId: source.formId,
        settings: source.settings as object,
        metadata: {
          ...((source.metadata as Record<string, any>) || {}),
          assignedTeamIds: [],
          assignedUserIds: [],
          statusHistory: [{ status: 'draft', changedAt: new Date().toISOString() }],
          duplicatedFrom: campaignId,
        },
        organizationId,
        // Dates deliberately not copied
        startDate: null,
        endDate: null,
      },
      include: {
        form: { select: { id: true, name: true } },
        _count: { select: { leads: true } },
      },
    });

    logger.info(`Campaign duplicated: ${campaignId} → ${newCampaign.id}`);
    return this.getCampaignById(newCampaign.id, organizationId);
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────────

  private async getDetailResponse(
    campaign: any,
    targetAudience: TargetAudience | null,
    organizationId: string
  ): Promise<CampaignDetailResponse> {
    const meta = campaign.metadata as Record<string, any>;

    // Fetch assigned teams
    const teamIds: string[] = meta?.assignedTeamIds || [];
    let assignedTeams: CampaignTeamResponse[] = [];
    if (teamIds.length > 0) {
      const teams = await prisma.team.findMany({
        where: { id: { in: teamIds }, organizationId },
        include: { _count: { select: { members: true } } },
      });
      assignedTeams = teams.map((t) => ({
        teamId: t.id,
        teamName: t.name,
        membersCount: t._count.members,
      }));
    }

    // Fetch assigned users
    const userIds: string[] = meta?.assignedUserIds || [];
    let assignedUsers: CampaignUserResponse[] = [];
    if (userIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: userIds }, organizationId },
        include: { team: { select: { name: true } } },
      });
      assignedUsers = users.map((u) => ({
        userId: u.id,
        userName: `${u.firstName} ${u.lastName}`,
        role: u.role,
        teamName: u.team?.name || null,
      }));
    }

    const stats = await this.getCampaignStats(campaign.id, organizationId);

    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      type: campaign.type,
      status: campaign.status,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      budget: campaign.budget,
      formId: campaign.formId,
      formName: campaign.form?.name || null,
      leadsCount: campaign._count?.leads || 0,
      assignedTeamsCount: assignedTeams.length,
      assignedUsersCount: assignedUsers.length,
      targetAudience: targetAudience || (meta?.targetAudience ?? null),
      settings: (campaign.settings as CampaignSettings) || {},
      metadata: meta || {},
      organizationId: campaign.organizationId,
      assignedTeams,
      assignedUsers,
      stats,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    };
  }

  private formatListResponse(campaign: any): CampaignListResponse {
    const meta = campaign.metadata as Record<string, any>;
    const teamIds: string[] = meta?.assignedTeamIds || [];
    const userIds: string[] = meta?.assignedUserIds || [];

    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      type: campaign.type,
      status: campaign.status,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      budget: campaign.budget,
      formId: campaign.formId,
      formName: campaign.form?.name || null,
      leadsCount: campaign._count?.leads || 0,
      assignedTeamsCount: teamIds.length,
      assignedUsersCount: userIds.length,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    };
  }
}

export const campaignsService = new CampaignsService();