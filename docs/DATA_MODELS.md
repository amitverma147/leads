# Data Models

All types are derived from the Prisma schema at `src/database/prisma/schema.prisma`.

---

## Enums

### Role
```typescript
type Role =
  | 'super_admin'
  | 'admin'
  | 'marketing_manager'
  | 'marketing_agent'
  | 'agent_supervisor'
  | 'field_agent'
```

### LeadStatus
```typescript
type LeadStatus =
  | 'new'          // Just collected, no action taken
  | 'contacted'    // First contact made
  | 'qualified'    // Verified interest
  | 'negotiation'  // Deal discussions ongoing
  | 'converted'    // Deal closed
  | 'lost'         // Deal failed
  | 'invalid'      // Wrong number / fake data
  | 'junk'         // Spam / irrelevant
```

### LeadSource
```typescript
type LeadSource =
  | 'field_collection'  // Field agent collected
  | 'website'           // Website form / landing page
  | 'referral'          // Word of mouth
  | 'social_media'      // Facebook, Instagram, etc.
  | 'import'            // CSV/bulk import
  | 'api'               // External system via API
```

### LeadPriority
```typescript
type LeadPriority = 'low' | 'medium' | 'high' | 'urgent'
```

### ActivityType
```typescript
type ActivityType =
  | 'call'           // Phone call made
  | 'email'          // Email sent
  | 'sms'            // SMS sent
  | 'whatsapp'       // WhatsApp message
  | 'meeting'        // In-person meeting
  | 'note'           // Free-form note
  | 'status_change'  // Pipeline status updated
  | 'assignment'     // Lead assigned to user
  | 'follow_up'      // Follow-up action taken
```

### TargetPeriod
```typescript
type TargetPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly'
```

### TargetType
```typescript
type TargetType =
  | 'leads_collected'   // New leads created
  | 'leads_converted'   // Leads converted to customers
  | 'calls_made'        // Call logs recorded
  | 'revenue'           // Sum of dealValue on converted leads
  | 'visits'            // Leads with geolocation data
  | 'follow_ups'        // LeadActivity entries of type follow_up
```

### CampaignStatus
```typescript
type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
```

### NotificationType
```typescript
type NotificationType =
  | 'lead_assigned'
  | 'lead_status_changed'
  | 'follow_up_reminder'
  | 'new_lead'
  | 'team_invite'
  | 'system_alert'
  | 'target_achieved'
  | 'target_warning'
```

---

## Core Model Shapes

The following are the TypeScript shapes returned by API endpoints (not Prisma models directly).

---

### AuthResponse
```typescript
interface AuthResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number              // Seconds until access token expires
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    phone: string | null
    avatar: string | null
    role: Role
    isActive: boolean
    isEmailVerified: boolean
    isPhoneVerified: boolean
    organizationId: string
    organizationName: string
    createdAt: string            // ISO datetime
  }
}
```

### UserListResponse
```typescript
interface UserListResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  avatar: string | null
  role: Role
  isActive: boolean
  organizationId: string
  teamId: string | null
  teamName: string | null
  leadsCreatedCount: number
  leadsAssignedCount: number
  updatedAt: string
  createdAt: string
}
```

### UserDetailResponse (extends UserListResponse)
```typescript
interface UserDetailResponse extends UserListResponse {
  isEmailVerified: boolean
  isPhoneVerified: boolean
  reportingToId: string | null
  reportingToName: string | null
  subordinatesCount: number
  lastLoginAt: string | null
}
```

---

### LeadListResponse
```typescript
interface LeadListResponse {
  id: string
  firstName: string
  lastName: string | null
  email: string | null
  phone: string
  status: LeadStatus
  source: LeadSource | null
  priority: LeadPriority
  score: number | null
  tags: string[]
  city: string | null
  state: string | null
  assignedToId: string | null
  assignedToName: string | null
  createdById: string
  createdByName: string
  followUpAt: string | null      // ISO datetime
  createdAt: string
  updatedAt: string
}
```

### LeadDetailResponse (extends LeadListResponse)
```typescript
interface LeadDetailResponse extends LeadListResponse {
  alternatePhone: string | null
  formId: string | null
  formName: string | null
  formData: Record<string, unknown> | null
  notes: string | null
  latitude: number | null
  longitude: number | null
  address: string | null
  pincode: string | null
  locationData: Record<string, unknown> | null
  deviceInfo: Record<string, unknown> | null
  ipAddress: string | null
  contactedAt: string | null
  convertedAt: string | null
  dealValue: number | null
  products: string[]
  activitiesCount: number
}
```

