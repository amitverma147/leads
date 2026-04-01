import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { ApiResponse } from '../../utils/api-response';
import { analyticsService } from './analytics.service';

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getDashboardStats = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;

    const stats = await analyticsService.getDashboardStats(organizationId);

    return ApiResponse.success(res, stats, 'Dashboard statistics retrieved successfully');
  }
);

/**
 * @swagger
 * /analytics/leads-by-status:
 *   get:
 *     summary: Get leads grouped by status
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leads by status
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getLeadsByStatus = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;

    const data = await analyticsService.getLeadsByStatus(organizationId);

    return ApiResponse.success(res, data, 'Leads by status retrieved successfully');
  }
);

/**
 * @swagger
 * /analytics/leads-by-source:
 *   get:
 *     summary: Get leads grouped by source
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leads by source
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getLeadsBySource = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;

    const data = await analyticsService.getLeadsBySource(organizationId);

    return ApiResponse.success(res, data, 'Leads by source retrieved successfully');
  }
);

/**
 * @swagger
 * /analytics/leads-by-priority:
 *   get:
 *     summary: Get leads grouped by priority
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leads by priority
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getLeadsByPriority = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;

    const data = await analyticsService.getLeadsByPriority(organizationId);

    return ApiResponse.success(res, data, 'Leads by priority retrieved successfully');
  }
);

/**
 * @swagger
 * /analytics/leads-trend:
 *   get:
 *     summary: Get leads trend over time
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Leads trend data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getLeadsTrend = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;
    const { startDate, endDate } = req.query;

    // Default to last 30 days if not provided
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate
      ? new Date(startDate as string)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const data = await analyticsService.getLeadsTrend(organizationId, {
      startDate: start,
      endDate: end,
    });

    return ApiResponse.success(res, data, 'Leads trend retrieved successfully');
  }
);

/**
 * @swagger
 * /analytics/agent-performance:
 *   get:
 *     summary: Get agent performance metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Agent performance data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getAgentPerformance = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;

    const data = await analyticsService.getAgentPerformance(organizationId);

    return ApiResponse.success(res, data, 'Agent performance retrieved successfully');
  }
);

/**
 * @swagger
 * /analytics/top-performers:
 *   get:
 *     summary: Get top performing users
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Top performers data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getTopPerformers = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;
    const limit = parseInt(req.query.limit as string) || 5;

    const data = await analyticsService.getTopPerformers(organizationId, limit);

    return ApiResponse.success(res, data, 'Top performers retrieved successfully');
  }
);

/**
 * @swagger
 * /analytics/conversion-funnel:
 *   get:
 *     summary: Get conversion funnel data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversion funnel data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getConversionFunnel = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;

    const data = await analyticsService.getConversionFunnel(organizationId);

    return ApiResponse.success(res, data, 'Conversion funnel retrieved successfully');
  }
);

/**
 * @swagger
 * /analytics/geographic-distribution:
 *   get:
 *     summary: Get leads geographic distribution
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Geographic distribution data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getGeographicDistribution = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;
    const limit = parseInt(req.query.limit as string) || 10;

    const data = await analyticsService.getGeographicDistribution(organizationId, limit);

    return ApiResponse.success(res, data, 'Geographic distribution retrieved successfully');
  }
);