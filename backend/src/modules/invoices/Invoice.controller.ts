import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { ApiResponse } from '../../utils/api-response';
import { invoiceService } from './Invoice.service';

export const createInvoice = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { organizationId, userId: createdById } = req.user!;
  const invoice = await invoiceService.createInvoice(req.body, organizationId, createdById);
  return ApiResponse.created(res, invoice, 'Invoice created successfully');
});

export const getInvoices = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { organizationId } = req.user!;
  const { page, limit, search, status, customerId, templateId, createdById, dateFrom, dateTo, sortBy, sortOrder } = req.query;

  const result = await invoiceService.getInvoices(
    organizationId,
    {
      search: search as string,
      status: status as any,
      customerId: customerId as string,
      templateId: templateId as string,
      createdById: createdById as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
    },
    page as unknown as number,
    limit as unknown as number,
    sortBy as string,
    sortOrder as 'asc' | 'desc'
  );

  return ApiResponse.paginated(res, result.data, result.meta.page, result.meta.limit, result.meta.total, 'Invoices retrieved successfully');
});

export const getInvoiceById = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { organizationId } = req.user!;
  const invoice = await invoiceService.getInvoiceById(id, organizationId);
  return ApiResponse.success(res, invoice, 'Invoice retrieved successfully');
});

export const updateInvoice = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { organizationId } = req.user!;
  const invoice = await invoiceService.updateInvoice(id, organizationId, req.body);
  return ApiResponse.success(res, invoice, 'Invoice updated successfully');
});

export const getInvoiceStats = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { organizationId } = req.user!;
  const stats = await invoiceService.getInvoiceStats(organizationId);
  return ApiResponse.success(res, stats, 'Invoice stats retrieved successfully');
});

// ─── Customer Controllers ───────────────────────────────────────────────────

export const getCustomers = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { organizationId } = req.user!;
  const { page, limit, search, tags, sortBy, sortOrder } = req.query;

  const tagList = tags ? (tags as string).split(',').map((t) => t.trim()).filter(Boolean) : [];

  const result = await invoiceService.getCustomers(
    organizationId,
    { search: search as string, tags: tagList },
    page as unknown as number,
    limit as unknown as number,
    sortBy as string,
    sortOrder as 'asc' | 'desc'
  );

  return ApiResponse.paginated(res, result.data, result.meta.page, result.meta.limit, result.meta.total, 'Customers retrieved successfully');
});

export const getCustomerById = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { organizationId } = req.user!;
  const customer = await invoiceService.getCustomerById(id, organizationId);
  return ApiResponse.success(res, customer, 'Customer retrieved successfully');
});

export const updateCustomerTags = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { organizationId } = req.user!;
  const { tags } = req.body;
  const customer = await invoiceService.updateCustomerTags(id, organizationId, tags);
  return ApiResponse.success(res, customer, 'Customer tags updated successfully');
});

// ─── Product Catalog Controllers ───────────────────────────────────────────

export const createInvoiceProduct = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { organizationId, userId } = req.user!;
  const product = await invoiceService.createProduct(req.body, organizationId, userId);
  return ApiResponse.created(res, product, 'Invoice product created successfully');
});

export const getInvoiceProducts = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { organizationId } = req.user!;
  const { page, limit, search, isActive, sortBy, sortOrder } = req.query;

  const result = await invoiceService.getProducts(
    organizationId,
    {
      search: search as string,
      isActive: isActive as boolean | undefined,
    },
    page as unknown as number,
    limit as unknown as number,
    sortBy as string,
    sortOrder as 'asc' | 'desc'
  );

  return ApiResponse.paginated(
    res,
    result.data,
    result.meta.page,
    result.meta.limit,
    result.meta.total,
    'Invoice products retrieved successfully'
  );
});

export const updateInvoiceProduct = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { organizationId } = req.user!;
  const product = await invoiceService.updateProduct(id, organizationId, req.body);
  return ApiResponse.success(res, product, 'Invoice product updated successfully');
});

export const deleteInvoiceProduct = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { organizationId } = req.user!;
  await invoiceService.deleteProduct(id, organizationId);
  return ApiResponse.success(res, null, 'Invoice product deleted successfully');
});
