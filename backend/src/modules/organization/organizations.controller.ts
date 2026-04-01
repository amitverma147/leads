import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { ApiResponse } from '../../utils/api-response';
import { organizationsService } from './organizations.service';

/**
 * @swagger
 * /organizations/current:
 *   get:
 *     summary: Get current organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organization details
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getCurrentOrganization = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;

    const organization = await organizationsService.getOrganization(organizationId);

    return ApiResponse.success(res, organization, 'Organization retrieved successfully');
  }
);

/**
 * @swagger
 * /organizations/current:
 *   patch:
 *     summary: Update current organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               logo:
 *                 type: string
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Organization updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
export const updateCurrentOrganization = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;

    const organization = await organizationsService.updateOrganization(organizationId, req.body);

    return ApiResponse.success(res, organization, 'Organization updated successfully');
  }
);

/**
 * @swagger
 * /organizations/current/stats:
 *   get:
 *     summary: Get current organization statistics
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organization statistics
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getOrganizationStats = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;

    const stats = await organizationsService.getOrganizationStats(organizationId);

    return ApiResponse.success(res, stats, 'Organization statistics retrieved successfully');
  }
);