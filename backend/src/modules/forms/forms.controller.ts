import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { ApiResponse } from '../../utils/api-response';
import { formsService } from './forms.service';

/**
 * @swagger
 * /forms:
 *   post:
 *     summary: Create a new form
 *     tags: [Forms]
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               fields:
 *                 type: array
 *                 items:
 *                   type: object
 *               settings:
 *                 type: object
 *     responses:
 *       201:
 *         description: Form created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         description: Form name already exists
 */
export const createForm = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const organizationId = req.user!.organizationId;

  const form = await formsService.createForm(req.body, organizationId);

  return ApiResponse.created(res, form, 'Form created successfully');
});

/**
 * @swagger
 * /forms:
 *   get:
 *     summary: Get all forms
 *     tags: [Forms]
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
 *         name: isPublished
 *         schema:
 *           type: boolean
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
 *         description: List of forms
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getForms = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const organizationId = req.user!.organizationId;
  const { page, limit, search, isPublished, isActive, sortBy, sortOrder } = req.query;

  const result = await formsService.getForms(
    organizationId,
    {
      search: search as string,
      isPublished: isPublished as boolean | undefined,
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
    'Forms retrieved successfully'
  );
});

/**
 * @swagger
 * /forms/{id}:
 *   get:
 *     summary: Get form by ID
 *     tags: [Forms]
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
 *         description: Form details
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const getFormById = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  const form = await formsService.getFormById(id, organizationId);

  return ApiResponse.success(res, form, 'Form retrieved successfully');
});

/**
 * @swagger
 * /forms/public/{id}:
 *   get:
 *     summary: Get published form (public access)
 *     tags: [Forms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Form details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const getPublishedForm = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;

    const form = await formsService.getPublishedForm(id);

    return ApiResponse.success(res, form, 'Form retrieved successfully');
  }
);

/**
 * @swagger
 * /forms/{id}:
 *   patch:
 *     summary: Update form
 *     tags: [Forms]
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
 *         description: Form updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const updateForm = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  const form = await formsService.updateForm(id, organizationId, req.body);

  return ApiResponse.success(res, form, 'Form updated successfully');
});

/**
 * @swagger
 * /forms/{id}:
 *   delete:
 *     summary: Delete form
 *     tags: [Forms]
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
 *         description: Form deleted successfully
 *       400:
 *         description: Cannot delete form with associated leads
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const deleteForm = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  await formsService.deleteForm(id, organizationId);

  return ApiResponse.success(res, null, 'Form deleted successfully');
});

/**
 * @swagger
 * /forms/{id}/duplicate:
 *   post:
 *     summary: Duplicate form
 *     tags: [Forms]
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
 *         description: Form duplicated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const duplicateForm = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const form = await formsService.duplicateForm(id, organizationId);

    return ApiResponse.created(res, form, 'Form duplicated successfully');
  }
);

/**
 * @swagger
 * /forms/{id}/toggle-publish:
 *   post:
 *     summary: Publish or unpublish form
 *     tags: [Forms]
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
 *         description: Form publish status toggled
 *       400:
 *         description: Cannot publish form without fields
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const togglePublish = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const form = await formsService.togglePublish(id, organizationId);

    const message = form.isPublished ? 'Form published successfully' : 'Form unpublished successfully';

    return ApiResponse.success(res, form, message);
  }
);