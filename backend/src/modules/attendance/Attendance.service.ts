import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { ApiError } from '../../utils/api-error';
import { parsePaginationParams, PaginatedResult } from '../../utils/pagination';
import { startOfDay, endOfDay } from '../../utils/date';
import { ROLES, Role } from '../../config/constants';
import {
  CheckInInput,
  CheckOutInput,
  ManualAttendanceInput,
  CreateLeaveRequestInput,
  ReviewLeaveRequestInput,
  AttendanceFilters,
  LeaveRequestFilters,
  AttendanceResponse,
  CheckInResponse,
  CheckOutResponse,
  AttendanceSummaryResponse,
  TeamAttendanceSummaryResponse,
  MemberAttendanceStatus,
  LeaveRequestResponse,
  LeaveBalanceResponse,
  LocationData,
  AttendanceStatus,
  LeaveType,
  LeaveStatus,
  DEFAULT_LEAVE_ENTITLEMENTS,
} from './Attendance.types';

// ─── Constants ────────────────────────────────────────────────────────────────

const WORK_START_HOUR = 9;
const WORK_START_MINUTE = 0;
const LATE_GRACE_MINUTES = 15;   // 9:15 AM is still "on time"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const calcWorkingHours = (checkIn: Date, checkOut: Date): number => {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.round((ms / (1000 * 60 * 60)) * 100) / 100;
};

const calcWorkingMinutes = (checkIn: Date, checkOut: Date): number => {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / 60000);
};

const isLateCheckIn = (checkInAt: Date): { isLate: boolean; lateByMinutes: number } => {
  const threshold = new Date(checkInAt);
  threshold.setHours(WORK_START_HOUR, WORK_START_MINUTE + LATE_GRACE_MINUTES, 0, 0);
  const lateByMs = checkInAt.getTime() - threshold.getTime();
  return {
    isLate: lateByMs > 0,
    lateByMinutes: Math.max(0, Math.round(lateByMs / 60000)),
  };
};

const businessDaysBetween = (start: Date, end: Date): number => {
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;  // Exclude Sun (0) and Sat (6)
    current.setDate(current.getDate() + 1);
  }
  return count;
};

const countLeaveDays = (start: Date, end: Date, halfDay: boolean): number => {
  const days = businessDaysBetween(start, end);
  return halfDay ? 0.5 : days;
};

// ─── Service ──────────────────────────────────────────────────────────────────

export class AttendanceService {
  // ─── CHECK-IN / CHECK-OUT ────────────────────────────────────────────────────

