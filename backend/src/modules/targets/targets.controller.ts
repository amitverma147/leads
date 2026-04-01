import { Request, Response } from 'express';
import { TargetPeriod, TargetType } from '@prisma/client';
import { asyncHandler } from '../../utils/async-handler';
import { ApiResponse } from '../../utils/api-response';
import { targetsService } from './targets.service';

/**
 * @swagger
 * /targets:
 *   post:
 *     summary: Create a new target
 *     tags: [Targets]
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
 *               - period
 *               - value
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [leads_collected, leads_converted, calls_made, revenue, visits, follow_ups]
 *               period:
 *                 type: string
 *                 enum: [daily, weekly, monthly, quarterly]
 *               value:
 *                 type: integer
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Target created successfully
 */
export const createTarget = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;

    const target = await targetsService.createTarget(req.body, organizationId);

    return ApiResponse.created(res, target, 'Target created successfully');
  }
);

/**
 * @swagger
 * /targets:
 *   get:
 *     summary: Get all targets
 *     tags: [Targets]
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
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of targets
 */
export const getTargets = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;
    const { page, limit, search, type, period, isActive, sortBy, sortOrder } = req.query;

    const result = await targetsService.getTargets(
      organizationId,
      {
        search: search as string,
        type: type as TargetType,
        period: period as TargetPeriod,
        isActive: isActive as boolean | undefined,
      },
      page as number,
      limit as number,
      sortBy as string,
      sortOrder as 'asc' | 'desc'
    );

    return ApiResponse.paginated(
      res,
      result.data,
      result.meta.page,
      result.meta.limit,
      result.meta.total,
      'Targets retrieved successfully'
    );
  }
);

/**
 * @swagger
 * /targets/{id}:
 *   get:
 *     summary: Get target by ID
 *     tags: [Targets]
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
 *         description: Target details
 */
export const getTargetById = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const target = await targetsService.getTargetById(id, organizationId);

    return ApiResponse.success(res, target, 'Target retrieved successfully');
  }
);

/**
 * @swagger
 * /targets/{id}:
 *   patch:
 *     summary: Update target
 *     tags: [Targets]
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
 *         description: Target updated successfully
 */
export const updateTarget = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const target = await targetsService.updateTarget(id, organizationId, req.body);

    return ApiResponse.success(res, target, 'Target updated successfully');
  }
);

/**
 * @swagger
 * /targets/{id}:
 *   delete:
 *     summary: Delete target
 *     tags: [Targets]
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
 *         description: Target deleted successfully
 */
export const deleteTarget = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    await targetsService.deleteTarget(id, organizationId);

    return ApiResponse.success(res, null, 'Target deleted successfully');
  }
);

/**
 * @swagger
 * /targets/assign:
 *   post:
 *     summary: Assign target to teams and/or users
 *     tags: [Targets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetId
 *             properties:
 *               targetId:
 *                 type: string
 *                 format: uuid
 *               teamIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               customValue:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Target assigned successfully
 */
export const assignTarget = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;

    const target = await targetsService.assignTarget(req.body, organizationId);

    return ApiResponse.success(res, target, 'Target assigned successfully');
  }
);

/**
 * @swagger
 * /targets/{id}/unassign:
 *   post:
 *     summary: Unassign target from teams and/or users
 *     tags: [Targets]
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
 *               teamIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Target unassigned successfully
 */
export const unassignTarget = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { teamIds, userIds } = req.body;
    const organizationId = req.user!.organizationId;

    const target = await targetsService.unassignTarget(id, organizationId, teamIds, userIds);

    return ApiResponse.success(res, target, 'Target unassigned successfully');
  }
);

/**
 * @swagger
 * /targets/team/{teamId}/performance:
 *   get:
 *     summary: Get team performance
 *     tags: [Targets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Team performance data
 */
export const getTeamPerformance = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { teamId } = req.params;
    const organizationId = req.user!.organizationId;

    const performance = await targetsService.getTeamPerformance(teamId, organizationId);

    return ApiResponse.success(res, performance, 'Team performance retrieved successfully');
  }
);

/**
 * @swagger
 * /targets/user/{userId}/performance:
 *   get:
 *     summary: Get user performance
 *     tags: [Targets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User performance data
 */
export const getUserPerformance = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { userId } = req.params;
    const organizationId = req.user!.organizationId;

    const performance = await targetsService.getUserPerformance(userId, organizationId);

    return ApiResponse.success(res, performance, 'User performance retrieved successfully');
  }
);

/**
 * @swagger
 * /targets/my-performance:
 *   get:
 *     summary: Get current user's performance
 *     tags: [Targets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User performance data
 */
export const getMyPerformance = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const organizationId = req.user!.organizationId;

    const performance = await targetsService.getUserPerformance(userId, organizationId);

    return ApiResponse.success(res, performance, 'Performance retrieved successfully');
  }
);

/**
 * @swagger
 * /targets/leaderboard:
 *   get:
 *     summary: Get leaderboard
 *     tags: [Targets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [leads_collected, leads_converted, calls_made, revenue, visits, follow_ups]
 *       - in: query
 *         name: period
 *         required: true
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, quarterly]
 *       - in: query
 *         name: teamId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Leaderboard data
 */
export const getLeaderboard = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;
    const { type, period, teamId, limit } = req.query;

    const leaderboard = await targetsService.getLeaderboard(
      organizationId,
      type as TargetType,
      period as TargetPeriod,
      teamId as string,
      limit as number
    );

    return ApiResponse.success(res, leaderboard, 'Leaderboard retrieved successfully');
  }
);