import { Router } from 'express';
import * as campaignsController from './Campaigns.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin, requireRole } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { ROLES } from '../../config/constants';
import {
  createCampaignSchema,
  updateCampaignSchema,
  campaignIdParamSchema,
  campaignListQuerySchema,
  campaignLeadsQuerySchema,
  addLeadsSchema,
  removeLeadsSchema,
  assignTeamsSchema,
  assignUsersSchema,
  changeCampaignStatusSchema,
} from './Campaigns.validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Roles allowed to view campaigns
const canViewCampaigns = requireRole(
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.MARKETING_MANAGER,
  ROLES.AGENT_SUPERVISOR,
  ROLES.MARKETING_AGENT,
  ROLES.FIELD_AGENT
);

// Roles allowed to manage campaigns (create, update, delete, assign)
const canManageCampaigns = requireRole(
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.MARKETING_MANAGER
);

// ─── Campaign CRUD ────────────────────────────────────────────────────────────

router.post(
  '/',
  canManageCampaigns,
  validate({ body: createCampaignSchema }),
  campaignsController.createCampaign
);

router.get(
  '/',
  canViewCampaigns,
  validate({ query: campaignListQuerySchema }),
  campaignsController.getCampaigns
);

router.get(
  '/:id',
  canViewCampaigns,
  validate({ params: campaignIdParamSchema }),
  campaignsController.getCampaignById
);

router.patch(
  '/:id',
  canManageCampaigns,
  validate({ params: campaignIdParamSchema, body: updateCampaignSchema }),
  campaignsController.updateCampaign
);

router.delete(
  '/:id',
  requireAdmin,                                   // Only admin can delete
  validate({ params: campaignIdParamSchema }),
  campaignsController.deleteCampaign
);

router.post(
  '/:id/duplicate',
  canManageCampaigns,
  validate({ params: campaignIdParamSchema }),
  campaignsController.duplicateCampaign
);

// ─── Status Management ────────────────────────────────────────────────────────

router.patch(
  '/:id/status',
  canManageCampaigns,
  validate({
    params: campaignIdParamSchema,
    body: changeCampaignStatusSchema,
  }),
  campaignsController.changeCampaignStatus
);

// ─── Stats ────────────────────────────────────────────────────────────────────

router.get(
  '/:id/stats',
  canViewCampaigns,
  validate({ params: campaignIdParamSchema }),
  campaignsController.getCampaignStats
);

// ─── Lead Management ──────────────────────────────────────────────────────────

router.get(
  '/:id/leads',
  canViewCampaigns,
  validate({ params: campaignIdParamSchema, query: campaignLeadsQuerySchema }),
  campaignsController.getCampaignLeads
);

router.post(
  '/:id/leads',
  canManageCampaigns,
  validate({ params: campaignIdParamSchema, body: addLeadsSchema }),
  campaignsController.addLeadsToCampaign
);

router.post(
  '/:id/leads/remove',
  canManageCampaigns,
  validate({ params: campaignIdParamSchema, body: removeLeadsSchema }),
  campaignsController.removeLeadsFromCampaign
);

router.post(
  '/:id/auto-assign',
  canManageCampaigns,
  validate({ params: campaignIdParamSchema }),
  campaignsController.autoAssignLeads
);

// ─── Team / User Assignment ───────────────────────────────────────────────────

router.post(
  '/:id/teams',
  canManageCampaigns,
  validate({ params: campaignIdParamSchema, body: assignTeamsSchema }),
  campaignsController.assignTeams
);

router.post(
  '/:id/teams/remove',
  canManageCampaigns,
  validate({ params: campaignIdParamSchema, body: assignTeamsSchema }),
  campaignsController.removeTeams
);

router.post(
  '/:id/users',
  canManageCampaigns,
  validate({ params: campaignIdParamSchema, body: assignUsersSchema }),
  campaignsController.assignUsers
);

router.post(
  '/:id/users/remove',
  canManageCampaigns,
  validate({ params: campaignIdParamSchema, body: assignUsersSchema }),
  campaignsController.removeUsers
);

export default router;