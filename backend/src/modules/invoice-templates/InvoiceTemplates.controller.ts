import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { ApiResponse } from '../../utils/api-response';
import { invoiceTemplatesService } from './InvoiceTemplates.service';

export const createTemplate = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { organizationId, userId: createdById } = req.user!;
  const template = await invoiceTemplatesService.createTemplate(req.body, organizationId, createdById);
  return ApiResponse.created(res, template, 'Invoice template created successfully');
});

export const getTemplates = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { organizationId } = req.user!;
  const { page, limit, search, isActive, sortBy, sortOrder } = req.query;

  const result = await invoiceTemplatesService.getTemplates(
    organizationId,
    { search: search as string, isActive: isActive as boolean | undefined },
    page as unknown as number,
    limit as unknown as number,
    sortBy as string,
    sortOrder as 'asc' | 'desc'
  );

  return ApiResponse.paginated(res, result.data, result.meta.page, result.meta.limit, result.meta.total, 'Invoice templates retrieved successfully');
});

export const getTemplateById = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { organizationId } = req.user!;
  const template = await invoiceTemplatesService.getTemplateById(id, organizationId);
  return ApiResponse.success(res, template, 'Invoice template retrieved successfully');
});

export const updateTemplate = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { organizationId } = req.user!;
  const template = await invoiceTemplatesService.updateTemplate(id, organizationId, req.body);
  return ApiResponse.success(res, template, 'Invoice template updated successfully');
});

export const deleteTemplate = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { organizationId } = req.user!;
  await invoiceTemplatesService.deleteTemplate(id, organizationId);
  return ApiResponse.success(res, null, 'Invoice template deleted successfully');
});

export const duplicateTemplate = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { organizationId, userId: createdById } = req.user!;
  const template = await invoiceTemplatesService.duplicateTemplate(id, organizationId, createdById);
  return ApiResponse.created(res, template, 'Invoice template duplicated successfully');
});
