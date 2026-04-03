import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { ApiError } from '../../utils/api-error';
import { parsePaginationParams, PaginatedResult } from '../../utils/pagination';
import {
  CreateFormInput,
  UpdateFormInput,
  FormField,
  FormListResponse,
  FormDetailResponse,
} from './forms.types';

export class FormsService {
  /**
   * Create a new form
   */
  async createForm(input: CreateFormInput, organizationId: string): Promise<FormDetailResponse> {
    const { name, description, fields, settings } = input;

    // Check for duplicate form name in organization
    const existingForm = await prisma.form.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        organizationId,
      },
    });

    if (existingForm) {
      throw ApiError.conflict('A form with this name already exists');
    }

    // Validate field IDs are unique
    if (fields && fields.length > 0) {
      const fieldIds = fields.map((f) => f.id);
      const uniqueFieldIds = new Set(fieldIds);
      if (fieldIds.length !== uniqueFieldIds.size) {
        throw ApiError.badRequest('Field IDs must be unique');
      }
    }

    // Create form
    const form = await prisma.form.create({
      data: {
        name,
        description,
        fields: (fields || []) as unknown as object[],
        settings: settings || {},
        organizationId,
      },
      include: {
        _count: { select: { leads: true } },
      },
    });

    logger.info(`Form created: ${form.id} in organization: ${organizationId}`);

    return this.formatFormDetailResponse(form);
  }

  /**
   * Get all forms with pagination and filters
   */
  async getForms(
    organizationId: string,
    filters: {
      search?: string;
      isPublished?: boolean;
      isActive?: boolean;
    },
    page?: number,
    limit?: number,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResult<FormListResponse>> {
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

    if (filters.isPublished !== undefined) {
      where.isPublished = filters.isPublished;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    // Get total count
    const total = await prisma.form.count({ where });

    // Get forms
    const forms = await prisma.form.findMany({
      where,
      include: {
        _count: { select: { leads: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: pagination.skip,
      take: pagination.limit,
    });

    const formattedForms = forms.map((form) => this.formatFormListResponse(form));

    return {
      data: formattedForms,
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
   * Get form by ID
   */
  async getFormById(formId: string, organizationId: string): Promise<FormDetailResponse> {
    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        organizationId,
      },
      include: {
        _count: { select: { leads: true } },
      },
    });

    if (!form) {
      throw ApiError.notFound('Form not found');
    }

    return this.formatFormDetailResponse(form);
  }

  /**
   * Get published form by ID (for public access)
   */
  async getPublishedForm(formId: string): Promise<FormDetailResponse> {
    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        isPublished: true,
        isActive: true,
      },
      include: {
        _count: { select: { leads: true } },
      },
    });

    if (!form) {
      throw ApiError.notFound('Form not found or not published');
    }

    return this.formatFormDetailResponse(form);
  }

  /**
   * Update form
   */
  async updateForm(
    formId: string,
    organizationId: string,
    input: UpdateFormInput
  ): Promise<FormDetailResponse> {
    // Check if form exists
    const existingForm = await prisma.form.findFirst({
      where: {
        id: formId,
        organizationId,
      },
    });

    if (!existingForm) {
      throw ApiError.notFound('Form not found');
    }

    // Check for duplicate name if changing
    if (input.name && input.name !== existingForm.name) {
      const duplicateName = await prisma.form.findFirst({
        where: {
          name: { equals: input.name, mode: 'insensitive' },
          organizationId,
          id: { not: formId },
        },
      });

      if (duplicateName) {
        throw ApiError.conflict('A form with this name already exists');
      }
    }

    // Validate field IDs are unique
    if (input.fields && input.fields.length > 0) {
      const fieldIds = input.fields.map((f) => f.id);
      const uniqueFieldIds = new Set(fieldIds);
      if (fieldIds.length !== uniqueFieldIds.size) {
        throw ApiError.badRequest('Field IDs must be unique');
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.fields !== undefined) updateData.fields = input.fields;
    if (input.settings !== undefined) updateData.settings = input.settings;
    if (input.isPublished !== undefined) updateData.isPublished = input.isPublished;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    // Increment version if fields are changed
    if (input.fields !== undefined) {
      updateData.version = existingForm.version + 1;
    }

    // Update form
    const form = await prisma.form.update({
      where: { id: formId },
      data: updateData,
      include: {
        _count: { select: { leads: true } },
      },
    });

    logger.info(`Form updated: ${formId}`);

    return this.formatFormDetailResponse(form);
  }

  /**
   * Delete form
   */
  async deleteForm(formId: string, organizationId: string): Promise<void> {
    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        organizationId,
      },
      include: {
        _count: { select: { leads: true } },
      },
    });

    if (!form) {
      throw ApiError.notFound('Form not found');
    }

    // Check if form has associated leads
    if (form._count.leads > 0) {
      throw ApiError.badRequest(
        `Cannot delete form with ${form._count.leads} associated leads. Deactivate the form instead.`
      );
    }

    await prisma.form.delete({
      where: { id: formId },
    });

    logger.info(`Form deleted: ${formId}`);
  }

  /**
   * Duplicate form
   */
  async duplicateForm(formId: string, organizationId: string): Promise<FormDetailResponse> {
    const existingForm = await prisma.form.findFirst({
      where: {
        id: formId,
        organizationId,
      },
    });

    if (!existingForm) {
      throw ApiError.notFound('Form not found');
    }

    // Generate new name
    let newName = `${existingForm.name} (Copy)`;
    let counter = 1;

    while (true) {
      const duplicate = await prisma.form.findFirst({
        where: {
          name: { equals: newName, mode: 'insensitive' },
          organizationId,
        },
      });

      if (!duplicate) break;

      counter++;
      newName = `${existingForm.name} (Copy ${counter})`;
    }

    // Create duplicate
    const form = await prisma.form.create({
      data: {
        name: newName,
        description: existingForm.description,
        fields: existingForm.fields as any,
        settings: existingForm.settings as any,
        organizationId,
        isPublished: false,
        isActive: true,
        version: 1,
      },
      include: {
        _count: { select: { leads: true } },
      },
    });

    logger.info(`Form duplicated: ${formId} -> ${form.id}`);

    return this.formatFormDetailResponse(form);
  }

  /**
   * Publish/Unpublish form
   */
  async togglePublish(formId: string, organizationId: string): Promise<FormDetailResponse> {
    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        organizationId,
      },
    });

    if (!form) {
      throw ApiError.notFound('Form not found');
    }

    // Validate form has fields before publishing
    const fields = form.fields as unknown as FormField[];
    if (!form.isPublished && (!fields || fields.length === 0)) {
      throw ApiError.badRequest('Cannot publish a form without fields');
    }

    const updatedForm = await prisma.form.update({
      where: { id: formId },
      data: { isPublished: !form.isPublished },
      include: {
        _count: { select: { leads: true } },
      },
    });

    logger.info(`Form ${updatedForm.isPublished ? 'published' : 'unpublished'}: ${formId}`);

    return this.formatFormDetailResponse(updatedForm);
  }

  /**
   * Format form list response
   */
  private formatFormListResponse(form: any): FormListResponse {
    const fields = form.fields as unknown as FormField[];

    return {
      id: form.id,
      name: form.name,
      description: form.description,
      fieldsCount: fields?.length || 0,
      isPublished: form.isPublished,
      isActive: form.isActive,
      leadsCount: form._count?.leads || 0,
      version: form.version,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
    };
  }

  /**
   * Format form detail response
   */
  private formatFormDetailResponse(form: any): FormDetailResponse {
    return {
      ...this.formatFormListResponse(form),
      fields: (form.fields as unknown as FormField[]) || [],
      settings: (form.settings as Record<string, any>) || {},
      organizationId: form.organizationId,
    };
  }
}

export const formsService = new FormsService();