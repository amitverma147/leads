import { z } from 'zod';

// ─── Enum Values ──────────────────────────────────────────────────────────────

const attendanceStatusValues = [
  'present', 'absent', 'half_day', 'on_leave', 'holiday', 'week_off',
] as const;

const leaveTypeValues = [
  'sick', 'casual', 'earned', 'unpaid',
  'maternity', 'paternity', 'bereavement', 'compensatory',
] as const;

const leaveStatusValues = ['pending', 'approved', 'rejected', 'cancelled'] as const;

// Date regex YYYY-MM-DD
const dateRegex = /^\d{4}-\d{2}-(0[1-9]|[12]\d|3[01])$/;

// ─── Schemas ──────────────────────────────────────────────────────────────────

const locationSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().max(500).optional(),
});

/**
 * Check-in schema
 */
export const checkInSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().max(500).optional(),
  deviceInfo: z.record(z.string()).optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Check-out schema
 */
export const checkOutSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().max(500).optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Manual attendance (admin/manager)
 */
export const manualAttendanceSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  date: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD'),
  status: z.enum(attendanceStatusValues),
  checkInAt: z.string().datetime().optional(),
  checkOutAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Attendance list query
 */
export const attendanceListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().transform(Number),
  limit: z.string().regex(/^\d+$/).optional().transform(Number),
  userId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  startDate: z
    .string()
    .regex(dateRegex, 'Date must be YYYY-MM-DD')
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  endDate: z
    .string()
    .regex(dateRegex)
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  status: z.enum(attendanceStatusValues).optional(),
  sortBy: z.enum(['date', 'checkInAt', 'workingHours']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Attendance summary query
 */
export const attendanceSummaryQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  startDate: z.string().regex(dateRegex).transform((v) => new Date(v)),
  endDate: z.string().regex(dateRegex).transform((v) => new Date(v)),
});

/**
 * Team attendance query (for a specific date)
 */
export const teamAttendanceQuerySchema = z.object({
  date: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD').optional(),
  teamId: z.string().uuid().optional(),
});

/**
 * Create leave request
 */
export const createLeaveRequestSchema = z
  .object({
    type: z.enum(leaveTypeValues, {
      errorMap: () => ({ message: 'Invalid leave type' }),
    }),
    startDate: z.string().regex(dateRegex, 'Start date must be YYYY-MM-DD'),
    endDate: z.string().regex(dateRegex, 'End date must be YYYY-MM-DD'),
    reason: z.string().min(5, 'Please provide a reason (min 5 chars)').max(500),
    halfDay: z.boolean().optional().default(false),
    halfDayPeriod: z.enum(['morning', 'afternoon']).optional(),
  })
  .refine(
    (data) => new Date(data.startDate) <= new Date(data.endDate),
    { message: 'Start date must be before or equal to end date', path: ['endDate'] }
  )
  .refine(
    (data) => new Date(data.startDate) >= new Date(new Date().toDateString()),
    { message: 'Leave cannot be applied for past dates', path: ['startDate'] }
  );

/**
 * Review leave request (approve/reject)
 */
export const reviewLeaveRequestSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().max(500).optional(),
});

/**
 * Leave request list query
 */
export const leaveRequestListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().transform(Number),
  limit: z.string().regex(/^\d+$/).optional().transform(Number),
  userId: z.string().uuid().optional(),
  status: z.enum(leaveStatusValues).optional(),
  type: z.enum(leaveTypeValues).optional(),
  startDate: z.string().regex(dateRegex).optional().transform((v) => v ? new Date(v) : undefined),
  endDate: z.string().regex(dateRegex).optional().transform((v) => v ? new Date(v) : undefined),
  sortBy: z.enum(['createdAt', 'startDate', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * ID param schemas
 */
export const attendanceIdParamSchema = z.object({
  id: z.string().uuid('Invalid attendance ID'),
});

export const leaveIdParamSchema = z.object({
  id: z.string().uuid('Invalid leave request ID'),
});

// Type exports
export type CheckInSchemaType = z.infer<typeof checkInSchema>;
export type CheckOutSchemaType = z.infer<typeof checkOutSchema>;
export type ManualAttendanceSchemaType = z.infer<typeof manualAttendanceSchema>;
export type AttendanceListQuerySchemaType = z.infer<typeof attendanceListQuerySchema>;
export type AttendanceSummaryQuerySchemaType = z.infer<typeof attendanceSummaryQuerySchema>;
export type TeamAttendanceQuerySchemaType = z.infer<typeof teamAttendanceQuerySchema>;
export type CreateLeaveRequestSchemaType = z.infer<typeof createLeaveRequestSchema>;
export type ReviewLeaveRequestSchemaType = z.infer<typeof reviewLeaveRequestSchema>;
export type LeaveRequestListQuerySchemaType = z.infer<typeof leaveRequestListQuerySchema>;