### LeadActivity
```typescript
interface LeadActivity {
  id: string
  leadId: string
  userId: string
  userName: string
  type: ActivityType
  title: string
  description: string | null
  metadata: Record<string, unknown> | null
  duration: number | null        // Duration in seconds (for calls)
  createdAt: string
}
```

---

### TeamListResponse
```typescript
interface TeamListResponse {
  id: string
  name: string
  description: string | null
  type: 'marketing' | 'field'
  isActive: boolean
  membersCount: number
  leadsCount: number
  organizationId: string
  createdAt: string
  updatedAt: string
}
```

### TeamDetailResponse (extends TeamListResponse)
```typescript
interface TeamDetailResponse extends TeamListResponse {
  members: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: Role
    isActive: boolean
    joinedAt: string
  }[]
  settings: Record<string, unknown>
}
```

---

### OrganizationResponse
```typescript
interface OrganizationResponse {
  id: string
  name: string
  slug: string
  logo: string | null
  settings: OrganizationSettings
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface OrganizationSettings {
  timezone?: string
  dateFormat?: string
  currency?: string
  language?: string
  leadAutoAssignment?: boolean
  leadDuplicateCheck?: boolean
  requireGeolocation?: boolean
  maxLeadsPerAgent?: number
  workingHours?: {
    monday?: WorkingHourSlot
    tuesday?: WorkingHourSlot
    wednesday?: WorkingHourSlot
    thursday?: WorkingHourSlot
    friday?: WorkingHourSlot
    saturday?: WorkingHourSlot
    sunday?: WorkingHourSlot
  }
  notifications?: {
    emailNotifications?: boolean
    smsNotifications?: boolean
    pushNotifications?: boolean
    newLeadAlert?: boolean
    leadAssignmentAlert?: boolean
    dailyDigest?: boolean
  }
}

interface WorkingHourSlot {
  enabled: boolean
  start: string    // "09:00"
  end: string      // "18:00"
}
```

---

### Analytics

#### DashboardStats
```typescript
interface DashboardStats {
  leads: {
    total: number
    new: number
    contacted: number
    qualified: number
    converted: number
    conversionRate: number        // 0-100 percentage
  }
  users: {
    total: number
    active: number
    agents: number                // field_agent + marketing_agent
    marketing: number             // marketing_manager + marketing_agent
  }
  forms: {
    total: number
    published: number
  }
  todayActivity: {
    leadsCreated: number
    leadsContacted: number
    leadsConverted: number
  }
}
```

#### AgentPerformanceResponse
```typescript
interface AgentPerformanceResponse {
  userId: string
  name: string
  role: Role
  teamName: string | null
  leadsCreated: number
  leadsContacted: number
  leadsConverted: number
  conversionRate: number
  activitiesCount: number
}
```

---

### TargetResponse
```typescript
interface TargetResponse {
  id: string
  name: string
  description: string | null
  type: TargetType
  period: TargetPeriod
  value: number
  startDate: string
  endDate: string
  isActive: boolean
  organizationId: string
  teamTargetsCount: number
  userTargetsCount: number
  createdAt: string
  updatedAt: string
}
```

### TargetProgressData
```typescript
interface TargetProgressData {
  currentValue: number
  targetValue: number
  percentage: number           // 0-100+
  remaining: number
  periodStart: string
  periodEnd: string
  status: 'on_track' | 'behind' | 'achieved' | 'exceeded'
}
```

### UserPerformanceResponse
```typescript
interface UserPerformanceResponse {
  userId: string
  name: string
  targets: {
    targetId: string
    targetName: string
    type: TargetType
    period: TargetPeriod
    progress: TargetProgressData
  }[]
  overallPercentage: number
  rank: number | null
}
```

### LeaderboardEntry
```typescript
interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  teamName: string | null
  percentage: number
  currentValue: number
  targetValue: number
  trend: 'up' | 'down' | 'same'
}
```

---

### CampaignListResponse
```typescript
interface CampaignListResponse {
  id: string
  name: string
  description: string | null
  type: string
  status: CampaignStatus
  startDate: string | null
  endDate: string | null
  budget: number | null
  formId: string | null
  formName: string | null
  leadsCount: number
  teamsCount: number
  usersCount: number
  organizationId: string
  createdAt: string
  updatedAt: string
}
```

