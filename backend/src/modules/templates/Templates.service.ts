import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { ApiError } from '../../utils/api-error';
import { parsePaginationParams, PaginatedResult } from '../../utils/pagination';
import {
  CreateTemplateInput,
  UpdateTemplateInput,
  TemplateFilters,
  TemplateListResponse,
  TemplateDetailResponse,
  TemplatePreviewResponse,
  TemplateSendResult,
  BulkSendResult,
  TemplateSettings,
  TemplateChannel,
} from './Templates.types';

// ─── Variable Handling ────────────────────────────────────────────────────────

/**
 * Extract all {{variable}} placeholders from template content
 */
const extractVariables = (content: string): string[] => {
  const regex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
  const found = new Set<string>();
  let match;
  while ((match = regex.exec(content)) !== null) {
    found.add(match[1]);
  }
  return Array.from(found);
};

/**
 * Render template content by substituting variables
 */
const renderContent = (
  content: string,
  variables: Record<string, string>
): { rendered: string; missingVariables: string[] } => {
  const required = extractVariables(content);
  const missing: string[] = [];
  let rendered = content;

  for (const key of required) {
    if (variables[key] !== undefined) {
      rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), variables[key]);
    } else {
      missing.push(key);
    }
  }

  return { rendered, missingVariables: missing };
};

/**
 * Build variable map from a Lead record
 */
const buildLeadVariables = (lead: any): Record<string, string> => ({
  firstName: lead.firstName || '',
  lastName: lead.lastName || '',
  fullName: `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
  phone: lead.phone || '',
  email: lead.email || '',
  city: lead.city || '',
  state: lead.state || '',
  pincode: lead.pincode || '',
  address: lead.address || '',
  status: lead.status || '',
  priority: lead.priority || '',
  assignedTo: lead.assignedTo
    ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`
    : '',
  createdDate: lead.createdAt
    ? new Date(lead.createdAt).toLocaleDateString('en-IN')
    : '',
});

/**
 * Calculate number of SMS segments (160 chars standard, 153 chars unicode)
 */
const calcSmsSegments = (text: string, unicode = false): number => {
  const limit = unicode ? 70 : 160;
  const multiLimit = unicode ? 67 : 153;
  if (text.length <= limit) return 1;
  return Math.ceil(text.length / multiLimit);
};

// ─── Service ──────────────────────────────────────────────────────────────────

export class TemplatesService {
  // ─── CREATE ─────────────────────────────────────────────────────────────────

  async createTemplate(
    input: CreateTemplateInput,
    organizationId: string
  ): Promise<TemplateDetailResponse> {
    // Duplicate name + channel check
    const existing = await prisma.template.findFirst({
      where: {
        name: { equals: input.name, mode: 'insensitive' },
        channel: input.channel,
        organizationId,
      },
    });
    if (existing) {
      throw ApiError.conflict(
        `A ${input.channel} template named "${input.name}" already exists`
      );
    }

    // Auto-extract variables from content if not provided
    const variables = input.variables?.length
      ? input.variables
      : extractVariables(input.content);

    const template = await prisma.template.create({
      data: {
        name: input.name,
        channel: input.channel,
        category: input.category,
        subject: input.subject ?? null,
        content: input.content,
        description: input.description ?? null,
        variables,
        tags: input.tags || [],
        settings: (input.settings || {}) as unknown as object,
        isActive: true,
        organizationId,
      },
    });

    logger.info(`Template created: ${template.id} [${input.channel}] org: ${organizationId}`);
    return this.formatDetailResponse(template, 0);
  }

  // ─── READ ────────────────────────────────────────────────────────────────────

  async getTemplates(
    organizationId: string,
    filters: TemplateFilters,
    page?: number,
    limit?: number,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResult<TemplateListResponse>> {
    const pagination = parsePaginationParams(page, limit);

    const where: any = { organizationId };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.channel) where.channel = filters.channel;
    if (filters.category) where.category = filters.category;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.tags?.length) where.tags = { hasSome: filters.tags };

