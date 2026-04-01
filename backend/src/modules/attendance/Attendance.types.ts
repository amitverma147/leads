// ─── Enums ────────────────────────────────────────────────────────────────────

export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'half_day'
  | 'on_leave'
  | 'holiday'
  | 'week_off';

export type LeaveType =
  | 'sick'
  | 'casual'
  | 'earned'
  | 'unpaid'
  | 'maternity'
  | 'paternity'
  | 'bereavement'
  | 'compensatory';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type CheckType = 'check_in' | 'check_out';

// ─── Input Types ──────────────────────────────────────────────────────────────

export interface CheckInInput {
  latitude?: number;
  longitude?: number;
  address?: string;
  deviceInfo?: Record<string, string>;
  notes?: string;
}

export interface CheckOutInput {
  latitude?: number;
  longitude?: number;
  address?: string;
  notes?: string;
}

export interface ManualAttendanceInput {
  userId: string;
  date: string;             // YYYY-MM-DD
  status: AttendanceStatus;
  checkInAt?: string;       // ISO datetime
  checkOutAt?: string;
  notes?: string;
}

export interface CreateLeaveRequestInput {
  type: LeaveType;
  startDate: string;        // YYYY-MM-DD
  endDate: string;
  reason: string;
  halfDay?: boolean;
  halfDayPeriod?: 'morning' | 'afternoon';
}

export interface ReviewLeaveRequestInput {
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface AttendanceFilters {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: AttendanceStatus;
  teamId?: string;
}

export interface LeaveRequestFilters {
  userId?: string;
  status?: LeaveStatus;
  type?: LeaveType;
  startDate?: Date;
  endDate?: Date;
}

// ─── Response Types ───────────────────────────────────────────────────────────

export interface AttendanceResponse {
  id: string;
  userId: string;
  userName: string;
  date: Date;
  status: AttendanceStatus;
  checkInAt: Date | null;
  checkOutAt: Date | null;
  checkInLocation: LocationData | null;
  checkOutLocation: LocationData | null;
  workingHours: number | null;        // Decimal hours e.g. 7.5
  workingMinutes: number | null;
  isLate: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationData {
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface CheckInResponse {
  attendance: AttendanceResponse;
  message: string;
  isLate: boolean;
  lateByMinutes: number;
}

export interface CheckOutResponse {
  attendance: AttendanceResponse;
  workingHours: number;
  workingMinutes: number;
}

export interface AttendanceSummaryResponse {
  userId: string;
  userName: string;
  period: { startDate: Date; endDate: Date };
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  onLeaveDays: number;
  holidayDays: number;
  attendancePercentage: number;
  totalWorkingHours: number;
  avgWorkingHours: number;
  lateDays: number;
  leaveSummary: Record<LeaveType, number>;
}

export interface TeamAttendanceSummaryResponse {
  date: string;
  teamId: string | null;
  totalMembers: number;
  presentCount: number;
  absentCount: number;
  onLeaveCount: number;
  halfDayCount: number;
  notMarkedCount: number;
  attendanceRate: number;
  members: MemberAttendanceStatus[];
}

export interface MemberAttendanceStatus {
  userId: string;
  userName: string;
  status: AttendanceStatus | 'not_marked';
  checkInAt: Date | null;
  checkOutAt: Date | null;
  workingHours: number | null;
}

export interface LeaveRequestResponse {
  id: string;
  userId: string;
  userName: string;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  approvedById: string | null;
  approvedByName: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveBalanceResponse {
  userId: string;
  userName: string;
  year: number;
  balances: Record<LeaveType, LeaveBalance>;
}

export interface LeaveBalance {
  entitled: number;
  used: number;
  pending: number;
  remaining: number;
}

// Default leave entitlements per year
export const DEFAULT_LEAVE_ENTITLEMENTS: Record<LeaveType, number> = {
  sick: 12,
  casual: 12,
  earned: 15,
  unpaid: 0,
  maternity: 90,
  paternity: 5,
  bereavement: 3,
  compensatory: 0,
};