### CampaignStats
```typescript
interface CampaignStats {
  totalLeads: number
  byStatus: Record<LeadStatus, number>
  bySource: Record<string, number>
  conversionRate: number
  weeklyTrend: { date: string; count: number }[]
  topPerformers: { userId: string; name: string; leadsCount: number }[]
}
```

---

### TemplateListResponse
```typescript
interface TemplateListResponse {
  id: string
  name: string
  channel: 'sms' | 'email' | 'whatsapp'
  category: string
  subject: string | null
  variables: string[]
  tags: string[]
  isActive: boolean
  usageCount: number
  organizationId: string
  createdAt: string
  updatedAt: string
}
```

### TemplateDetailResponse (extends TemplateListResponse)
```typescript
interface TemplateDetailResponse extends TemplateListResponse {
  content: string
  description: string | null
  settings: TemplateSettings
}
```

---

### ReminderListResponse
```typescript
interface ReminderListResponse {
  id: string
  leadId: string
  leadName: string
  leadPhone: string
  leadStatus: LeadStatus
  leadPriority: LeadPriority
  title: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'completed' | 'snoozed' | 'cancelled'
  reminderAt: string
  isOverdue: boolean
  minutesUntilDue: number | null
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly'
  assignedToId: string
  assignedToName: string
  createdAt: string
  updatedAt: string
}
```

### ReminderDetailResponse (extends ReminderListResponse)
```typescript
interface ReminderDetailResponse extends ReminderListResponse {
  description: string | null
  notifyChannels: ('in_app' | 'sms' | 'email')[]
  completedAt: string | null
  completionNote: string | null
  snoozedUntil: string | null
  snoozedCount: number
}
```

---

### AttendanceRecord
```typescript
interface AttendanceRecord {
  id: string
  userId: string
  userName: string
  date: string               // YYYY-MM-DD
  checkInTime: string | null
  checkOutTime: string | null
  totalHours: number | null
  status: 'present' | 'absent' | 'half_day' | 'leave' | 'holiday'
  isManual: boolean
  notes: string | null
  location: {
    checkIn?: { lat: number; lng: number; address: string }
    checkOut?: { lat: number; lng: number; address: string }
  } | null
}
```

### LeaveRequest
```typescript
interface LeaveRequest {
  id: string
  userId: string
  userName: string
  type: 'sick' | 'casual' | 'earned' | 'unpaid' | 'maternity' | 'paternity' | 'bereavement' | 'compensatory'
  startDate: string
  endDate: string
  totalDays: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  reviewedById: string | null
  reviewedByName: string | null
  reviewNote: string | null
  reviewedAt: string | null
  appliedAt: string
}
```

### LeaveBalance
```typescript
interface LeaveBalance {
  sick: { entitled: number; used: number; remaining: number }
  casual: { entitled: number; used: number; remaining: number }
  earned: { entitled: number; used: number; remaining: number }
  unpaid: { entitled: number; used: number; remaining: number }
  maternity: { entitled: number; used: number; remaining: number }
  paternity: { entitled: number; used: number; remaining: number }
  bereavement: { entitled: number; used: number; remaining: number }
  compensatory: { entitled: number; used: number; remaining: number }
}
```

---

### NotificationResponse
```typescript
interface NotificationResponse {
  id: string
  type: NotificationType
  title: string
  message: string
  data: Record<string, unknown> | null   // Extra context (leadId, etc.)
  isRead: boolean
  readAt: string | null
  createdAt: string
}
```

---

## Form Field Definition

```typescript
interface FormField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  helpText?: string
  defaultValue?: unknown
  options?: { label: string; value: string }[]
  validation?: {
    required?: boolean
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  conditional?: {
    field: string              // id of another field
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
    value: unknown
    action: 'show' | 'hide' | 'require'
  }
  order: number
  width?: 'full' | 'half' | 'third'
  properties?: Record<string, unknown>
}

type FieldType =
  | 'text' | 'textarea' | 'number' | 'email' | 'phone'
  | 'dropdown' | 'radio' | 'checkbox' | 'toggle'
  | 'date' | 'time' | 'datetime'
  | 'rating' | 'slider' | 'signature'
  | 'file_upload' | 'image_upload' | 'camera'
  | 'location' | 'address'
  | 'section' | 'divider' | 'heading' | 'paragraph'
```
