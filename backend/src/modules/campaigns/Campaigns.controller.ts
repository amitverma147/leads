import { Request, Response } from 'express';
import { CampaignStatus } from '@prisma/client';
import { asyncHandler } from '../../utils/async-handler';
import { ApiResponse } from '../../utils/api-response';
import { campaignsService } from './Campaigns.service';
import { Role } from '../../config/constants';

// ─── Campaign CRUD ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /campaigns:
 *   post:
 *     summary: Create a new campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Delhi NCR Field Drive - Q1 2025"
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [field_collection, telecalling, email, sms, whatsapp, mixed]
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               budget:
 *                 type: number
 *                 example: 50000
 *               formId:
 *                 type: string
 *                 format: uuid
 *               targetAudience:
 *                 type: object
 *                 properties:
 *                   cities:
 *                     type: array
 *                     items:
 *                       type: string
 *                   states:
 *                     type: array
 *                     items:
 *                       type: string
 *                   pincodes:
 *                     type: array
 *                     items:
 *                       type: string
 *               settings:
 *                 type: object
 *                 properties:
 *                   dailyLeadTarget:
 *                     type: integer
 *                   maxLeadsTotal:
 *                     type: integer
 *                   autoAssign:
 *                     type: boolean
 *                   autoAssignStrategy:
 *                     type: string
 *                     enum: [round_robin, least_loaded, manual]
 *                   requireGeolocation:
 *                     type: boolean
 *                   script:
 *                     type: string
 *               assignedTeamIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               assignedUserIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       201:
 *         description: Campaign created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         description: Campaign name already exists
 */
export const createCampaign = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;
    const campaign = await campaignsService.createCampaign(req.body, organizationId);
    return ApiResponse.created(res, campaign, 'Campaign created successfully');
  }
);

