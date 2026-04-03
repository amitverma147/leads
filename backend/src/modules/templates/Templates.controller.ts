import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { ApiResponse } from '../../utils/api-response';
import { templatesService } from './Templates.service';

// ─── CRUD ─────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /templates:
 *   post:
 *     summary: Create a new message template
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, channel, category, content]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Welcome New Lead"
 *               channel:
 *                 type: string
 *                 enum: [sms, email, whatsapp]
 *               category:
 *                 type: string
 *                 enum: [lead_followup, lead_introduction, appointment_reminder, status_update, welcome, promotional, feedback, general]
 *               subject:
 *                 type: string
 *                 description: Required for email channel
 *               content:
 *                 type: string
 *                 description: "Template body. Use {{variableName}} for dynamic values. Available vars: firstName, lastName, fullName, phone, email, city, state, pincode, address, status, priority, assignedTo, createdDate"
 *                 example: "Hi {{firstName}}, thank you for your interest! Our agent {{assignedTo}} will contact you on {{phone}} shortly."
 *               description:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               settings:
 *                 type: object
 *     responses:
 *       201:
 *         description: Template created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         description: Template with same name+channel already exists
 */
export const createTemplate = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;
    const template = await templatesService.createTemplate(req.body, organizationId);
    return ApiResponse.created(res, template, 'Template created successfully');
  }
);

/**
 * @swagger
 * /templates:
 *   get:
 *     summary: List templates with filters
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: channel
 *         schema: { type: string, enum: [sms, email, whatsapp] }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: tags
 *         schema: { type: string }
 *         description: Comma-separated tags
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [createdAt, updatedAt, name, channel, category] }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: Paginated list of templates
 */
export const getTemplates = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;
    const { page, limit, search, channel, category, isActive, tags, sortBy, sortOrder } =
      req.query;

    const result = await templatesService.getTemplates(
      organizationId,
      {
        search: search as string,
        channel: channel as any,
        category: category as any,
        isActive: isActive as boolean | undefined,
        tags: tags as string[] | undefined,
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
      'Templates retrieved successfully'
    );
  }
);

/**
 * @swagger
 * /templates/{id}:
 *   get:
 *     summary: Get template by ID
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Template detail with full content
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const getTemplateById = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const template = await templatesService.getTemplateById(id, organizationId);
    return ApiResponse.success(res, template, 'Template retrieved successfully');
  }
);

/**
 * @swagger
 * /templates/{id}:
 *   patch:
 *     summary: Update a template
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Template updated
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const updateTemplate = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const template = await templatesService.updateTemplate(id, organizationId, req.body);
    return ApiResponse.success(res, template, 'Template updated successfully');
  }
);

/**
 * @swagger
 * /templates/{id}:
 *   delete:
 *     summary: Delete a template
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Template deleted
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const deleteTemplate = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    await templatesService.deleteTemplate(id, organizationId);
    return ApiResponse.success(res, null, 'Template deleted successfully');
  }
);

/**
 * @swagger
 * /templates/{id}/duplicate:
 *   post:
 *     summary: Duplicate a template as inactive copy
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Template duplicated
 */
export const duplicateTemplate = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const template = await templatesService.duplicateTemplate(id, organizationId);
    return ApiResponse.created(res, template, 'Template duplicated successfully');
  }
);

// ─── Preview ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /templates/preview:
 *   post:
 *     summary: Preview template with sample variable data
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [templateId, sampleData]
 *             properties:
 *               templateId:
 *                 type: string
 *                 format: uuid
 *               sampleData:
 *                 type: object
 *                 example: { "firstName": "John", "city": "Delhi" }
 *     responses:
 *       200:
 *         description: Rendered preview with missing variable report
 */
export const previewTemplate = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;
    const { templateId, sampleData } = req.body;

    const preview = await templatesService.previewTemplate(
      templateId,
      organizationId,
      sampleData
    );
    return ApiResponse.success(res, preview, 'Template preview generated');
  }
);

/**
 * @swagger
 * /templates/preview/lead/{leadId}:
 *   post:
 *     summary: Preview template using a real lead's data
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [templateId]
 *             properties:
 *               templateId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Rendered preview using lead data
 */
export const previewWithLead = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { leadId } = req.params;
    const organizationId = req.user!.organizationId;
    const { templateId } = req.body;

    const preview = await templatesService.previewWithLead(
      templateId,
      organizationId,
      leadId
    );
    return ApiResponse.success(res, preview, 'Template preview generated');
  }
);

// ─── Send ─────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /templates/send:
 *   post:
 *     summary: Send a template to a single lead
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [templateId, leadId]
 *             properties:
 *               templateId:
 *                 type: string
 *                 format: uuid
 *               leadId:
 *                 type: string
 *                 format: uuid
 *               overrideVariables:
 *                 type: object
 *                 description: Override auto-resolved variables
 *                 example: { "assignedTo": "Amit Kumar" }
 *     responses:
 *       200:
 *         description: Send result with success/failure info
 */
export const sendTemplate = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;
    const sentById = req.user!.userId;
    const { templateId, leadId, overrideVariables } = req.body;

    const result = await templatesService.sendTemplate(
      templateId,
      leadId,
      organizationId,
      sentById,
      overrideVariables
    );

    const message = result.success
      ? 'Template sent successfully'
      : `Send failed: ${result.message}`;

    return ApiResponse.success(res, result, message);
  }
);

/**
 * @swagger
 * /templates/send/bulk:
 *   post:
 *     summary: Send a template to multiple leads (max 200)
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [templateId, leadIds]
 *             properties:
 *               templateId:
 *                 type: string
 *                 format: uuid
 *               leadIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 maxItems: 200
 *               overrideVariables:
 *                 type: object
 *     responses:
 *       200:
 *         description: Bulk send result with per-lead status
 */
export const bulkSendTemplate = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;
    const sentById = req.user!.userId;
    const { templateId, leadIds, overrideVariables } = req.body;

    const result = await templatesService.bulkSendTemplate(
      templateId,
      leadIds,
      organizationId,
      sentById,
      overrideVariables
    );

    return ApiResponse.success(
      res,
      result,
      `Bulk send complete: ${result.sent}/${result.total} sent`
    );
  }
);