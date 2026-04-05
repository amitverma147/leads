import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { ApiError } from '../../utils/api-error';
import { parsePaginationParams, PaginatedResult } from '../../utils/pagination';
import {
  CreateInvoiceTemplateInput,
  UpdateInvoiceTemplateInput,
  InvoiceTemplateField,
  InvoiceTemplateSettings,
  InvoiceTemplateListResponse,
  InvoiceTemplateDetailResponse,
} from './InvoiceTemplates.types';

export class InvoiceTemplatesService {
  async createTemplate(
    input: CreateInvoiceTemplateInput,
    organizationId: string,
    createdById: string
  ): Promise<InvoiceTemplateDetailResponse> {
    const existing = await prisma.invoiceTemplate.findFirst({
      where: { name: { equals: input.name, mode: 'insensitive' }, organizationId },
    });
    if (existing) throw ApiError.conflict('An invoice template with this name already exists');

    if (input.fields && input.fields.length > 0) {
      const ids = input.fields.map((f) => f.id);
      if (ids.length !== new Set(ids).size) throw ApiError.badRequest('Field IDs must be unique');
    }

    const template = await prisma.invoiceTemplate.create({
      data: {
        name: input.name,
        description: input.description,
        fields: (input.fields ?? []) as unknown as object[],
        settings: (input.settings ?? {}) as object,
        organizationId,
        createdById,
      },
    });

    logger.info(`InvoiceTemplate created: ${template.id} by user: ${createdById}`);
    return this.formatDetail(template);
  }

  async getTemplates(
    organizationId: string,
    filters: { search?: string; isActive?: boolean },
    page?: number,
    limit?: number,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResult<InvoiceTemplateListResponse>> {
    const pagination = parsePaginationParams(page, limit);
    const where: Record<string, unknown> = { organizationId };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    const [total, templates] = await Promise.all([
      prisma.invoiceTemplate.count({ where }),
      prisma.invoiceTemplate.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: pagination.skip,
        take: pagination.limit,
      }),
    ]);

    return {
      data: templates.map((t) => this.formatList(t)),
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
  ): Promise<InvoiceTemplateDetailResponse> {
    const template = await prisma.invoiceTemplate.findFirst({
      where: { id: templateId, organizationId },
    });
    if (!template) throw ApiError.notFound('Invoice template not found');
    return this.formatDetail(template);
  }

  async updateTemplate(
    templateId: string,
    organizationId: string,
    input: UpdateInvoiceTemplateInput
  ): Promise<InvoiceTemplateDetailResponse> {
    const existing = await prisma.invoiceTemplate.findFirst({
      where: { id: templateId, organizationId },
    });
    if (!existing) throw ApiError.notFound('Invoice template not found');

    if (input.name && input.name !== existing.name) {
      const dup = await prisma.invoiceTemplate.findFirst({
        where: {
          name: { equals: input.name, mode: 'insensitive' },
          organizationId,
          id: { not: templateId },
        },
      });
      if (dup) throw ApiError.conflict('An invoice template with this name already exists');
    }

    if (input.fields && input.fields.length > 0) {
      const ids = input.fields.map((f) => f.id);
      if (ids.length !== new Set(ids).size) throw ApiError.badRequest('Field IDs must be unique');
    }

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.settings !== undefined) updateData.settings = input.settings;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.fields !== undefined) {
      updateData.fields = input.fields;
      updateData.version = existing.version + 1;
    }

    const template = await prisma.invoiceTemplate.update({
      where: { id: templateId },
      data: updateData,
    });

    logger.info(`InvoiceTemplate updated: ${templateId}`);
    return this.formatDetail(template);
  }

  async deleteTemplate(templateId: string, organizationId: string): Promise<void> {
    const template = await prisma.invoiceTemplate.findFirst({
      where: { id: templateId, organizationId },
      include: { _count: { select: { invoices: true } } },
    });
    if (!template) throw ApiError.notFound('Invoice template not found');
    if (template._count.invoices > 0) {
      throw ApiError.badRequest(
        `Cannot delete template with ${template._count.invoices} associated invoices. Deactivate it instead.`
      );
    }

    await prisma.invoiceTemplate.delete({ where: { id: templateId } });
    logger.info(`InvoiceTemplate deleted: ${templateId}`);
  }

  async duplicateTemplate(
    templateId: string,
    organizationId: string,
    createdById: string
  ): Promise<InvoiceTemplateDetailResponse> {
    const src = await prisma.invoiceTemplate.findFirst({
      where: { id: templateId, organizationId },
    });
    if (!src) throw ApiError.notFound('Invoice template not found');

    let newName = `${src.name} (Copy)`;
    let counter = 1;
    while (true) {
      const dup = await prisma.invoiceTemplate.findFirst({
        where: { name: { equals: newName, mode: 'insensitive' }, organizationId },
      });
      if (!dup) break;
      counter++;
      newName = `${src.name} (Copy ${counter})`;
    }

    const template = await prisma.invoiceTemplate.create({
      data: {
        name: newName,
        description: src.description,
        fields: src.fields as object[],
        settings: src.settings as object,
        isActive: true,
        version: 1,
        organizationId,
        createdById,
      },
    });

    logger.info(`InvoiceTemplate duplicated: ${templateId} -> ${template.id}`);
    return this.formatDetail(template);
  }

  // ─── Formatters ──────────────────────────────────────────────────────────────

  private formatList(t: any): InvoiceTemplateListResponse {
    const fields = (t.fields as InvoiceTemplateField[]) ?? [];
    return {
      id: t.id,
      name: t.name,
      description: t.description,
      fieldsCount: fields.length,
      isActive: t.isActive,
      version: t.version,
      settings: (t.settings as InvoiceTemplateSettings) ?? {},
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    };
  }

  private formatDetail(t: any): InvoiceTemplateDetailResponse {
    return {
      ...this.formatList(t),
      fields: (t.fields as InvoiceTemplateField[]) ?? [],
      organizationId: t.organizationId,
      createdById: t.createdById,
    };
  }
}

export const invoiceTemplatesService = new InvoiceTemplatesService();