  /**
   * Check in for today
   */
  async checkIn(
    userId: string,
    organizationId: string,
    input: CheckInInput
  ): Promise<CheckInResponse> {
    const today = new Date();
    const todayDate = new Date(today.toDateString()); // midnight

    // Cannot check in if already checked in today
    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date: todayDate } },
    });

    if (existing?.checkInAt) {
      throw ApiError.badRequest('You have already checked in today');
    }

    const now = new Date();
    const { isLate, lateByMinutes } = isLateCheckIn(now);

    const checkInLocation: LocationData = {
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address,
    };

    let attendance;

    if (existing) {
      // Record exists (created manually by admin) — update it
      attendance = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkInAt: now,
          checkInLocation: checkInLocation as any,
          status: 'present',
        },
      });
    } else {
      attendance = await prisma.attendance.create({
        data: {
          userId,
          date: todayDate,
          checkInAt: now,
          checkInLocation: checkInLocation as any,
          status: 'present',
          notes: input.notes,
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    logger.info(`User ${userId} checked in at ${now.toISOString()}${isLate ? ` (late by ${lateByMinutes}m)` : ''}`);

    return {
      attendance: this.formatAttendance(attendance, user),
      message: isLate
        ? `Checked in successfully (${lateByMinutes} minutes late)`
        : 'Checked in successfully — on time!',
      isLate,
      lateByMinutes,
    };
  }

  /**
   * Check out for today
   */
  async checkOut(
    userId: string,
    organizationId: string,
    input: CheckOutInput
  ): Promise<CheckOutResponse> {
    const todayDate = new Date(new Date().toDateString());

    const attendance = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date: todayDate } },
    });

    if (!attendance) {
      throw ApiError.badRequest('You have not checked in today');
    }

    if (!attendance.checkInAt) {
      throw ApiError.badRequest('No check-in record found for today');
    }

    if (attendance.checkOutAt) {
      throw ApiError.badRequest('You have already checked out today');
    }

    const now = new Date();
    const workingHours = calcWorkingHours(attendance.checkInAt, now);
    const workingMinutes = calcWorkingMinutes(attendance.checkInAt, now);

    const checkOutLocation: LocationData = {
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address,
    };

    // Determine status based on hours
    const status: AttendanceStatus =
      workingHours >= 4 && workingHours < 6.5 ? 'half_day' : 'present';

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutAt: now,
        checkOutLocation: checkOutLocation as any,
        workingHours,
        status,
        notes: input.notes || attendance.notes,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    logger.info(`User ${userId} checked out. Working hours: ${workingHours}`);

    return {
      attendance: this.formatAttendance(updated, user),
      workingHours,
      workingMinutes,
    };
  }

  /**
   * Get today's attendance for current user
   */
  async getTodayAttendance(userId: string): Promise<AttendanceResponse | null> {
    const todayDate = new Date(new Date().toDateString());

    const attendance = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date: todayDate } },
    });

    if (!attendance) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    return this.formatAttendance(attendance, user);
  }

  // ─── ATTENDANCE RECORDS ───────────────────────────────────────────────────────

  /**
   * List attendance records with filters
   */
  async getAttendanceRecords(
    organizationId: string,
    userId: string,
    userRole: Role,
    filters: AttendanceFilters,
    page?: number,
    limit?: number,
    sortBy = 'date',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResult<AttendanceResponse>> {
    const pagination = parsePaginationParams(page, limit);

    const where: any = {};

    // Role-based scoping
    if (userRole === ROLES.FIELD_AGENT || userRole === ROLES.MARKETING_AGENT) {
      where.userId = userId;
    } else if (filters.userId) {
      // Admin/manager can filter by specific user
      const targetUser = await prisma.user.findFirst({
        where: { id: filters.userId, organizationId },
      });
      if (!targetUser) throw ApiError.notFound('User not found');
      where.userId = filters.userId;
    } else if (filters.teamId) {
      const teamMembers = await prisma.user.findMany({
        where: { teamId: filters.teamId, organizationId },
        select: { id: true },
      });
      where.userId = { in: teamMembers.map((m) => m.id) };
    } else {
      // Scope to org
      where.user = { organizationId };
    }

    if (filters.status) where.status = filters.status;

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    const total = await prisma.attendance.count({ where });

    const records = await prisma.attendance.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: pagination.skip,
      take: pagination.limit,
    });

    const data = records.map((r) => this.formatAttendance(r, r.user));

    return {
      data,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        hasNextPage: pagination.page < Math.ceil(total / pagination.limit),
        hasPrevPage: pagination.page > 1,
      },
    };
  }

  /**
   * Manual attendance entry (admin/manager)
   */
  async manualAttendance(
    input: ManualAttendanceInput,
    organizationId: string
  ): Promise<AttendanceResponse> {
    // Verify user belongs to org
    const user = await prisma.user.findFirst({
      where: { id: input.userId, organizationId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!user) throw ApiError.notFound('User not found');

    const date = new Date(input.date);
    const checkInAt = input.checkInAt ? new Date(input.checkInAt) : null;
    const checkOutAt = input.checkOutAt ? new Date(input.checkOutAt) : null;

    let workingHours: number | null = null;
    if (checkInAt && checkOutAt) {
      workingHours = calcWorkingHours(checkInAt, checkOutAt);
    }

    const attendance = await prisma.attendance.upsert({
      where: { userId_date: { userId: input.userId, date } },
      create: {
        userId: input.userId,
        date,
        status: input.status,
        checkInAt,
        checkOutAt,
        workingHours,
        notes: input.notes,
      },
      update: {
        status: input.status,
        checkInAt,
        checkOutAt,
        workingHours,
        notes: input.notes,
      },
    });

    logger.info(`Manual attendance set for user ${input.userId} on ${input.date}: ${input.status}`);
    return this.formatAttendance(attendance, user);
  }

  // ─── SUMMARIES ────────────────────────────────────────────────────────────────

  /**
   * Get attendance summary for a user over a date range
   */
  async getAttendanceSummary(
    targetUserId: string,
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AttendanceSummaryResponse> {
    const user = await prisma.user.findFirst({
      where: { id: targetUserId, organizationId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!user) throw ApiError.notFound('User not found');

    const records = await prisma.attendance.findMany({
      where: {
        userId: targetUserId,
        date: { gte: startDate, lte: endDate },
      },
    });

    const totalWorkingDays = businessDaysBetween(startDate, endDate);
    const presentDays = records.filter((r) => r.status === 'present').length;
    const absentDays = records.filter((r) => r.status === 'absent').length;
    const halfDays = records.filter((r) => r.status === 'half_day').length;
    const onLeaveDays = records.filter((r) => r.status === 'on_leave').length;
    const holidayDays = records.filter((r) => r.status === 'holiday').length;
    const lateDays = records.filter((r) => {
      if (!r.checkInAt) return false;
      return isLateCheckIn(r.checkInAt).isLate;
    }).length;

    const totalWorkingHours = records.reduce(
      (sum, r) => sum + (r.workingHours || 0),
      0
    );
    const avgWorkingHours =
      presentDays > 0
        ? Math.round((totalWorkingHours / presentDays) * 100) / 100
        : 0;

    const attendancePercentage =
      totalWorkingDays > 0
        ? Math.round(((presentDays + halfDays * 0.5) / totalWorkingDays) * 10000) / 100
        : 0;

    // Leave summary from leave requests
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        userId: targetUserId,
        status: 'approved',
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });

    const leaveSummary = Object.keys(DEFAULT_LEAVE_ENTITLEMENTS).reduce(
      (acc, type) => {
        acc[type as LeaveType] = leaveRequests
          .filter((l) => l.type === type)
          .reduce((sum) => sum + 1, 0);
        return acc;
      },
      {} as Record<LeaveType, number>
    );

    return {
      userId: targetUserId,
      userName: `${user.firstName} ${user.lastName}`,
      period: { startDate, endDate },
      totalWorkingDays,
      presentDays,
      absentDays,
      halfDays,
      onLeaveDays,
      holidayDays,
      attendancePercentage,
      totalWorkingHours: Math.round(totalWorkingHours * 100) / 100,
      avgWorkingHours,
      lateDays,
      leaveSummary,
    };
  }

  /**
   * Get team attendance for a specific date
   */
  async getTeamAttendance(
    organizationId: string,
    date?: Date,
    teamId?: string
  ): Promise<TeamAttendanceSummaryResponse> {
    const targetDate = date ? new Date(date.toDateString()) : new Date(new Date().toDateString());

    const userWhere: any = { organizationId, isActive: true };
    if (teamId) userWhere.teamId = teamId;

    const users = await prisma.user.findMany({
      where: userWhere,
      select: { id: true, firstName: true, lastName: true },
    });

    const attendances = await prisma.attendance.findMany({
      where: {
        userId: { in: users.map((u) => u.id) },
        date: targetDate,
      },
    });

    const attendanceMap = new Map(attendances.map((a) => [a.userId, a]));

    const members: MemberAttendanceStatus[] = users.map((user) => {
      const att = attendanceMap.get(user.id);
      return {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        status: att ? (att.status as AttendanceStatus) : 'not_marked',
        checkInAt: att?.checkInAt || null,
        checkOutAt: att?.checkOutAt || null,
        workingHours: att?.workingHours || null,
      };
    });

    const presentCount = members.filter((m) => m.status === 'present').length;
    const absentCount = members.filter((m) => m.status === 'absent').length;
    const onLeaveCount = members.filter((m) => m.status === 'on_leave').length;
    const halfDayCount = members.filter((m) => m.status === 'half_day').length;
    const notMarkedCount = members.filter((m) => m.status === 'not_marked').length;

    const attendanceRate =
      users.length > 0
        ? Math.round(
            ((presentCount + halfDayCount * 0.5) / users.length) * 10000
          ) / 100
        : 0;

    return {
      date: targetDate.toISOString().split('T')[0],
      teamId: teamId || null,
      totalMembers: users.length,
      presentCount,
      absentCount,
      onLeaveCount,
      halfDayCount,
      notMarkedCount,
      attendanceRate,
      members,
    };
  }

  // ─── LEAVE REQUESTS ───────────────────────────────────────────────────────────

  async createLeaveRequest(
    input: CreateLeaveRequestInput,
    userId: string,
    organizationId: string
  ): Promise<LeaveRequestResponse> {
    // Check balance
    const balance = await this.getLeaveBalance(userId, organizationId);
    const typeBalance = balance.balances[input.type as LeaveType];
    const daysNeeded = countLeaveDays(
      new Date(input.startDate),
      new Date(input.endDate),
      input.halfDay || false
    );

    if (input.type !== 'unpaid' && typeBalance.remaining < daysNeeded) {
      throw ApiError.badRequest(
        `Insufficient ${input.type} leave balance. Available: ${typeBalance.remaining} day(s), Requested: ${daysNeeded}`
      );
    }

    // Overlap check: no other approved/pending leave in same period
    const overlap = await prisma.leaveRequest.findFirst({
      where: {
        userId,
        status: { in: ['pending', 'approved'] },
        OR: [
          {
            startDate: { lte: new Date(input.endDate) },
            endDate: { gte: new Date(input.startDate) },
          },
        ],
      },
    });

    if (overlap) {
      throw ApiError.conflict(
        'You already have a leave request overlapping this period'
      );
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId,
        type: input.type,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        reason: input.reason,
        status: 'pending',
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    logger.info(`Leave request created: ${leaveRequest.id} for user ${userId}`);
    return this.formatLeaveRequest(leaveRequest, user, null);
  }

  async reviewLeaveRequest(
    leaveId: string,
    organizationId: string,
    reviewerId: string,
    input: ReviewLeaveRequestInput
  ): Promise<LeaveRequestResponse> {
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: { user: { select: { organizationId: true, firstName: true, lastName: true } } },
    });

    if (!leave) throw ApiError.notFound('Leave request not found');
    if (leave.user.organizationId !== organizationId) throw ApiError.forbidden('Access denied');
    if (leave.status !== 'pending') {
      throw ApiError.badRequest(`Leave request is already ${leave.status}`);
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: input.status,
        approvedBy: reviewerId,
        approvedAt: new Date(),
        rejectionReason: input.rejectionReason || null,
      },
    });

    // If approved: mark attendance as on_leave for those dates
    if (input.status === 'approved') {
      const current = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      while (current <= end) {
        const day = current.getDay();
        if (day !== 0 && day !== 6) {
          await prisma.attendance.upsert({
            where: { userId_date: { userId: leave.userId, date: new Date(current) } },
            create: {
              userId: leave.userId,
              date: new Date(current),
              status: 'on_leave',
            },
            update: { status: 'on_leave' },
          });
        }
        current.setDate(current.getDate() + 1);
      }
    }

    const reviewer = await prisma.user.findUnique({
      where: { id: reviewerId },
      select: { firstName: true, lastName: true },
    });

    logger.info(`Leave ${leaveId} ${input.status} by ${reviewerId}`);
    return this.formatLeaveRequest(updated, leave.user, reviewer);
  }

  async cancelLeaveRequest(
    leaveId: string,
    userId: string,
    organizationId: string
  ): Promise<LeaveRequestResponse> {
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: { user: { select: { organizationId: true, firstName: true, lastName: true } } },
    });

    if (!leave) throw ApiError.notFound('Leave request not found');
    if (leave.user.organizationId !== organizationId) throw ApiError.forbidden('Access denied');
    if (leave.userId !== userId) throw ApiError.forbidden('You can only cancel your own leave');
    if (!['pending', 'approved'].includes(leave.status)) {
      throw ApiError.badRequest(`Cannot cancel a ${leave.status} leave request`);
    }

    // If approved and future: revert attendance records
    if (leave.status === 'approved' && leave.startDate > new Date()) {
      await prisma.attendance.deleteMany({
        where: {
          userId: leave.userId,
          date: { gte: leave.startDate, lte: leave.endDate },
          status: 'on_leave',
        },
      });
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status: 'cancelled' },
    });

    return this.formatLeaveRequest(updated, leave.user, null);
  }

  async getLeaveRequests(
    organizationId: string,
    userId: string,
    userRole: Role,
    filters: LeaveRequestFilters,
    page?: number,
    limit?: number,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResult<LeaveRequestResponse>> {
    const pagination = parsePaginationParams(page, limit);

    const where: any = {};

    if (userRole === ROLES.FIELD_AGENT || userRole === ROLES.MARKETING_AGENT) {
      where.userId = userId;
    } else if (filters.userId) {
      const targetUser = await prisma.user.findFirst({
        where: { id: filters.userId, organizationId },
      });
      if (!targetUser) throw ApiError.notFound('User not found');
      where.userId = filters.userId;
    } else {
      where.user = { organizationId };
    }

    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.startDate || filters.endDate) {
      where.startDate = {};
      if (filters.startDate) where.startDate.gte = filters.startDate;
      if (filters.endDate) where.startDate.lte = filters.endDate;
    }

    const total = await prisma.leaveRequest.count({ where });

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: pagination.skip,
      take: pagination.limit,
    });

    const approverIds = leaves
      .filter((l) => l.approvedBy)
      .map((l) => l.approvedBy!);

    const approvers = approverIds.length
      ? await prisma.user.findMany({
          where: { id: { in: approverIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];

    const approverMap = new Map(
      approvers.map((a) => [a.id, a])
    );

    const data = leaves.map((l) =>
      this.formatLeaveRequest(l, l.user, l.approvedBy ? approverMap.get(l.approvedBy) || null : null)
    );

    return {
      data,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        hasNextPage: pagination.page < Math.ceil(total / pagination.limit),
        hasPrevPage: pagination.page > 1,
      },
    };
  }

  /**
   * Get leave balance for a user in a given year
   */
  async getLeaveBalance(
    userId: string,
    organizationId: string,
    year: number = new Date().getFullYear()
  ): Promise<LeaveBalanceResponse> {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!user) throw ApiError.notFound('User not found');

    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    // Get all non-cancelled leave requests for this year
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        userId,
        startDate: { gte: yearStart },
        endDate: { lte: yearEnd },
        status: { in: ['approved', 'pending'] },
      },
    });

    const balances = Object.entries(DEFAULT_LEAVE_ENTITLEMENTS).reduce(
      (acc, [type, entitled]) => {
        const typeLeaves = leaveRequests.filter((l) => l.type === type);
        const used = typeLeaves
          .filter((l) => l.status === 'approved')
          .reduce((sum, l) => sum + businessDaysBetween(l.startDate, l.endDate), 0);
        const pending = typeLeaves
          .filter((l) => l.status === 'pending')
          .reduce((sum, l) => sum + businessDaysBetween(l.startDate, l.endDate), 0);

        acc[type as LeaveType] = {
          entitled,
          used,
          pending,
          remaining: Math.max(entitled - used, 0),
        };
        return acc;
      },
      {} as LeaveBalanceResponse['balances']
    );

    return {
      userId,
      userName: `${user.firstName} ${user.lastName}`,
      year,
      balances,
    };
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────────

  private formatAttendance(attendance: any, user: any): AttendanceResponse {
    const isLate =
      attendance.checkInAt
        ? isLateCheckIn(attendance.checkInAt).isLate
        : false;

    return {
      id: attendance.id,
      userId: attendance.userId,
      userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
      date: attendance.date,
      status: attendance.status as AttendanceStatus,
      checkInAt: attendance.checkInAt,
      checkOutAt: attendance.checkOutAt,
      checkInLocation: attendance.checkInLocation as LocationData | null,
      checkOutLocation: attendance.checkOutLocation as LocationData | null,
      workingHours: attendance.workingHours,
      workingMinutes: attendance.workingHours
        ? Math.round(attendance.workingHours * 60)
        : null,
      isLate,
      notes: attendance.notes,
      createdAt: attendance.createdAt,
      updatedAt: attendance.updatedAt,
    };
  }

  private formatLeaveRequest(
    leave: any,
    user: any,
    approver: any
  ): LeaveRequestResponse {
    const totalDays = businessDaysBetween(leave.startDate, leave.endDate);

    return {
      id: leave.id,
      userId: leave.userId,
      userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
      type: leave.type as LeaveType,
      startDate: leave.startDate,
      endDate: leave.endDate,
      totalDays,
      reason: leave.reason,
      status: leave.status as LeaveStatus,
      approvedById: leave.approvedBy,
      approvedByName: approver
        ? `${approver.firstName} ${approver.lastName}`
        : null,
      approvedAt: leave.approvedAt,
      rejectionReason: leave.rejectionReason,
      createdAt: leave.createdAt,
      updatedAt: leave.updatedAt,
    };
  }
}

export const attendanceService = new AttendanceService();