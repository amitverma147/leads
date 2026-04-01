import { Router } from 'express';
import * as attendanceController from './attendance.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { ROLES } from '../../config/constants';
import {
  checkInSchema,
  checkOutSchema,
  manualAttendanceSchema,
  attendanceListQuerySchema,
  attendanceSummaryQuerySchema,
  teamAttendanceQuerySchema,
  createLeaveRequestSchema,
  reviewLeaveRequestSchema,
  leaveRequestListQuerySchema,
  leaveIdParamSchema,
} from './attendance.validation';

const router = Router();
router.use(authenticate);

const managerPlus = requireRole(
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.MARKETING_MANAGER,
  ROLES.AGENT_SUPERVISOR
);

// ─── Check-in / Check-out ─────────────────────────────────────────────────────
router.post('/check-in',  validate({ body: checkInSchema }),  attendanceController.checkIn);
router.post('/check-out', validate({ body: checkOutSchema }), attendanceController.checkOut);
router.get('/today', attendanceController.getTodayAttendance);

// ─── Records ──────────────────────────────────────────────────────────────────
router.get('/',        validate({ query: attendanceListQuerySchema }), attendanceController.getAttendanceRecords);
router.get('/summary', validate({ query: attendanceSummaryQuerySchema }), attendanceController.getAttendanceSummary);
router.get('/team',    managerPlus, validate({ query: teamAttendanceQuerySchema }), attendanceController.getTeamAttendance);
router.post('/manual', managerPlus, validate({ body: manualAttendanceSchema }), attendanceController.manualAttendance);

// ─── Leave Requests ───────────────────────────────────────────────────────────
router.post('/leave',         validate({ body: createLeaveRequestSchema }),    attendanceController.createLeaveRequest);
router.get('/leave',          validate({ query: leaveRequestListQuerySchema }), attendanceController.getLeaveRequests);
router.get('/leave/balance',  attendanceController.getLeaveBalance);
router.post('/leave/:id/review',  managerPlus, validate({ params: leaveIdParamSchema, body: reviewLeaveRequestSchema }), attendanceController.reviewLeaveRequest);
router.post('/leave/:id/cancel',  validate({ params: leaveIdParamSchema }), attendanceController.cancelLeaveRequest);

export default router;