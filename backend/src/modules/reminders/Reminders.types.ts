// ─── Enums ────────────────────────────────────────────────────────────────────

export type ReminderPriority = 'low' | 'medium' | 'high';

export type ReminderStatus = 'pending' | 'completed' | 'snoozed' | 'cancelled';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

// ─── Input Types ──────────────────────────────────────────────────────────────

export interface CreateReminderInput {
  leadId: string;
  title: string;
  description?: string;
  reminderAt: Date | string;
  priority?: ReminderPriority;
  recurrence?: RecurrenceType;
  notifyChannels?: NotifyChannel[];
}

export interface UpdateReminderInput {
  title?: string;
  description?: string;
  reminderAt?: Date | string;
  priority?: ReminderPriority;
  recurrence?: RecurrenceType;
  notifyChannels?: NotifyChannel[];
}

export interface SnoozeReminderInput {
  snoozeMinutes: number;   // 15 | 30 | 60 | 120 | 1440 (1 day)
}

export interface CompleteReminderInput {
  note?: string;           // Completion note / what was done
}

export type NotifyChannel = 'in_app' | 'sms' | 'email';

// ─── Response Types ───────────────────────────────────────────────────────────

export interface ReminderListResponse {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  title: string;
  description: string | null;
  reminderAt: Date;
  priority: ReminderPriority;
  status: ReminderStatus;
  recurrence: RecurrenceType;
  isOverdue: boolean;
  minutesUntilDue: number | null;  // null if overdue or completed
  createdAt: Date;
}

export interface ReminderDetailResponse extends ReminderListResponse {
  notifyChannels: NotifyChannel[];
  completedAt: Date | null;
  completionNote: string | null;
  snoozedUntil: Date | null;
  assignedToId: string;
  assignedToName: string;
  leadStatus: string;
  leadPriority: string;
  updatedAt: Date;
}

export interface ReminderSummaryResponse {
  overdueCount: number;
  todayCount: number;
  upcomingCount: number;       // Next 7 days
  completedThisWeek: number;
  nextReminder: {
    id: string;
    title: string;
    leadName: string;
    reminderAt: Date;
    minutesUntilDue: number;
  } | null;
}

// ─── Filter Types ─────────────────────────────────────────────────────────────

export interface ReminderFilters {
  leadId?: string;
  status?: ReminderStatus | ReminderStatus[];
  priority?: ReminderPriority;
  dateFrom?: Date;
  dateTo?: Date;
  isOverdue?: boolean;
  search?: string;
}