    const total = await prisma.template.count({ where });

    const templates = await prisma.template.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: pagination.skip,
      take: pagination.limit,
    });

    // Get usage counts (how many times each template was used in activities)
    const usageCounts = await this.getUsageCounts(
      templates.map((t) => t.id),
      organizationId
    );

    const data = templates.map((t) =>
      this.formatListResponse(t, usageCounts[t.id] || 0)
    );

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

  async getTemplateById(
    templateId: string,
    organizationId: string
  ): Promise<TemplateDetailResponse> {
    const template = await prisma.template.findFirst({
      where: { id: templateId, organizationId },
    });
    if (!template) throw ApiError.notFound('Template not found');

    const usageCount =
      (await this.getUsageCounts([templateId], organizationId))[templateId] || 0;

    return this.formatDetailResponse(template, usageCount);
  }

  // ─── UPDATE ──────────────────────────────────────────────────────────────────

  async updateTemplate(
    templateId: string,
    organizationId: string,
    input: UpdateTemplateInput
  ): Promise<TemplateDetailResponse> {
    const existing = await prisma.template.findFirst({
      where: { id: templateId, organizationId },
    });
    if (!existing) throw ApiError.notFound('Template not found');

    // Duplicate name check if changing name or channel
    const newName = input.name ?? existing.name;
    const newChannel = input.channel ?? existing.channel;

    if (
      (input.name && input.name !== existing.name) ||
      (input.channel && input.channel !== existing.channel)
    ) {
      const dup = await prisma.template.findFirst({
        where: {
          name: { equals: newName, mode: 'insensitive' },
          channel: newChannel,
          organizationId,
          id: { not: templateId },
        },
      });
      if (dup) {
        throw ApiError.conflict(
          `A ${newChannel} template named "${newName}" already exists`
        );
      }
    }

    // Re-extract variables if content changed
    let variables = input.variables;
    if (input.content && !input.variables) {
      variables = extractVariables(input.content);
    }

    // Merge settings
    const mergedSettings = input.settings
      ? { ...(existing.settings as object), ...input.settings }
      : undefined;

    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.channel !== undefined) updateData.channel = input.channel;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.subject !== undefined) updateData.subject = input.subject;
    if (input.content !== undefined) updateData.content = input.content;
    if (input.description !== undefined) updateData.description = input.description;
    if (variables !== undefined) updateData.variables = variables;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (mergedSettings !== undefined) updateData.settings = mergedSettings;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    const template = await prisma.template.update({
      where: { id: templateId },
      data: updateData,
    });

    logger.info(`Template updated: ${templateId}`);
    const usageCount =
      (await this.getUsageCounts([templateId], organizationId))[templateId] || 0;

    return this.formatDetailResponse(template, usageCount);
  }

  // ─── DELETE ──────────────────────────────────────────────────────────────────

  async deleteTemplate(templateId: string, organizationId: string): Promise<void> {
    const template = await prisma.template.findFirst({
      where: { id: templateId, organizationId },
    });
    if (!template) throw ApiError.notFound('Template not found');

    await prisma.template.delete({ where: { id: templateId } });
    logger.info(`Template deleted: ${templateId}`);
  }

  async duplicateTemplate(
    templateId: string,
    organizationId: string
  ): Promise<TemplateDetailResponse> {
    const source = await prisma.template.findFirst({
      where: { id: templateId, organizationId },
    });
    if (!source) throw ApiError.notFound('Template not found');

    // Generate unique name
    let newName = `${source.name} (Copy)`;
    let counter = 1;
    while (true) {
      const dup = await prisma.template.findFirst({
        where: {
          name: { equals: newName, mode: 'insensitive' },
          channel: source.channel,
          organizationId,
        },
      });
      if (!dup) break;
      counter++;
      newName = `${source.name} (Copy ${counter})`;
    }

    const template = await prisma.template.create({
      data: {
        name: newName,
        channel: source.channel,
        category: source.category,
        subject: source.subject,
        content: source.content,
        description: source.description,
        variables: source.variables,
        tags: source.tags,
        settings: source.settings as object,
        isActive: false,   // Duplicates start inactive
        organizationId,
      },
    });

    logger.info(`Template duplicated: ${templateId} → ${template.id}`);
    return this.formatDetailResponse(template, 0);
  }

  // ─── PREVIEW ─────────────────────────────────────────────────────────────────

  async previewTemplate(
    templateId: string,
    organizationId: string,
    sampleData: Record<string, string>
  ): Promise<TemplatePreviewResponse> {
    const template = await prisma.template.findFirst({
      where: { id: templateId, organizationId },
    });
    if (!template) throw ApiError.notFound('Template not found');

    const { rendered, missingVariables } = renderContent(template.content, sampleData);
    const settings = template.settings as TemplateSettings;

    const smsSegments =
      template.channel === 'sms'
        ? calcSmsSegments(rendered, settings?.unicode)
        : null;

    return {
      channel: template.channel as TemplateChannel,
      subject: template.subject,
      rendered,
      charCount: rendered.length,
      smsSegments,
      missingVariables,
    };
  }

  /**
   * Preview template using a real lead's data
   */
  async previewWithLead(
    templateId: string,
    organizationId: string,
    leadId: string
  ): Promise<TemplatePreviewResponse> {
    const [template, lead] = await Promise.all([
      prisma.template.findFirst({ where: { id: templateId, organizationId } }),
      prisma.lead.findFirst({
        where: { id: leadId, organizationId },
        include: { assignedTo: { select: { firstName: true, lastName: true } } },
      }),
    ]);

    if (!template) throw ApiError.notFound('Template not found');
    if (!lead) throw ApiError.notFound('Lead not found');

    const variables = buildLeadVariables(lead);
    const { rendered, missingVariables } = renderContent(template.content, variables);
    const settings = template.settings as TemplateSettings;

    return {
      channel: template.channel as TemplateChannel,
      subject: template.subject
        ? renderContent(template.subject, variables).rendered
        : null,
      rendered,
      charCount: rendered.length,
      smsSegments:
        template.channel === 'sms'
          ? calcSmsSegments(rendered, settings?.unicode)
          : null,
      missingVariables,
    };
  }

  // ─── SEND ────────────────────────────────────────────────────────────────────

  /**
   * Render and "send" template to a single lead.
   * In production: plug in Twilio/SendGrid/WhatsApp API here.
   * Currently logs activity on the lead and returns the rendered message.
   */
  async sendTemplate(
    templateId: string,
    leadId: string,
    organizationId: string,
    sentById: string,
    overrideVariables?: Record<string, string>
  ): Promise<TemplateSendResult> {
    const [template, lead] = await Promise.all([
      prisma.template.findFirst({ where: { id: templateId, organizationId } }),
      prisma.lead.findFirst({
        where: { id: leadId, organizationId },
        include: { assignedTo: { select: { firstName: true, lastName: true } } },
      }),
    ]);

    if (!template) throw ApiError.notFound('Template not found');
    if (!template.isActive) throw ApiError.badRequest('Template is inactive');
    if (!lead) throw ApiError.notFound('Lead not found');

    // Merge auto-resolved + override variables
    const autoVars = buildLeadVariables(lead);
    const variables = { ...autoVars, ...(overrideVariables || {}) };

    const { rendered, missingVariables } = renderContent(template.content, variables);

    if (missingVariables.length > 0) {
      throw ApiError.badRequest(
        `Template has unresolved variables: ${missingVariables.join(', ')}`
      );
    }

    // Determine recipient
    const recipient =
      template.channel === 'email'
        ? lead.email || ''
        : lead.phone;

    if (!recipient) {
      return {
        success: false,
        leadId,
        leadName: `${lead.firstName} ${lead.lastName || ''}`.trim(),
        recipient: '',
        message: `Lead has no ${template.channel === 'email' ? 'email' : 'phone'} on record`,
        sentAt: null,
      };
    }

    try {
      // ── Plug external provider here ───────────────────────────────────────
      // e.g. await twilioClient.messages.create({ to: recipient, body: rendered })
      // e.g. await sgMail.send({ to: recipient, subject: ..., html: rendered })
      // ─────────────────────────────────────────────────────────────────────

      // Log activity on the lead
      const activityTypeMap: Record<string, string> = {
        sms: 'sms',
        email: 'email',
        whatsapp: 'whatsapp',
      };

      await prisma.leadActivity.create({
        data: {
          leadId,
          userId: sentById,
          type: activityTypeMap[template.channel] as any,
          title: `${template.channel.toUpperCase()} sent via template: ${template.name}`,
          description: rendered.slice(0, 500),
          metadata: {
            templateId,
            templateName: template.name,
            channel: template.channel,
            recipient,
            charCount: rendered.length,
          },
        },
      });

      logger.info(
        `Template ${templateId} sent via ${template.channel} to lead ${leadId}`
      );

      return {
        success: true,
        leadId,
        leadName: `${lead.firstName} ${lead.lastName || ''}`.trim(),
        recipient,
        sentAt: new Date(),
      };
    } catch (error: any) {
      logger.error(`Template send failed for lead ${leadId}: ${error.message}`);
      return {
        success: false,
        leadId,
        leadName: `${lead.firstName} ${lead.lastName || ''}`.trim(),
        recipient,
        message: error.message || 'Send failed',
        sentAt: null,
      };
    }
  }

  /**
   * Bulk send a template to multiple leads
   */
  async bulkSendTemplate(
    templateId: string,
    leadIds: string[],
    organizationId: string,
    sentById: string,
    overrideVariables?: Record<string, string>
  ): Promise<BulkSendResult> {
    const template = await prisma.template.findFirst({
      where: { id: templateId, organizationId },
    });
    if (!template) throw ApiError.notFound('Template not found');
    if (!template.isActive) throw ApiError.badRequest('Template is inactive');

    const results: TemplateSendResult[] = [];

    // Process sequentially to avoid DB overwhelm; swap to Promise.allSettled for speed
    for (const leadId of leadIds) {
      const result = await this.sendTemplate(
        templateId,
        leadId,
        organizationId,
        sentById,
        overrideVariables
      );
      results.push(result);
    }

    const sent = results.filter((r) => r.success).length;
    const failed = results.length - sent;

    logger.info(
      `Bulk send complete: template ${templateId}, sent ${sent}/${results.length}`
    );

    return { total: results.length, sent, failed, results };
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────────

  /**
   * Count how many lead activities reference each template
   */
  private async getUsageCounts(
    templateIds: string[],
    _organizationId: string
  ): Promise<Record<string, number>> {
    if (templateIds.length === 0) return {};

    const counts = await prisma.leadActivity.groupBy({
      by: ['metadata'],
      where: {
        metadata: {
          path: ['templateId'],
          string_in: templateIds,
        } as object,
      },
      _count: true,
    });

    // Build a map
    const map: Record<string, number> = {};
    for (const row of counts) {
      const tid = (row.metadata as any)?.templateId;
      if (tid) map[tid] = (map[tid] || 0) + (row._count as number);
    }
    return map;
  }

  private formatListResponse(template: any, usageCount: number): TemplateListResponse {
    return {
      id: template.id,
      name: template.name,
      channel: template.channel,
      category: template.category,
      subject: template.subject,
      description: template.description,
      variables: template.variables || [],
      tags: template.tags || [],
      isActive: template.isActive,
      usageCount,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  private formatDetailResponse(
    template: any,
    usageCount: number
  ): TemplateDetailResponse {
    return {
      ...this.formatListResponse(template, usageCount),
      content: template.content,
      settings: (template.settings as TemplateSettings) || {},
      organizationId: template.organizationId,
    };
  }
}

export const templatesService = new TemplatesService();