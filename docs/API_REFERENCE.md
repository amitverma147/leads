# API Reference

Base URL: `http://localhost:5000/api/v1`

All requests that require authentication must include:
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

---

## AUTH `/auth`

### POST `/auth/register`
Create a new account and organization simultaneously.

**Request:**
```json
{
  "email": "admin@company.com",
  "password": "Admin@123",
  "firstName": "Amit",
  "lastName": "Verma",
  "phone": "9876543210",
  "organizationName": "My Company",
  "organizationSlug": "my-company"
}
```
> `organizationSlug` is optional — auto-derived from name if omitted.

**Response 201:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 900,
    "user": {
      "id": "uuid",
      "email": "admin@company.com",
      "firstName": "Amit",
      "lastName": "Verma",
      "role": "admin",
      "organizationId": "uuid",
      "organizationName": "My Company"
    }
  }
}
```

---

### POST `/auth/login`
**Request:**
```json
{
  "email": "admin@company.com",
  "password": "Admin@123"
}
```
**Response 200:** Same shape as register response.

**Errors:**
- `401` — Invalid credentials
- `401` — Account deactivated

---

### POST `/auth/refresh`
**Request:**
```json
{
  "refreshToken": "eyJ..."
}
```
**Response 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "expiresIn": 900
  }
}
```

---

### POST `/auth/logout`
**Request:**
```json
{
  "refreshToken": "eyJ..."
}
```
**Response 200:** `{ "success": true, "message": "Logged out successfully" }`

---

### POST `/auth/logout-all`
No body required. Revokes all refresh tokens for this user.
**Response 200:** `{ "success": true }`

---

### POST `/auth/change-password`
**Request:**
```json
{
  "currentPassword": "OldPass@1",
  "newPassword": "NewPass@1"
}
```
**Response 200:** `{ "success": true }` — Also revokes all refresh tokens (force re-login).

---

