import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { ApiResponse } from '../../utils/api-response';
import { teamsService } from './teams.service';

/**
 * @swagger
 * /teams:
 *   post:
 *     summary: Create a new team
 *     tags: [Teams]
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
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [marketing, field]
 *               settings:
 *                 type: object
 *     responses:
 *       201:
 *         description: Team created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         description: Team name already exists
 */
export const createTeam = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const organizationId = req.user!.organizationId;

  const team = await teamsService.createTeam(req.body, organizationId);

  return ApiResponse.created(res, team, 'Team created successfully');
});

/**
 * @swagger
 * /teams:
 *   get:
 *     summary: Get all teams
 *     tags: [Teams]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [marketing, field]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, name]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: List of teams
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getTeams = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const organizationId = req.user!.organizationId;
  const { page, limit, search, type, isActive, sortBy, sortOrder } = req.query;

  const result = await teamsService.getTeams(
    organizationId,
    {
      search: search as string,
      type: type as 'marketing' | 'field',
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
    'Teams retrieved successfully'
  );
});

/**
 * @swagger
 * /teams/{id}:
 *   get:
 *     summary: Get team by ID
 *     tags: [Teams]
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
 *         description: Team details
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const getTeamById = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  const team = await teamsService.getTeamById(id, organizationId);

  return ApiResponse.success(res, team, 'Team retrieved successfully');
});

/**
 * @swagger
 * /teams/{id}:
 *   patch:
 *     summary: Update team
 *     tags: [Teams]
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
 *                 enum: [marketing, field]
 *               settings:
 *                 type: object
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Team updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const updateTeam = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  const team = await teamsService.updateTeam(id, organizationId, req.body);

  return ApiResponse.success(res, team, 'Team updated successfully');
});

/**
 * @swagger
 * /teams/{id}:
 *   delete:
 *     summary: Delete team
 *     tags: [Teams]
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
 *         description: Team deleted successfully
 *       400:
 *         description: Cannot delete team with members
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const deleteTeam = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  await teamsService.deleteTeam(id, organizationId);

  return ApiResponse.success(res, null, 'Team deleted successfully');
});

/**
 * @swagger
 * /teams/{id}/members:
 *   get:
 *     summary: Get team members
 *     tags: [Teams]
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
 *         description: List of team members
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const getTeamMembers = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const members = await teamsService.getTeamMembers(id, organizationId);

    return ApiResponse.success(res, members, 'Team members retrieved successfully');
  }
);

/**
 * @swagger
 * /teams/{id}/members:
 *   post:
 *     summary: Add member to team
 *     tags: [Teams]
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
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Member added successfully
 *       400:
 *         description: User is already in a team
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const addTeamMember = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { userId } = req.body;
    const organizationId = req.user!.organizationId;

    const team = await teamsService.addMember(id, userId, organizationId);

    return ApiResponse.success(res, team, 'Member added successfully');
  }
);

/**
 * @swagger
 * /teams/{id}/members/{userId}:
 *   delete:
 *     summary: Remove member from team
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const removeTeamMember = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id, userId } = req.params;
    const organizationId = req.user!.organizationId;

    const team = await teamsService.removeMember(id, userId, organizationId);

    return ApiResponse.success(res, team, 'Member removed successfully');
  }
);