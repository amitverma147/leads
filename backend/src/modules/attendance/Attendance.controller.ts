// ─── Controller ───────────────────────────────────────────────────────────────
import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { ApiResponse } from '../../utils/api-response';
import { attendanceService } from './attendance.service';
import { Role } from '../../config/constants';

// ── Check-in / Check-out ─────────────────────────────────────────────────────

/**
 * @swagger
 * /attendance/check-in:
 *   post:
 *     summary: Check in for today
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               address:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Check-in successful with late status
 *       400:
 *         description: Already checked in today
 */
export const checkIn = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const userId = req.user!.userId;
  const organizationId = req.user!.organizationId;
  const result = await attendanceService.checkIn(userId, organizationId, req.body);
  return ApiResponse.success(res, result, result.message);
});

/**
 * @swagger
 * /attendance/check-out:
 *   post:
 *     summary: Check out for today
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               address:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Check-out successful with working hours
 *       400:
 *         description: Not checked in or already checked out
 */
export const checkOut = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const userId = req.user!.userId;
  const organizationId = req.user!.organizationId;
  const result = await attendanceService.checkOut(userId, organizationId, req.body);
  return ApiResponse.success(
    res,
    result,
    `Checked out. Working hours today: ${result.workingHours}h`
  );
});

/**
 * @swagger
 * /attendance/today:
 *   get:
 *     summary: Get today's attendance for current user
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's attendance or null if not started
 */
export const getTodayAttendance = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const attendance = await attendanceService.getTodayAttendance(userId);
    return ApiResponse.success(res, attendance, 'Today attendance retrieved');
  }
);

// ── Records ───────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /attendance:
 *   get:
 *     summary: List attendance records
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: userId
 *         schema: { type: string, format: uuid }
 *         description: Admin/manager only — filter by user
 *       - in: query
 *         name: teamId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: startDate
 *         schema: { type: string }
 *         description: YYYY-MM-DD
 *       - in: query
 *         name: endDate
 *         schema: { type: string }
 *         description: YYYY-MM-DD
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [present, absent, half_day, on_leave, holiday, week_off] }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [date, checkInAt, workingHours] }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: Paginated attendance records
 */
export const getAttendanceRecords = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;
    const userId = req.user!.userId;
    const userRole = req.user!.role as Role;
    const { page, limit, userId: filterUserId, teamId, startDate, endDate, status, sortBy, sortOrder } =
      req.query;

    const result = await attendanceService.getAttendanceRecords(
      organizationId,
      userId,
      userRole,
      {
        userId: filterUserId as string,
        teamId: teamId as string,
        startDate: startDate as unknown as Date,
        endDate: endDate as unknown as Date,
        status: status as any,
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
      'Attendance records retrieved'
    );
  }
);

/**
 * @swagger
 * /attendance/manual:
 *   post:
 *     summary: Create or update attendance manually (admin/manager)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, date, status]
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               date:
 *                 type: string
 *                 example: "2025-01-15"
 *               status:
 *                 type: string
 *                 enum: [present, absent, half_day, on_leave, holiday, week_off]
 *               checkInAt:
 *                 type: string
 *                 format: date-time
 *               checkOutAt:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Attendance record created/updated
 */
export const manualAttendance = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;
    const attendance = await attendanceService.manualAttendance(req.body, organizationId);
    return ApiResponse.success(res, attendance, 'Attendance record updated');
  }
);

// ── Summaries ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /attendance/summary:
 *   get:
 *     summary: Get attendance summary for a user over a date range
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema: { type: string, format: uuid }
 *         description: Defaults to current user
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema: { type: string }
 *         description: YYYY-MM-DD
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema: { type: string }
 *         description: YYYY-MM-DD
 *     responses:
 *       200:
 *         description: Attendance summary with present/absent/late counts
 */
export const getAttendanceSummary = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;
    const userId = req.user!.userId;
    const targetUserId = (req.query.userId as string) || userId;
    const startDate = req.query.startDate as unknown as Date;
    const endDate = req.query.endDate as unknown as Date;

    const summary = await attendanceService.getAttendanceSummary(
      targetUserId,
      organizationId,
      startDate,
      endDate
    );

    return ApiResponse.success(res, summary, 'Attendance summary retrieved');
  }
);