### GET `/auth/me`
**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "...",
    "firstName": "...",
    "lastName": "...",
    "phone": "...",
    "role": "admin",
    "isActive": true,
    "organizationId": "uuid",
    "organizationName": "..."
  }
}
```

---

## USERS `/users`

### POST `/users`
*Admin only*

**Request:**
```json
{
  "email": "agent@company.com",
  "password": "Agent@123",
  "firstName": "Ravi",
  "lastName": "Kumar",
  "phone": "9876543211",
  "role": "field_agent",
  "teamId": "uuid",
  "reportingToId": "uuid"
}
```
> `phone`, `teamId`, `reportingToId` are optional.

**Response 201:** UserDetailResponse

---

### GET `/users`
*Admin only*

**Query params:**
```
page        number   default 1
limit       number   default 20, max 100
search      string   matches firstName, lastName, email, phone
role        string   exact role value
isActive    boolean
teamId      string   uuid
sortBy      string   createdAt | firstName | lastName | email | lastLoginAt
sortOrder   string   asc | desc
```

**Response 200:** Paginated list of UserListResponse

---

### GET `/users/:id`
*Admin only*

**Response 200:** UserDetailResponse

---

### PATCH `/users/:id`
*Admin only*

**Request (all fields optional):**
```json
{
  "firstName": "Ravi",
  "lastName": "Singh",
  "phone": "9876543211",
  "role": "marketing_agent",
  "teamId": "uuid",
  "reportingToId": "uuid",
  "avatar": "https://..."
}
```
**Response 200:** Updated UserDetailResponse

---

### DELETE `/users/:id`
*Admin only* — Soft deactivates the user.

**Response 200:** `{ "success": true, "message": "User deactivated" }`

---

### POST `/users/:id/activate`
*Admin only* — Re-activates a deactivated user.

**Response 200:** `{ "success": true, "message": "User activated" }`

---

## LEADS `/leads`

### POST `/leads`

**Request:**
```json
{
  "firstName": "Priya",
  "lastName": "Sharma",
  "phone": "9123456789",
  "email": "priya@gmail.com",
  "source": "field_collection",
  "priority": "high",
  "formId": "uuid",
  "formData": { "productInterest": "Premium Plan" },
  "notes": "Very interested, call back tomorrow",
  "tags": ["hot-lead", "premium"],
  "latitude": 28.6139,
  "longitude": 77.2090,
  "address": "Connaught Place",
  "city": "Delhi",
  "state": "Delhi",
  "pincode": "110001",
  "assignedToId": "uuid"
}
```
> Required: `firstName`, `phone`

**Response 201:** LeadDetailResponse

---

### GET `/leads`

**Query params:**
```
page, limit, sortBy, sortOrder
search          string   matches firstName, lastName, phone, email
status          string   comma-separated LeadStatus values e.g. "new,contacted"
source          string   comma-separated LeadSource values
priority        string   comma-separated e.g. "high,urgent"
assignedToId    string   uuid
createdById     string   uuid
formId          string   uuid
tags            string   comma-separated
dateFrom        string   ISO datetime
dateTo          string   ISO datetime
hasFollowUp     boolean
```

**Response 200:** Paginated LeadListResponse

---

### GET `/leads/stats`
*Manager+ only*

**Response 200:**
```json
{
  "success": true,
  "data": {
    "total": 450,
    "byStatus": {
      "new": 120, "contacted": 80, "qualified": 50,
      "negotiation": 30, "converted": 100,
      "lost": 40, "invalid": 20, "junk": 10
    },
    "todayCount": 15,
    "thisWeekCount": 45,
    "thisMonthCount": 180
  }
}
```

---

### GET `/leads/:id`
**Response 200:** LeadDetailResponse

---

### PATCH `/leads/:id`
**Request (all optional):**
```json
{
  "status": "contacted",
  "priority": "high",
  "assignedToId": "uuid",
  "notes": "Updated notes",
  "followUpAt": "2024-12-25T10:00:00Z",
  "dealValue": 50000,
  "tags": ["premium"]
}
```

---

### DELETE `/leads/:id`
*Admin only*

---

### POST `/leads/:id/activities`
**Request:**
```json
{
  "type": "call",
  "title": "Follow-up call",
  "description": "Lead interested in plan B",
  "metadata": { "duration": 120, "outcome": "callback_requested" }
}
```

---

### GET `/leads/:id/activities`
**Query:** `page`, `limit`

**Response 200:** Paginated LeadActivity

---

### POST `/leads/bulk/assign`
*Manager+ only*

**Request:**
```json
{
  "leadIds": ["uuid1", "uuid2"],
  "assignedToId": "uuid"
}
```

---

### POST `/leads/bulk/status`
*Manager+ only*

**Request:**
```json
{
  "leadIds": ["uuid1", "uuid2"],
  "status": "contacted"
}
```

---

## TEAMS `/teams`

### POST `/teams`
*Admin only*

**Request:**
```json
{
  "name": "Delhi Field Team",
  "description": "Covers Delhi NCR region",
  "type": "field",
  "settings": {}
}
```
> `type`: `"marketing"` or `"field"`

---

### GET `/teams`
**Query:** `page`, `limit`, `search`, `type`, `isActive`, `sortBy`, `sortOrder`

---

### GET `/teams/:id`
**Response 200:** TeamDetailResponse (with members array)

---

### POST `/teams/:id/members`
*Admin only*

**Request:**
```json
{
  "userId": "uuid"
}
```

---

### DELETE `/teams/:id/members/:userId`
*Admin only*

---

## ORGANIZATION `/organizations`

### GET `/organizations/current`
**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Company",
    "slug": "my-company",
    "logo": null,
    "settings": { "timezone": "Asia/Kolkata", "currency": "INR" },
    "isActive": true,
    "createdAt": "..."
  }
}
```

---

### PATCH `/organizations/current`
*Admin only*

