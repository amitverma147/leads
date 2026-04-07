import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import {
  LeadStatus,
  LeadSource,
  LeadPriority,
  LEAD_STATUS,
  LEAD_SOURCE,
  LEAD_PRIORITY,
  FIELD_TYPES,
  ROLES,
  Role,
} from '../../config/constants';
import { ApiError } from '../../utils/api-error';
import { parsePaginationParams, PaginatedResult } from '../../utils/pagination';
import {
  CreateLeadInput,
  UpdateLeadInput,
  LeadFilters,
  LeadListResponse,
  LeadDetailResponse,
  AddActivityInput,
  LeadActivityResponse,
  LeadStatsResponse,
  BulkAssignInput,
  BulkUpdateStatusInput,
} from './leads.types';

export class LeadsService {
  /**
   * Create a new lead
   */
  async createLead(
    input: CreateLeadInput,
    organizationId: string,
    createdById: string,
    deviceInfo?: Record<string, any>,
    ipAddress?: string
  ): Promise<LeadDetailResponse> {
    // Check for duplicate phone in organization
    const existingLead = await prisma.lead.findFirst({
      where: {
        phone: input.phone,
        organizationId,
      },
    });

    if (existingLead) {
      throw ApiError.conflict('A lead with this phone number already exists');
    }

    // Validate form if provided
    if (input.formId) {
      const form = await prisma.form.findFirst({
        where: {
          id: input.formId,
          organizationId,
          isActive: true,
        },
        select: {
          id: true,
          fields: true,
        },
      });

      if (!form) {
        throw ApiError.notFound('Form not found');
      }

      this.validateFormSubmissionData(form.fields as Record<string, any>[], input.formData || {});
    }

    // Validate assignee if provided
    if (input.assignedToId) {
      const assignee = await prisma.user.findFirst({
        where: {
          id: input.assignedToId,
          organizationId,
          isActive: true,
        },
      });

      if (!assignee) {
        throw ApiError.notFound('Assigned user not found');
      }
    }

    // Calculate initial lead score
    const score = this.calculateLeadScore(input);

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        alternatePhone: input.alternatePhone,
        source: input.source || LEAD_SOURCE.FIELD_COLLECTION,
        priority: input.priority || LEAD_PRIORITY.MEDIUM,
        score,
        formId: input.formId,
        formData: input.formData || {},
        notes: input.notes,
        tags: input.tags || [],
        latitude: input.latitude,
        longitude: input.longitude,
        address: input.address,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        deviceInfo: deviceInfo || {},
        ipAddress,
        organizationId,
        createdById,
        assignedToId: input.assignedToId,
      },
      include: {
        form: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { activities: true } },
      },
    });

    // Create activity for lead creation
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        userId: createdById,
        type: 'note',
        title: 'Lead Created',
        description: `Lead was created via ${lead.source}`,
        metadata: { source: lead.source },
      },
    });

    logger.info(`Lead created: ${lead.id} by user: ${createdById}`);

    return this.formatLeadDetailResponse(lead);
  }

  private validateFormSubmissionData(
    formFields: Record<string, any>[],
    formData: Record<string, any>
  ): void {
    if (!Array.isArray(formFields)) return;

    for (const field of formFields) {
      if (!field || typeof field !== 'object') continue;

      const fieldId = String(field.id ?? '');
      if (!fieldId) continue;

      const fieldType = String(field.type ?? '');
      const fieldLabel = String(field.label ?? fieldId);
      const isRequired =
        fieldType === FIELD_TYPES.LOCATION ||
        field.required === true ||
        field.validation?.required === true;

      const value = formData[fieldId];

      if (isRequired && fieldType === FIELD_TYPES.LOCATION) {
        if (!this.hasValidLocationPayload(value)) {
          throw ApiError.badRequest(
            `Location is required for "${fieldLabel}". Please allow browser location access before submitting.`
          );
        }
        continue;
      }

      if (isRequired && this.isEmptyFormFieldValue(value)) {
        throw ApiError.badRequest(`Field "${fieldLabel}" is required`);
      }
    }
  }

  private isEmptyFormFieldValue(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    return false;
  }

  private hasValidLocationPayload(value: unknown): boolean {
    if (!value || typeof value !== 'object') return false;

    const source = value as {
      latitude?: unknown;
      longitude?: unknown;
      lat?: unknown;
      lng?: unknown;
      coords?: { latitude?: unknown; longitude?: unknown };
    };

    const latitudeRaw = source.latitude ?? source.lat ?? source.coords?.latitude;
    const longitudeRaw = source.longitude ?? source.lng ?? source.coords?.longitude;

    const latitude = Number(latitudeRaw);
    const longitude = Number(longitudeRaw);

    return (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  }

  /**
   * Get all leads with pagination and filters
   */
  async getLeads(
    organizationId: string,
    userId: string,
    userRole: Role,
    filters: LeadFilters,
    page?: number,
    limit?: number,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResult<LeadListResponse>> {
    const pagination = parsePaginationParams(page, limit);

    // Build where clause
    const where: any = {
      organizationId,
    };

    // Role-based filtering
    if (userRole === ROLES.FIELD_AGENT) {
      where.createdById = userId;
    } else if (userRole === ROLES.MARKETING_AGENT) {
      where.assignedToId = userId;
    }
    // Managers and admins can see all leads

    // Search
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
      ];
    }

    // Status filter
    if (filters.status) {
      where.status = Array.isArray(filters.status)
        ? { in: filters.status }
        : filters.status;
    }

    // Source filter
    if (filters.source) {
      where.source = Array.isArray(filters.source)
        ? { in: filters.source }
        : filters.source;
    }

    // Priority filter
    if (filters.priority) {
      where.priority = Array.isArray(filters.priority)
        ? { in: filters.priority }
        : filters.priority;
    }

    // Assigned to filter
    if (filters.assignedToId) {
      where.assignedToId = filters.assignedToId;
    }

    // Created by filter
    if (filters.createdById) {
      where.createdById = filters.createdById;
    }

    // Form filter
    if (filters.formId) {
      where.formId = filters.formId;
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    // Follow up filter
    if (filters.hasFollowUp !== undefined) {
      if (filters.hasFollowUp) {
        where.followUpAt = { not: null };
      } else {
        where.followUpAt = null;
      }
    }

    // Get total count
    const total = await prisma.lead.count({ where });

    // Get leads
    const leads = await prisma.lead.findMany({
      where,
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: pagination.skip,
      take: pagination.limit,
    });

    const formattedLeads = leads.map((lead) => this.formatLeadListResponse(lead));

    return {
      data: formattedLeads,
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
   * Get lead by ID
   */
  async getLeadById(
    leadId: string,
    organizationId: string,
    userId: string,
    userRole: Role
  ): Promise<LeadDetailResponse> {
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        organizationId,
      },
      include: {
        form: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { activities: true } },
      },
    });

    if (!lead) {
      throw ApiError.notFound('Lead not found');
    }

    // Check access based on role
    if (userRole === ROLES.FIELD_AGENT && lead.createdById !== userId) {
      throw ApiError.forbidden('You do not have access to this lead');
    }

    if (userRole === ROLES.MARKETING_AGENT && lead.assignedToId !== userId) {
      throw ApiError.forbidden('You do not have access to this lead');
    }

    return this.formatLeadDetailResponse(lead);
  }

  /**
   * Update lead
   */
  async updateLead(
    leadId: string,
    organizationId: string,
    userId: string,
    userRole: Role,
    input: UpdateLeadInput
  ): Promise<LeadDetailResponse> {
    // Get existing lead
    const existingLead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        organizationId,
      },
    });

    if (!existingLead) {
      throw ApiError.notFound('Lead not found');
    }

    // Check access
    if (userRole === ROLES.FIELD_AGENT && existingLead.createdById !== userId) {
      throw ApiError.forbidden('You do not have access to this lead');
    }

    if (userRole === ROLES.MARKETING_AGENT && existingLead.assignedToId !== userId) {
      throw ApiError.forbidden('You do not have access to this lead');
    }

    // Check phone uniqueness if changing
    if (input.phone && input.phone !== existingLead.phone) {
      const duplicatePhone = await prisma.lead.findFirst({
        where: {
          phone: input.phone,
          organizationId,
          id: { not: leadId },
        },
      });

      if (duplicatePhone) {
        throw ApiError.conflict('A lead with this phone number already exists');
      }
    }

    // Validate assignee if changing
    if (input.assignedToId && input.assignedToId !== existingLead.assignedToId) {
      const assignee = await prisma.user.findFirst({
        where: {
          id: input.assignedToId,
          organizationId,
          isActive: true,
        },
      });

      if (!assignee) {
        throw ApiError.notFound('Assigned user not found');
      }
    }

    // Prepare update data
    const updateData: any = { ...input };

    // Handle status change timestamps
    if (input.status && input.status !== existingLead.status) {
      if (input.status === LEAD_STATUS.CONTACTED && !existingLead.contactedAt) {
        updateData.contactedAt = new Date();
      }
      if (input.status === LEAD_STATUS.CONVERTED && !existingLead.convertedAt) {
        updateData.convertedAt = new Date();
      }
    }

    // Update lead
    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
      include: {
        form: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { activities: true } },
      },
    });

    // Create activity for status change
    if (input.status && input.status !== existingLead.status) {
      await prisma.leadActivity.create({
        data: {
          leadId,
          userId,
          type: 'status_change',
          title: 'Status Changed',
          description: `Status changed from ${existingLead.status} to ${input.status}`,
          metadata: {
            oldStatus: existingLead.status,
            newStatus: input.status,
          },
        },
      });
    }

    // Create activity for assignment change
    if (input.assignedToId && input.assignedToId !== existingLead.assignedToId) {
      await prisma.leadActivity.create({
        data: {
          leadId,
          userId,
          type: 'assignment',
          title: 'Lead Assigned',
          description: 'Lead was assigned to a new user',
          metadata: {
            previousAssignee: existingLead.assignedToId,
            newAssignee: input.assignedToId,
          },
        },
      });
    }

    logger.info(`Lead updated: ${leadId} by user: ${userId}`);

    return this.formatLeadDetailResponse(lead);
  }

  /**
   * Delete lead
   */
  async deleteLead(
    leadId: string,
    organizationId: string
  ): Promise<void> {
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        organizationId,
      },
    });

    if (!lead) {
      throw ApiError.notFound('Lead not found');
    }

    await prisma.lead.delete({
      where: { id: leadId },
    });

    logger.info(`Lead deleted: ${leadId}`);
  }

  /**
   * Add activity to lead
   */
  async addActivity(
    leadId: string,
    organizationId: string,
    userId: string,
    input: AddActivityInput
  ): Promise<LeadActivityResponse> {
    // Verify lead exists
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        organizationId,
      },
    });

    if (!lead) {
      throw ApiError.notFound('Lead not found');
    }

    // Create activity
    const activity = await prisma.leadActivity.create({
      data: {
        leadId,
        userId,
        type: input.type as any,
        title: input.title,
        description: input.description,
        metadata: input.metadata || {},
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return this.formatActivityResponse(activity);
  }

  /**
   * Get lead activities
   */
  async getLeadActivities(
    leadId: string,
    organizationId: string,
    page?: number,
    limit?: number
  ): Promise<PaginatedResult<LeadActivityResponse>> {
    const pagination = parsePaginationParams(page, limit);

    // Verify lead exists
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        organizationId,
      },
    });

    if (!lead) {
      throw ApiError.notFound('Lead not found');
    }

    const total = await prisma.leadActivity.count({
      where: { leadId },
    });

    const activities = await prisma.leadActivity.findMany({
      where: { leadId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    const formattedActivities = activities.map((a) => this.formatActivityResponse(a));

    return {
      data: formattedActivities,
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
   * Bulk assign leads
   */
  async bulkAssign(
    input: BulkAssignInput,
    organizationId: string,
    userId: string
  ): Promise<{ updated: number }> {
    // Verify assignee exists
    const assignee = await prisma.user.findFirst({
      where: {
        id: input.assignedToId,
        organizationId,
        isActive: true,
      },
    });

    if (!assignee) {
      throw ApiError.notFound('Assigned user not found');
    }

    // Update leads
    const result = await prisma.lead.updateMany({
      where: {
        id: { in: input.leadIds },
        organizationId,
      },
      data: {
        assignedToId: input.assignedToId,
      },
    });

    // Create activities for each lead
    await prisma.leadActivity.createMany({
      data: input.leadIds.map((leadId) => ({
        leadId,
        userId,
        type: 'assignment' as any,
        title: 'Lead Assigned (Bulk)',
        description: `Lead was bulk assigned to ${assignee.firstName} ${assignee.lastName}`,
        metadata: { newAssignee: input.assignedToId },
      })),
    });

    logger.info(`Bulk assigned ${result.count} leads to user: ${input.assignedToId}`);

    return { updated: result.count };
  }

  /**
   * Bulk update lead status
   */
  async bulkUpdateStatus(
    input: BulkUpdateStatusInput,
    organizationId: string,
    userId: string
  ): Promise<{ updated: number }> {
    // Get current status of leads
    const leads = await prisma.lead.findMany({
      where: {
        id: { in: input.leadIds },
        organizationId,
      },
      select: { id: true, status: true },
    });

    // Update leads
    const updateData: any = { status: input.status };

    if (input.status === LEAD_STATUS.CONTACTED) {
      updateData.contactedAt = new Date();
    }
    if (input.status === LEAD_STATUS.CONVERTED) {
      updateData.convertedAt = new Date();
    }

    const result = await prisma.lead.updateMany({
      where: {
        id: { in: input.leadIds },
        organizationId,
      },
      data: updateData,
    });

    // Create activities for status changes
    const activities = leads.map((lead) => ({
      leadId: lead.id,
      userId,
      type: 'status_change' as any,
      title: 'Status Changed (Bulk)',
      description: `Status changed from ${lead.status} to ${input.status}`,
      metadata: {
        oldStatus: lead.status,
        newStatus: input.status,
      },
    }));

    await prisma.leadActivity.createMany({ data: activities });

    logger.info(`Bulk updated ${result.count} leads to status: ${input.status}`);

    return { updated: result.count };
  }

  /**
   * Get lead statistics
   */
  async getLeadStats(organizationId: string): Promise<LeadStatsResponse> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get total count
    const total = await prisma.lead.count({
      where: { organizationId },
    });

    // Get counts by status
    const statusCounts = await prisma.lead.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: true,
    });

    // Get counts by source
    const sourceCounts = await prisma.lead.groupBy({
      by: ['source'],
      where: { organizationId },
      _count: true,
    });

    // Get counts by priority
    const priorityCounts = await prisma.lead.groupBy({
      by: ['priority'],
      where: { organizationId },
      _count: true,
    });

    // Get time-based counts
    const [todayCount, thisWeekCount, thisMonthCount] = await Promise.all([
      prisma.lead.count({
        where: {
          organizationId,
          createdAt: { gte: startOfDay },
        },
      }),
      prisma.lead.count({
        where: {
          organizationId,
          createdAt: { gte: startOfWeek },
        },
      }),
      prisma.lead.count({
        where: {
          organizationId,
          createdAt: { gte: startOfMonth },
        },
      }),
    ]);

    // Format response
    const byStatus = Object.values(LEAD_STATUS).reduce((acc, status) => {
      acc[status] = statusCounts.find((s) => s.status === status)?._count || 0;
      return acc;
    }, {} as Record<LeadStatus, number>);

    const bySource = Object.values(LEAD_SOURCE).reduce((acc, source) => {
      acc[source] = sourceCounts.find((s) => s.source === source)?._count || 0;
      return acc;
    }, {} as Record<LeadSource, number>);

    const byPriority = Object.values(LEAD_PRIORITY).reduce((acc, priority) => {
      acc[priority] = priorityCounts.find((p) => p.priority === priority)?._count || 0;
      return acc;
    }, {} as Record<LeadPriority, number>);

    return {
      total,
      byStatus,
      bySource,
      byPriority,
      todayCount,
      thisWeekCount,
      thisMonthCount,
    };
  }

  /**
   * Calculate lead score based on input data
   */
  private calculateLeadScore(input: CreateLeadInput): number {
    let score = 50; // Base score

    // Email provided
    if (input.email) score += 10;

    // Priority boost
    if (input.priority === LEAD_PRIORITY.HIGH) score += 15;
    if (input.priority === LEAD_PRIORITY.URGENT) score += 25;

    // Location data provided
    if (input.latitude && input.longitude) score += 5;
    if (input.address) score += 5;

    // Form data completeness
    if (input.formData) {
      const fieldCount = Object.keys(input.formData).length;
      score += Math.min(fieldCount * 2, 10);
    }

    // Notes provided
    if (input.notes) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Format lead list response
   */
  private formatLeadListResponse(lead: any): LeadListResponse {
    return {
      id: lead.id,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      status: lead.status as LeadStatus,
      source: lead.source as LeadSource,
      priority: lead.priority as LeadPriority,
      score: lead.score,
      tags: lead.tags,
      city: lead.city,
      state: lead.state,
      assignedToId: lead.assignedToId,
      assignedToName: lead.assignedTo
        ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`
        : null,
      createdById: lead.createdById,
      createdByName: `${lead.createdBy.firstName} ${lead.createdBy.lastName}`,
      followUpAt: lead.followUpAt,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    };
  }

  /**
   * Format lead detail response
   */
  private formatLeadDetailResponse(lead: any): LeadDetailResponse {
    return {
      ...this.formatLeadListResponse(lead),
      alternatePhone: lead.alternatePhone,
      formId: lead.formId,
      formName: lead.form?.name || null,
      formData: lead.formData as Record<string, any>,
      notes: lead.notes,
      latitude: lead.latitude,
      longitude: lead.longitude,
      address: lead.address,
      pincode: lead.pincode,
      locationData: lead.locationData as Record<string, any> | null,
      deviceInfo: lead.deviceInfo as Record<string, any> | null,
      ipAddress: lead.ipAddress,
      contactedAt: lead.contactedAt,
      convertedAt: lead.convertedAt,
      activitiesCount: lead._count?.activities || 0,
    };
  }

  /**
   * Format activity response
   */
  private formatActivityResponse(activity: any): LeadActivityResponse {
    return {
      id: activity.id,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      metadata: activity.metadata as Record<string, any>,
      userId: activity.userId,
      userName: `${activity.user.firstName} ${activity.user.lastName}`,
      createdAt: activity.createdAt,
    };
  }
}

export const leadsService = new LeadsService();