/**
 * @swagger
 * /campaigns:
 *   get:
 *     summary: Get all campaigns with filters
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or description
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [field_collection, telecalling, email, sms, whatsapp, mixed]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Comma-separated statuses e.g. "active,paused"
 *       - in: query
 *         name: formId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, name, startDate, endDate, status]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Paginated list of campaigns
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getCampaigns = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;
    const {
      page,
      limit,
      search,
      type,
      status,
      formId,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await campaignsService.getCampaigns(
      organizationId,
      {
        search: search as string,
        type: type as any,
        status: status as any,
        formId: formId as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
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
      'Campaigns retrieved successfully'
    );
  }
);

/**
 * @swagger
 * /campaigns/{id}:
 *   get:
 *     summary: Get campaign by ID with full details
 *     tags: [Campaigns]
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
 *         description: Campaign detail
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const getCampaignById = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const campaign = await campaignsService.getCampaignById(id, organizationId);
    return ApiResponse.success(res, campaign, 'Campaign retrieved successfully');
  }
);

/**
 * @swagger
 * /campaigns/{id}:
 *   patch:
 *     summary: Update campaign fields
 *     tags: [Campaigns]
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               budget:
 *                 type: number
 *               formId:
 *                 type: string
 *                 format: uuid
 *               targetAudience:
 *                 type: object
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Campaign updated successfully
 *       400:
 *         description: Cannot update completed/cancelled campaign
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const updateCampaign = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const campaign = await campaignsService.updateCampaign(id, organizationId, req.body);
    return ApiResponse.success(res, campaign, 'Campaign updated successfully');
  }
);

/**
 * @swagger
 * /campaigns/{id}:
 *   delete:
 *     summary: Delete campaign (only draft or cancelled)
 *     tags: [Campaigns]
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
 *         description: Campaign deleted successfully
 *       400:
 *         description: Only draft or cancelled campaigns can be deleted
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const deleteCampaign = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    await campaignsService.deleteCampaign(id, organizationId);
    return ApiResponse.success(res, null, 'Campaign deleted successfully');
  }
);

/**
 * @swagger
 * /campaigns/{id}/duplicate:
 *   post:
 *     summary: Duplicate a campaign as a new draft
 *     tags: [Campaigns]
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
 *       201:
 *         description: Campaign duplicated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const duplicateCampaign = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const campaign = await campaignsService.duplicateCampaign(id, organizationId);
    return ApiResponse.created(res, campaign, 'Campaign duplicated successfully');
  }
);

// ─── Status Management ────────────────────────────────────────────────────────

/**
 * @swagger
 * /campaigns/{id}/status:
 *   patch:
 *     summary: Change campaign status
 *     description: |
 *       Allowed transitions:
 *       - draft → active | cancelled
 *       - active → paused | completed | cancelled
 *       - paused → active | cancelled
 *       - completed → (no transitions)
 *       - cancelled → (no transitions)
 *     tags: [Campaigns]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, active, paused, completed, cancelled]
 *               reason:
 *                 type: string
 *                 description: Optional reason for the status change
 *     responses:
 *       200:
 *         description: Campaign status changed successfully
 *       400:
 *         description: Invalid status transition
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const changeCampaignStatus = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const { status, reason } = req.body;

    const campaign = await campaignsService.changeCampaignStatus(
      id,
      organizationId,
      status as CampaignStatus,
      reason
    );

    const messages: Record<string, string> = {
      active: 'Campaign activated successfully',
      paused: 'Campaign paused successfully',
      completed: 'Campaign marked as completed',
      cancelled: 'Campaign cancelled successfully',
      draft: 'Campaign moved back to draft',
    };

    return ApiResponse.success(
      res,
      campaign,
      messages[status] || 'Campaign status updated'
    );
  }
);

// ─── Stats ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /campaigns/{id}/stats:
 *   get:
 *     summary: Get campaign statistics
 *     description: Returns real-time stats including lead counts, conversion rate, top performer, budget tracking etc.
 *     tags: [Campaigns]
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
 *         description: Campaign statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalLeads:
 *                   type: integer
 *                 leadsByStatus:
 *                   type: object
 *                 leadsToday:
 *                   type: integer
 *                 leadsThisWeek:
 *                   type: integer
 *                 conversionRate:
 *                   type: number
 *                 totalCallsMade:
 *                   type: integer
 *                 avgLeadsPerDay:
 *                   type: number
 *                 daysRemaining:
 *                   type: integer
 *                   nullable: true
 *                 budgetSpent:
 *                   type: number
 *                   nullable: true
 *                 budgetRemaining:
 *                   type: number
 *                   nullable: true
 *                 topPerformer:
 *                   type: object
 *                   nullable: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const getCampaignStats = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const stats = await campaignsService.getCampaignStats(id, organizationId);
    return ApiResponse.success(res, stats, 'Campaign statistics retrieved successfully');
  }
);

// ─── Lead Management ──────────────────────────────────────────────────────────

/**
 * @swagger
 * /campaigns/{id}/leads:
 *   get:
 *     summary: Get leads belonging to a campaign
 *     tags: [Campaigns]
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Comma-separated statuses
 *       - in: query
 *         name: assignedToId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, firstName, status, priority, score]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Paginated list of campaign leads
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const getCampaignLeads = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const userId = req.user!.userId;
    const userRole = req.user!.role as Role;
    const {
      page,
      limit,
      search,
      status,
      assignedToId,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await campaignsService.getCampaignLeads(
      id,
      organizationId,
      userId,
      userRole,
      {
        search: search as string,
        status: status as any,
        assignedToId: assignedToId as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
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
      'Campaign leads retrieved successfully'
    );
  }
);

/**
 * @swagger
 * /campaigns/{id}/leads:
 *   post:
 *     summary: Add existing leads to a campaign
 *     tags: [Campaigns]
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
 *               - leadIds
 *             properties:
 *               leadIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 maxItems: 500
 *     responses:
 *       200:
 *         description: Leads added (reports added vs skipped counts)
 *       400:
 *         description: Cannot add leads to completed/cancelled campaign
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const addLeadsToCampaign = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const { leadIds } = req.body;

    const result = await campaignsService.addLeadsToCampaign(
      id,
      organizationId,
      leadIds
    );

    return ApiResponse.success(
      res,
      result,
      `${result.added} lead(s) added to campaign, ${result.skipped} skipped`
    );
  }
);

/**
 * @swagger
 * /campaigns/{id}/leads/remove:
 *   post:
 *     summary: Remove leads from a campaign
 *     tags: [Campaigns]
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
 *               - leadIds
 *             properties:
 *               leadIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Leads removed from campaign
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const removeLeadsFromCampaign = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const { leadIds } = req.body;

    const result = await campaignsService.removeLeadsFromCampaign(
      id,
      organizationId,
      leadIds
    );

    return ApiResponse.success(
      res,
      result,
      `${result.removed} lead(s) removed from campaign`
    );
  }
);

/**
 * @swagger
 * /campaigns/{id}/auto-assign:
 *   post:
 *     summary: Auto-assign unassigned campaign leads to assigned users
 *     description: |
 *       Distributes all unassigned leads in the campaign among assigned users.
 *       Strategy is taken from campaign settings (round_robin or least_loaded).
 *       Campaign must be active and must have users assigned.
 *     tags: [Campaigns]
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
 *         description: Returns count of leads assigned
 *       400:
 *         description: Campaign not active or no users assigned
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const autoAssignLeads = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const result = await campaignsService.autoAssignLeads(id, organizationId);
    return ApiResponse.success(
      res,
      result,
      `${result.assigned} lead(s) auto-assigned successfully`
    );
  }
);

// ─── Team / User Assignment ───────────────────────────────────────────────────

/**
 * @swagger
 * /campaigns/{id}/teams:
 *   post:
 *     summary: Assign teams to a campaign
 *     tags: [Campaigns]
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
 *               - teamIds
 *             properties:
 *               teamIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Teams assigned successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const assignTeams = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const { teamIds } = req.body;
    const campaign = await campaignsService.assignTeams(id, organizationId, teamIds);
    return ApiResponse.success(res, campaign, 'Teams assigned to campaign successfully');
  }
);

/**
 * @swagger
 * /campaigns/{id}/teams/remove:
 *   post:
 *     summary: Remove teams from a campaign
 *     tags: [Campaigns]
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
 *               - teamIds
 *             properties:
 *               teamIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Teams removed from campaign
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const removeTeams = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const { teamIds } = req.body;
    const campaign = await campaignsService.removeTeams(id, organizationId, teamIds);
    return ApiResponse.success(res, campaign, 'Teams removed from campaign');
  }
);

/**
 * @swagger
 * /campaigns/{id}/users:
 *   post:
 *     summary: Assign users to a campaign
 *     tags: [Campaigns]
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
 *               - userIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Users assigned to campaign
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const assignUsers = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const { userIds } = req.body;
    const campaign = await campaignsService.assignUsers(id, organizationId, userIds);
    return ApiResponse.success(res, campaign, 'Users assigned to campaign successfully');
  }
);

/**
 * @swagger
 * /campaigns/{id}/users/remove:
 *   post:
 *     summary: Remove users from a campaign
 *     tags: [Campaigns]
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
 *               - userIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Users removed from campaign
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const removeUsers = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const { userIds } = req.body;
    const campaign = await campaignsService.removeUsers(id, organizationId, userIds);
    return ApiResponse.success(res, campaign, 'Users removed from campaign');
  }
);