/**
 * @swagger
 * /attendance/team:
 *   get:
 *     summary: Get team attendance for a specific date
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema: { type: string }
 *         description: YYYY-MM-DD (defaults to today)
 *       - in: query
 *         name: teamId
 *         schema: { type: string, format: uuid }
 *         description: Filter by team (defaults to all)
 *     responses:
 *       200:
 *         description: Team-wide attendance status for the day
 */
export const getTeamAttendance = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;
    const { date, teamId } = req.query;

    const summary = await attendanceService.getTeamAttendance(
      organizationId,
      date ? new Date(date as string) : undefined,
      teamId as string
    );

    return ApiResponse.success(res, summary, 'Team attendance retrieved');
  }
);

// ── Leave Requests ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /attendance/leave:
 *   post:
 *     summary: Apply for leave
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, startDate, endDate, reason]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [sick, casual, earned, unpaid, maternity, paternity, bereavement, compensatory]
 *               startDate:
 *                 type: string
 *                 example: "2025-02-10"
 *               endDate:
 *                 type: string
 *                 example: "2025-02-12"
 *               reason:
 *                 type: string
 *               halfDay:
 *                 type: boolean
 *               halfDayPeriod:
 *                 type: string
 *                 enum: [morning, afternoon]
 *     responses:
 *       201:
 *         description: Leave request created (pending approval)
 *       400:
 *         description: Insufficient balance or overlapping leave
 */
export const createLeaveRequest = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const organizationId = req.user!.organizationId;
    const leaveRequest = await attendanceService.createLeaveRequest(
      req.body,
      userId,
      organizationId
    );
    return ApiResponse.created(res, leaveRequest, 'Leave request submitted successfully');
  }
);

/**
 * @swagger
 * /attendance/leave:
 *   get:
 *     summary: List leave requests
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, approved, rejected, cancelled] }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated leave requests
 */
export const getLeaveRequests = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;
    const userId = req.user!.userId;
    const userRole = req.user!.role as Role;
    const { page, limit, userId: filterUserId, status, type, startDate, endDate, sortBy, sortOrder } =
      req.query;

    const result = await attendanceService.getLeaveRequests(
      organizationId,
      userId,
      userRole,
      {
        userId: filterUserId as string,
        status: status as any,
        type: type as any,
        startDate: startDate as unknown as Date,
        endDate: endDate as unknown as Date,
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
      'Leave requests retrieved'
    );
  }
);

/**
 * @swagger
 * /attendance/leave/{id}/review:
 *   post:
 *     summary: Approve or reject a leave request (manager/admin)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Leave reviewed. If approved, attendance records auto-updated.
 */
export const reviewLeaveRequest = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const reviewerId = req.user!.userId;
    const leave = await attendanceService.reviewLeaveRequest(
      id,
      organizationId,
      reviewerId,
      req.body
    );
    const msg =
      req.body.status === 'approved'
        ? 'Leave approved successfully'
        : 'Leave rejected';
    return ApiResponse.success(res, leave, msg);
  }
);

/**
 * @swagger
 * /attendance/leave/{id}/cancel:
 *   post:
 *     summary: Cancel a leave request
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Leave request cancelled
 */
export const cancelLeaveRequest = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const userId = req.user!.userId;
    const leave = await attendanceService.cancelLeaveRequest(id, userId, organizationId);
    return ApiResponse.success(res, leave, 'Leave request cancelled');
  }
);

/**
 * @swagger
 * /attendance/leave/balance:
 *   get:
 *     summary: Get leave balance for current user (or specified user)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema: { type: string, format: uuid }
 *         description: Defaults to current user
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *         description: Defaults to current year
 *     responses:
 *       200:
 *         description: Leave balance for all leave types
 */
export const getLeaveBalance = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const organizationId = req.user!.organizationId;
    const currentUserId = req.user!.userId;
    const targetUserId = (req.query.userId as string) || currentUserId;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;

    const balance = await attendanceService.getLeaveBalance(
      targetUserId,
      organizationId,
      year
    );

    return ApiResponse.success(res, balance, 'Leave balance retrieved');
  }
);