**Request:**
```json
{
  "name": "Updated Company Name",
  "logo": "https://...",
  "settings": {
    "timezone": "Asia/Kolkata",
    "maxLeadsPerAgent": 50,
    "workingHours": {
      "monday": { "enabled": true, "start": "09:00", "end": "18:00" }
    }
  }
}
```
> Settings are deep-merged, not replaced.

---

### GET `/organizations/current/stats`
**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 25,
    "activeUsers": 22,
    "totalLeads": 1500,
    "totalTeams": 4,
    "totalForms": 8,
    "totalCampaigns": 12
  }
}
```

---

## ANALYTICS `/analytics`

*All endpoints: Manager+ only*

### GET `/analytics/dashboard`
**Response 200:** DashboardStats object

---

### GET `/analytics/leads-by-status`
**Response 200:**
```json
{
  "data": [
    { "status": "new", "count": 120, "percentage": 26.7 },
    { "status": "converted", "count": 100, "percentage": 22.2 }
  ]
}
```

---

### GET `/analytics/leads-by-source`
Similar shape with `source` key.

---

### GET `/analytics/leads-by-priority`
Similar shape with `priority` key.

---

### GET `/analytics/leads-trend`
**Query:** `startDate` (ISO), `endDate` (ISO)

**Response 200:**
```json
{
  "data": [
    { "date": "2024-01-01", "count": 15 },
    { "date": "2024-01-02", "count": 22 }
  ]
}
```

---

### GET `/analytics/agent-performance`
**Response 200:** Array of AgentPerformanceResponse

---

### GET `/analytics/top-performers`
**Query:** `limit` (number, default 10)

**Response 200:** Array of `{ userId, name, metric, value }`

---

### GET `/analytics/conversion-funnel`
**Response 200:**
```json
{
  "data": [
    { "stage": "new", "count": 500, "dropoffRate": null },
    { "stage": "contacted", "count": 350, "dropoffRate": 30 },
    { "stage": "converted", "count": 100, "dropoffRate": 71.4 }
  ]
}
```

---

### GET `/analytics/geographic-distribution`
**Query:** `limit` (default 20)

**Response 200:**
```json
{
  "data": [
    { "city": "Delhi", "state": "Delhi", "count": 250 },
    { "city": "Mumbai", "state": "Maharashtra", "count": 180 }
  ]
}
```

---

## TARGETS `/targets`

### POST `/targets`
*Admin only*

**Request:**
```json
{
  "name": "Monthly Leads Target",
  "description": "Each agent must collect 100 leads per month",
  "type": "leads_collected",
  "period": "monthly",
  "value": 100,
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z"
}
```

---

### GET `/targets`
**Query:** `page`, `limit`, `search`, `type`, `period`, `isActive`, `sortBy`, `sortOrder`

---

### GET `/targets/:id`
**Response 200:** TargetDetailResponse (includes assignedTeams and assignedUsers arrays with progress)

---

### POST `/targets/assign`
*Admin only*

**Request:**
```json
{
  "targetId": "uuid",
  "teamIds": ["uuid1", "uuid2"],
  "userIds": ["uuid3"],
  "customValue": 150
}
```
> Idempotent — re-assigning does not create duplicates.

---

### POST `/targets/:id/unassign`
*Admin only*

**Request:**
```json
{
  "teamIds": ["uuid1"],
  "userIds": ["uuid3"]
}
```

---

### GET `/targets/my-performance`
Returns logged-in user's performance across all assigned targets.

**Response 200:** UserPerformanceResponse

---

### GET `/targets/team/:teamId/performance`
*Manager+ only*

**Response 200:** TeamPerformanceResponse

---

### GET `/targets/user/:userId/performance`
*Manager+ only*

**Response 200:** UserPerformanceResponse

---

### GET `/targets/leaderboard`
**Query (required):** `type` (TargetType), `period` (TargetPeriod)
**Query (optional):** `teamId` (filter by team)

**Response 200:** LeaderboardResponse (array of LeaderboardEntry sorted by rank)

---

## CAMPAIGNS `/campaigns`

### POST `/campaigns`
*Manager+ only*

**Request:**
```json
{
  "name": "Delhi Field Drive Q1",
  "description": "...",
  "type": "field_collection",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-03-31T23:59:59Z",
  "budget": 50000,
  "formId": "uuid",
  "settings": {
    "dailyLeadTarget": 20,
    "maxLeadsTotal": 1000,
    "allowDuplicates": false,
    "autoAssign": true,
    "autoAssignStrategy": "round_robin",
    "requireGeolocation": true,
    "formRequired": true
  }
}
```
> `type` values: `field_collection`, `telecalling`, `email`, `sms`, `whatsapp`, `mixed`

---

### GET `/campaigns`
**Query:** `page`, `limit`, `search`, `status`, `type`, `sortBy`, `sortOrder`

---

### PATCH `/campaigns/:id/status`
*Manager+ only*

**Request:**
```json
{
  "status": "active",
  "reason": "Starting campaign"
}
```
> Transitions: `draft → active`, `active → paused`, `active/paused → completed/cancelled`

---

### GET `/campaigns/:id/stats`
**Response 200:** CampaignStats object

---

### GET `/campaigns/:id/leads`
**Query:** `page`, `limit`, `status`, `assignedToId`, `sortBy`

---

### POST `/campaigns/:id/leads`
*Manager+ only*

**Request:**
```json
{
  "leadIds": ["uuid1", "uuid2"]
}
```

---

### POST `/campaigns/:id/auto-assign`
*Manager+ only*

Distributes unassigned campaign leads among assigned team members.

**Request:** `{}` (empty body, uses campaign's autoAssignStrategy)

---

### POST `/campaigns/:id/teams`
*Manager+ only*

**Request:**
```json
{
  "teamIds": ["uuid1", "uuid2"]
}
```

---

### POST `/campaigns/:id/users`
*Manager+ only*

**Request:**
```json
{
  "userIds": ["uuid1", "uuid2"]
}
```

---

## TEMPLATES `/templates`

### POST `/templates`
*Manager+ only*

**Request:**
```json
{
  "name": "Welcome SMS",
  "channel": "sms",
  "category": "welcome",
  "content": "Hi {{firstName}}, welcome! Our agent {{assignedTo}} will call on {{phone}} shortly.",
  "description": "Sent to new leads",
  "tags": ["onboarding"],
  "settings": {
    "senderId": "LEADGN",
    "unicode": false
  }
}
```

**Available template variables:**
```
{{firstName}}    Lead first name
{{lastName}}     Lead last name
{{fullName}}     Full name
{{phone}}        Lead phone
{{email}}        Lead email
{{city}}         Lead city
{{state}}        Lead state
{{pincode}}      Lead pincode
{{address}}      Lead address
{{status}}       Lead status
{{priority}}     Lead priority
{{assignedTo}}   Assigned agent name
{{createdDate}}  Lead creation date
```

---

### POST `/templates/preview`
**Request:**
```json
{
  "templateId": "uuid",
  "sampleData": {
    "firstName": "Priya",
    "city": "Delhi"
  }
}
```

**Response 200:**
```json
{
  "data": {
    "rendered": "Hi Priya, welcome!...",
    "missingVariables": ["assignedTo"],
    "usedVariables": ["firstName"]
  }
}
```

---

### POST `/templates/preview/lead/:leadId`
**Request:**
```json
{ "templateId": "uuid" }
```
Renders template using the lead's actual data.

---

### POST `/templates/send`
*Marketing team+*

**Request:**
```json
{
  "templateId": "uuid",
  "leadId": "uuid",
  "overrideVariables": { "assignedTo": "Ravi Kumar" }
}
```

---

### POST `/templates/send/bulk`
*Marketing team+ — Max 200 leads*

**Request:**
```json
{
  "templateId": "uuid",
  "leadIds": ["uuid1", "uuid2", "..."],
  "overrideVariables": {}
}
```

**Response 200:**
```json
{
  "data": {
    "total": 50,
    "sent": 48,
    "failed": 2,
    "results": [
      { "leadId": "uuid", "success": true },
      { "leadId": "uuid2", "success": false, "reason": "No phone" }
    ]
  }
}
```

---

## REMINDERS `/reminders`

### GET `/reminders/summary`
**Response 200:**
```json
{
  "data": {
    "overdue": 3,
    "dueToday": 5,
    "upcoming": 12,
    "completed": 45,
    "nextReminder": { "id": "uuid", "title": "...", "reminderAt": "..." }
  }
}
```

---

### POST `/reminders`
**Request:**
```json
{
  "leadId": "uuid",
  "title": "Follow-up call",
  "description": "Ask about plan decision",
  "reminderAt": "2024-12-25T10:00:00Z",
  "priority": "high",
  "recurrence": "none",
  "notifyChannels": ["in_app"]
}
```

---

### GET `/reminders`
**Query:**
```
page, limit, sortBy, sortOrder
leadId          string   uuid
status          string   pending | completed | snoozed | cancelled
priority        string   low | medium | high
isOverdue       boolean
dateFrom, dateTo string  ISO datetime
```

---

### POST `/reminders/:id/snooze`
**Request:**
```json
{
  "snoozeMinutes": 30
}
```
> Allowed values: `15`, `30`, `60`, `120`, `1440` (1 day)

---

### POST `/reminders/:id/complete`
**Request:**
```json
{
  "note": "Lead confirmed interest, sending proposal"
}
```
> Automatically logs a `follow_up` activity on the lead.

---

## ATTENDANCE `/attendance`

### POST `/attendance/check-in`
**Request:**
```json
{
  "latitude": 28.6139,
  "longitude": 77.2090,
  "address": "Connaught Place, Delhi",
  "notes": "Starting field work"
}
```
> Only one check-in allowed per day.

---

### POST `/attendance/check-out`
**Request:** Same shape as check-in.

---

### GET `/attendance/today`
**Response 200:** Single AttendanceRecord for today.

---

### GET `/attendance`
**Query:**
```
page, limit
userId      string   uuid (manager+ can query other users)
dateFrom    string   YYYY-MM-DD
dateTo      string   YYYY-MM-DD
status      string   present | absent | half_day | leave | holiday
```

---

### GET `/attendance/team`
*Manager+ only*

**Query:** `dateFrom`, `dateTo`

---

### POST `/attendance/manual`
*Manager+ only*

**Request:**
```json
{
  "userId": "uuid",
  "date": "2024-12-24",
  "checkInTime": "09:00",
  "checkOutTime": "18:00",
  "status": "present",
  "notes": "Manual entry"
}
```

---

### POST `/attendance/leave`
**Request:**
```json
{
  "type": "sick",
  "startDate": "2024-12-26",
  "endDate": "2024-12-27",
  "reason": "Fever"
}
```

---

### GET `/attendance/leave/balance`
**Response 200:** LeaveBalance object

---

### POST `/attendance/leave/:id/review`
*Manager+ only*

**Request:**
```json
{
  "status": "approved",
  "note": "Approved — get well soon"
}
```
> `status`: `approved` or `rejected`

---

## NOTIFICATIONS `/notifications`

### GET `/notifications`
**Query:** `page`, `limit`, `isRead` (boolean), `type`

---

### GET `/notifications/unread-count`
**Response 200:**
```json
{ "data": { "count": 7 } }
```

---

### POST `/notifications/:id/read`
No body required.

---

### POST `/notifications/read-all`
No body required.

---

### DELETE `/notifications/delete-read`
Deletes all read notifications for the user. No body required.

---

## Password Rules
```
Min 8 characters
At least 1 uppercase letter (A-Z)
At least 1 lowercase letter (a-z)
At least 1 number (0-9)
At least 1 special character: !@#$%^&*(),.?":{}|<>
```

## Phone Rules
```
10 digits
Must start with 6, 7, 8, or 9
No country code prefix (just the 10 digits)
```
