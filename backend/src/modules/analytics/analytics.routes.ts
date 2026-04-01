import { Router } from 'express';
import * as analyticsController from './analytics.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { ROLES } from '../../config/constants';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Only managers and above can access analytics
const analyticsAccess = requireRole(
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.MARKETING_MANAGER,
  ROLES.AGENT_SUPERVISOR
);

router.get('/dashboard', analyticsAccess, analyticsController.getDashboardStats);
router.get('/leads-by-status', analyticsAccess, analyticsController.getLeadsByStatus);
router.get('/leads-by-source', analyticsAccess, analyticsController.getLeadsBySource);
router.get('/leads-by-priority', analyticsAccess, analyticsController.getLeadsByPriority);
router.get('/leads-trend', analyticsAccess, analyticsController.getLeadsTrend);
router.get('/agent-performance', analyticsAccess, analyticsController.getAgentPerformance);
router.get('/top-performers', analyticsAccess, analyticsController.getTopPerformers);
router.get('/conversion-funnel', analyticsAccess, analyticsController.getConversionFunnel);
router.get('/geographic-distribution', analyticsAccess, analyticsController.getGeographicDistribution);

export default router;