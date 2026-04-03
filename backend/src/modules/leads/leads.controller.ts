import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { ApiResponse } from '../../utils/api-response';
import { leadsService } from './leads.service';
import { Role } from '../../config/constants';

/**
 * @swagger
 * /leads:
 *   post:
 *     summary: Create a new lead
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLeadRequest'
 *     responses:
 *       201:
 *         description: Lead created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         description: Duplicate phone number
 */
export const createLead = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const organizationId = req.user!.organizationId;
  const createdById = req.user!.userId;
  const deviceInfo = {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  };

  const lead = await leadsService.createLead(
    req.body,
    organizationId,
    createdById,
    deviceInfo,
    req.ip
  );

  return ApiResponse.created(res, lead, 'Lead created successfully');
});

/**
 * @swagger
 * /leads:
 *   get:
 *     summary: Get all leads
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Comma-separated list of statuses
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *       - in: query
 *         name: assignedToId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, firstName, status, priority, score]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: List of leads
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getLeads = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const organizationId = req.user!.organizationId;
  const userId = req.user!.userId;
  const userRole = req.user!.role as Role;

  const {
    page,
    limit,
    search,
    status,
    source,
    priority,
    assignedToId,
    createdById,
    formId,
    tags,
    dateFrom,
    dateTo,
    hasFollowUp,
    sortBy,
    sortOrder,
  } = req.query;

  const result = await leadsService.getLeads(
    organizationId,
    userId,
    userRole,
    {
      search: search as string,
      status: status as any,
      source: source as any,
      priority: priority as any,
      assignedToId: assignedToId as string,
      createdById: createdById as string,
      formId: formId as string,
      tags: tags as string[],
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      hasFollowUp: hasFollowUp as boolean | undefined,
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
    'Leads retrieved successfully'
  );
});

/**
 * @swagger
 * /leads/stats:
 *   get:
 *     summary: Get lead statistics
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lead statistics
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getLeadStats = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const organizationId = req.user!.organizationId;

  const stats = await leadsService.getLeadStats(organizationId);

  return ApiResponse.success(res, stats, 'Lead statistics retrieved successfully');
});

/**
 * @swagger
 * /leads/{id}:
 *   get:
 *     summary: Get lead by ID
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lead details
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const getLeadById = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;
  const userId = req.user!.userId;
  const userRole = req.user!.role as Role;

  const lead = await leadsService.getLeadById(id, organizationId, userId, userRole);

  return ApiResponse.success(res, lead, 'Lead retrieved successfully');
});

/**
 * @swagger
 * /leads/{id}:
 *   patch:
 *     summary: Update lead
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Lead updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const updateLead = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;
  const userId = req.user!.userId;
  const userRole = req.user!.role as Role;

  const lead = await leadsService.updateLead(id, organizationId, userId, userRole, req.body);

  return ApiResponse.success(res, lead, 'Lead updated successfully');
});

/**
 * @swagger
 * /leads/{id}:
 *   delete:
 *     summary: Delete lead
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lead deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const deleteLead = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  await leadsService.deleteLead(id, organizationId);

  return ApiResponse.success(res, null, 'Lead deleted successfully');
});

/**
 * @swagger
 * /leads/{id}/activities:
 *   post:
 *     summary: Add activity to lead
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - title
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [call, email, sms, whatsapp, meeting, note]
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Activity added successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const addActivity = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;
  const userId = req.user!.userId;

  const activity = await leadsService.addActivity(id, organizationId, userId, req.body);

  return ApiResponse.created(res, activity, 'Activity added successfully');
});

/**
 * @swagger
 * /leads/{id}/activities:
 *   get:
 *     summary: Get lead activities
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lead activities
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const getLeadActivities = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { page, limit } = req.query;
    const organizationId = req.user!.organizationId;

    const result = await leadsService.getLeadActivities(
      id,
      organizationId,
      page as unknown as number,
      limit as unknown as number
    );

    return ApiResponse.paginated(
      res,
      result.data,
      result.meta.page,
      result.meta.limit,
      result.meta.total,
      'Activities retrieved successfully'
    );
  }
);

/**
 * @swagger
 * /leads/bulk/assign:
 *   post:
 *     summary: Bulk assign leads
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leadIds
 *               - assignedToId
 *             properties:
 *               leadIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               assignedToId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Leads assigned successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
export const bulkAssign = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const organizationId = req.user!.organizationId;
  const userId = req.user!.userId;

  const result = await leadsService.bulkAssign(req.body, organizationId, userId);

  return ApiResponse.success(res, result, `${result.updated} leads assigned successfully`);
});

/**
 * @swagger
 * /leads/bulk/status:
 *   post:
 *     summary: Bulk update lead status
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leadIds
 *               - status
 *             properties:
 *               leadIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               status:
 *                 type: string
 *                 enum: [new, contacted, qualified, negotiation, converted, lost, invalid, junk]
 *     responses:
 *       200:
 *         description: Lead statuses updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
export const bulkUpdateStatus = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;
    const userId = req.user!.userId;

    const result = await leadsService.bulkUpdateStatus(req.body, organizationId, userId);

    return ApiResponse.success(res, result, `${result.updated} leads updated successfully`);
  }
);