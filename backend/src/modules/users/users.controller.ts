import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { ApiResponse } from '../../utils/api-response';
import { usersService } from './users.service';
import { Role } from '../../config/constants';

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, marketing_manager, marketing_agent, agent_supervisor, field_agent]
 *               teamId:
 *                 type: string
 *                 format: uuid
 *               reportingToId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       409:
 *         description: Email or phone already exists
 */
export const createUser = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const organizationId = req.user!.organizationId;
  const createdByRole = req.user!.role as Role;

  const user = await usersService.createUser(req.body, organizationId, createdByRole);

  return ApiResponse.created(res, user, 'User created successfully');
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
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
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, marketing_manager, marketing_agent, agent_supervisor, field_agent]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: teamId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, firstName, lastName, email, lastLoginAt]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getUsers = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const organizationId = req.user!.organizationId;
  const { page, limit, search, role, isActive, teamId, sortBy, sortOrder } = req.query;

  const result = await usersService.getUsers(
    organizationId,
    {
      search: search as string,
      role: role as Role,
      isActive: isActive as boolean | undefined,
      teamId: teamId as string,
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
    'Users retrieved successfully'
  );
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
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
 *         description: User details
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const getUserById = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  const user = await usersService.getUserById(id, organizationId);

  return ApiResponse.success(res, user, 'User retrieved successfully');
});

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update user
 *     tags: [Users]
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
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               avatar:
 *                 type: string
 *               role:
 *                 type: string
 *               teamId:
 *                 type: string
 *               reportingToId:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const updateUser = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;
  const updatedByRole = req.user!.role as Role;

  const user = await usersService.updateUser(id, organizationId, req.body, updatedByRole);

  return ApiResponse.success(res, user, 'User updated successfully');
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete (deactivate) user
 *     tags: [Users]
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
 *         description: User deactivated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  await usersService.deleteUser(id, organizationId);

  return ApiResponse.success(res, null, 'User deactivated successfully');
});

/**
 * @swagger
 * /users/{id}/activate:
 *   post:
 *     summary: Activate user
 *     tags: [Users]
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
 *         description: User activated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const activateUser = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  const user = await usersService.activateUser(id, organizationId);

  return ApiResponse.success(res, user, 'User activated successfully');
});