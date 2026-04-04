# Frontend Developer Guide

Everything you need to build a frontend against this API.

---

## Table of Contents

1. [Authentication Flow](#1-authentication-flow)
2. [Token Management](#2-token-management)
3. [Role-Based UI](#3-role-based-ui)
4. [Pagination Pattern](#4-pagination-pattern)
5. [Error Handling](#5-error-handling)
6. [Module-by-Module Flows](#6-module-by-module-flows)
7. [Screen / Page Suggestions](#7-screen--page-suggestions)
8. [API Client Setup (Axios Example)](#8-api-client-setup-axios-example)

---

## 1. Authentication Flow

### Registration (First-Time Setup)
```
User fills:
  - Email, Password, First Name, Last Name, Phone
  - Organization Name

POST /auth/register
→ Receive { accessToken, refreshToken, user }
→ Store tokens
→ Redirect to Dashboard
```

### Login
```
POST /auth/login
→ Receive { accessToken, refreshToken, expiresIn, user }
→ Store: accessToken (memory or sessionStorage), refreshToken (localStorage)
→ Store user data for role-based rendering
→ Redirect to Dashboard
```

### Logout
```
POST /auth/logout  { refreshToken }
→ Clear stored tokens and user data
→ Redirect to Login
```

### Force Logout All Devices
```
POST /auth/logout-all
→ Useful for "Sign out everywhere" feature
```

---

## 2. Token Management

### Storage Strategy
```
accessToken  → In-memory (JS variable) or sessionStorage
               DO NOT store in localStorage (XSS risk)

refreshToken → localStorage or httpOnly cookie
```

### Token Lifecycle
```
Access token:   15 minutes (default)
Refresh token:  7 days (default)
```

### Auto-Refresh (Axios Interceptor Pattern)
```javascript
// On any 401 response, try to refresh
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true
      const newToken = await refreshAccessToken()
      error.config.headers.Authorization = `Bearer ${newToken}`
      return axiosInstance(error.config)
    }
    return Promise.reject(error)
  }
)

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken')
  const res = await axios.post('/api/v1/auth/refresh', { refreshToken })
  const { accessToken } = res.data.data
  setAccessToken(accessToken)   // Update your in-memory store
  return accessToken
}
```

### After Change Password
When user changes password, the API revokes ALL refresh tokens. On the next refresh attempt, the `401` will fail the retry loop too — redirect to login.

---

## 3. Role-Based UI

Store the `role` from the user object after login. Use it to show/hide UI elements.

### Role Constants
```javascript
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MARKETING_MANAGER: 'marketing_manager',
  MARKETING_AGENT: 'marketing_agent',
  AGENT_SUPERVISOR: 'agent_supervisor',
  FIELD_AGENT: 'field_agent',
}
```

### Helper Functions
```javascript
const isAdmin = (role) => ['admin', 'super_admin'].includes(role)
const isManager = (role) => ['marketing_manager', 'agent_supervisor', 'admin', 'super_admin'].includes(role)
const isMarketingTeam = (role) => ['marketing_manager', 'marketing_agent', 'admin', 'super_admin'].includes(role)
const isFieldTeam = (role) => ['agent_supervisor', 'field_agent', 'admin', 'super_admin'].includes(role)
```

### Navigation Visibility by Role

| Menu Item | field_agent | marketing_agent | agent_supervisor | marketing_manager | admin | super_admin |
|-----------|:-----------:|:---------------:|:----------------:|:-----------------:|:-----:|:-----------:|
| Dashboard | — | — | ✓ | ✓ | ✓ | ✓ |
| Leads | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| My Reminders | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Attendance | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Templates (view) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Templates (send) | — | ✓ | — | ✓ | ✓ | ✓ |
| Campaigns | ✓ (view) | ✓ (view) | ✓ | ✓ | ✓ | ✓ |
| Analytics | — | — | ✓ | ✓ | ✓ | ✓ |
| Targets / KPIs | ✓ (own) | ✓ (own) | ✓ | ✓ | ✓ | ✓ |
| Team Management | — | — | — | — | ✓ | ✓ |
| User Management | — | — | — | — | ✓ | ✓ |
| Org Settings | — | — | — | — | ✓ | ✓ |
| Forms Builder | — | — | — | — | ✓ | ✓ |

---

## 4. Pagination Pattern

Every list endpoint returns:
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Recommended URL State
```
/leads?page=2&limit=20&status=new,contacted&sortBy=createdAt&sortOrder=desc
```

### Infinite Scroll Pattern
Increment `page` on scroll-to-bottom. Append results to existing array. Stop when `hasNextPage = false`.

### Table Pagination
Show `Page X of Y` using `meta.page` and `meta.totalPages`. Show total count from `meta.total`.

---

## 5. Error Handling

### Standard Error Shape
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email address" },
    { "field": "phone", "message": "Phone number is required" }
  ]
}
```

### Status Code Handling
```javascript
switch (error.response.status) {
  case 400: // Show field errors from error.response.data.errors
  case 401: // Token expired → try refresh, else redirect to login
  case 403: // Show "You don't have permission" message
  case 404: // Show "Not found" page or toast
  case 409: // Conflict — usually "email already exists"
  case 422: // Validation error (business logic)
  case 429: // Rate limited — show "Too many requests, try again"
  case 500: // Generic error — show "Something went wrong"
}
```

### Form Error Mapping
```javascript
// Map API field errors to form field errors
function mapApiErrors(errors) {
  return errors.reduce((acc, { field, message }) => {
    acc[field] = message
    return acc
  }, {})
}
```

---

## 6. Module-by-Module Flows

### LEADS — Complete Pipeline Flow

```
1. CREATE LEAD
   POST /leads
   Fields: firstName (req), phone (req), source, priority, city, state,
           formData, notes, tags, GPS coordinates, assignedToId

2. VIEW LEAD LIST
   GET /leads?status=new,contacted&sortBy=createdAt&sortOrder=desc
   Role scoping is automatic (agents see only their leads)

3. UPDATE STATUS
   PATCH /leads/:id  { "status": "contacted" }
   Optionally add activity: POST /leads/:id/activities { type: "call", title: "..." }

4. ADD REMINDER
   POST /reminders { leadId, title, reminderAt }

5. SEND TEMPLATE
   POST /templates/send { templateId, leadId }

6. CONVERT
   PATCH /leads/:id { "status": "converted", "dealValue": 50000 }

7. VIEW TIMELINE
   GET /leads/:id/activities (all activities in chronological order)
```

---

### AUTHENTICATION & USER ONBOARDING Flow

```
New Organization:
  POST /auth/register → admin user + org created → Dashboard

Add Team Members:
  POST /users (admin) → creates user accounts
  POST /teams → creates teams
  POST /teams/:id/members → adds users to teams

User First Login:
  POST /auth/login → receive tokens
  GET /auth/me → load user profile
```

---

### CAMPAIGNS Flow

```
1. Create campaign (manager):
   POST /campaigns { name, type, startDate, endDate, formId, settings }

2. Assign teams/users:
   POST /campaigns/:id/teams { teamIds: [...] }
   POST /campaigns/:id/users { userIds: [...] }

3. Activate:
   PATCH /campaigns/:id/status { status: "active" }

4. Field agents collect leads with campaign context
   POST /leads { formId: campaignFormId, ... }
   Leads are linked to campaign via formId

5. Track progress:
   GET /campaigns/:id/stats

6. Auto-assign if needed:
   POST /campaigns/:id/auto-assign

7. Complete:
   PATCH /campaigns/:id/status { status: "completed" }
```

---

### TARGETS & KPIs Flow

```
1. Admin creates target:
   POST /targets { name, type: "leads_collected", period: "monthly", value: 100 }

2. Assign to teams/users:
   POST /targets/assign { targetId, teamIds, userIds }

3. View own performance:
   GET /targets/my-performance
   → Shows progress for all assigned targets with status (on_track/behind/achieved)

4. View team performance (manager):
   GET /targets/team/:teamId/performance

5. Leaderboard:
   GET /targets/leaderboard?type=leads_collected&period=monthly
```

---

### ATTENDANCE Flow (Field Agent Daily)

```
Morning:
  POST /attendance/check-in { latitude, longitude, address }
  → Error if already checked in today

During Day:
  GET /attendance/today → shows current status

End of Day:
  POST /attendance/check-out { latitude, longitude }

Apply Leave:
  POST /attendance/leave { type: "sick", startDate, endDate, reason }

Check Balance:
  GET /attendance/leave/balance

Manager Approves:
  GET /attendance/leave (see pending requests)
  POST /attendance/leave/:id/review { status: "approved", note: "..." }
```

---

### REMINDERS Flow

```
Dashboard Widget:
  GET /reminders/summary → { overdue: 3, dueToday: 5, upcoming: 12 }

Reminder List:
  GET /reminders?status=pending&sortBy=reminderAt&sortOrder=asc

Overdue Alert:
  GET /reminders?isOverdue=true

Actions:
  POST /reminders/:id/snooze { snoozeMinutes: 30 }
  POST /reminders/:id/complete { note: "Called, interested" }
     → Also creates a follow_up activity on the lead automatically
  POST /reminders/:id/cancel
```

---

### NOTIFICATIONS Flow

```
Badge Count:
  GET /notifications/unread-count (poll every 30s or on focus)

Notification Drawer:
  GET /notifications?isRead=false

Mark Read:
  POST /notifications/:id/read  (single)
  POST /notifications/read-all   (all)

Clear Read:
  DELETE /notifications/delete-read
```

---

### FORMS Flow

```
Admin Creates Form:
  POST /forms { name, fields: [{ id, type, label, order, ... }] }

Publish Form:
  POST /forms/:id/toggle-publish

Public Form (lead collection page, no auth):
  GET /forms/public/:id → returns form fields
  POST /leads { formId: "uuid", formData: { "fieldId": "value", ... } }

Form Analytics:
  GET /analytics/leads-by-source  (see how many leads came via forms)
```

---

## 7. Screen / Page Suggestions

### Authentication Screens
- `/login` — Email + password form
- `/register` — Registration with org creation
- `/change-password` — Change password (authenticated)

### Dashboard
- `/dashboard` — Stats cards: leads today, conversion rate, reminders due
  - Visible to: manager+ roles
  - Data: `GET /analytics/dashboard`, `GET /reminders/summary`

### Leads Module
- `/leads` — Searchable, filterable table with status pills
  - Filters: status, source, priority, assignedTo, date range
- `/leads/new` — Create lead form (mandatory: firstName, phone)
- `/leads/:id` — Lead detail with activity timeline, reminders, status history
- `/leads/:id/edit` — Edit lead

### Users Module (Admin only)
- `/users` — Users table with role badges, active/inactive toggle
- `/users/new` — Create user form
- `/users/:id` — User detail with lead stats, team info

### Teams Module (Admin only)
- `/teams` — Teams list with member counts
- `/teams/new` — Create team
- `/teams/:id` — Team detail with members list, add/remove member

### Campaigns
- `/campaigns` — Campaign cards with status badges
- `/campaigns/new` — Campaign creation wizard
- `/campaigns/:id` — Campaign detail: stats, leads list, team assignments
- `/campaigns/:id/leads` — Paginated leads within campaign

### Templates
- `/templates` — Template grid/list with channel badges
- `/templates/new` — Template editor with variable preview
- `/templates/:id` — Template detail with usage stats
- `/templates/:id/send` — Send / bulk send interface

### Analytics (Manager+)
- `/analytics` — Tabbed: Overview, Trends, Agent Performance, Geography
  - Overview: `GET /analytics/dashboard`
  - Status chart: `GET /analytics/leads-by-status`
  - Trend chart: `GET /analytics/leads-trend?startDate=&endDate=`
  - Agent table: `GET /analytics/agent-performance`
  - Map/table: `GET /analytics/geographic-distribution`

### Targets / KPIs
- `/targets` — Target cards with progress bars
- `/targets/leaderboard` — Leaderboard table with ranks
- `/targets/:id` — Target detail with team/user assignment table
- `/my-performance` — Personal performance dashboard (all roles)

### Attendance
- `/attendance` — Calendar/table view of attendance
- `/attendance/check-in` — Check-in screen with map
- `/attendance/leave` — Leave request form + history
- `/attendance/leave/balance` — Leave balance cards
- `/attendance/team` — Team attendance (manager+)

### Reminders
- `/reminders` — Reminder list sorted by due time, overdue highlighted
- Quick actions: snooze, complete, cancel inline

### Notifications
- Notification drawer/panel accessible from header
- `/notifications` — Full notifications page

### Organization Settings (Admin+)
- `/settings/organization` — Name, logo, timezone, working hours
- `/settings/users` — Alias of `/users`
- `/settings/teams` — Alias of `/teams`
- `/settings/forms` — Form builder list

---

## 8. API Client Setup (Axios Example)

```javascript
// api/client.js
import axios from 'axios'

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'

let accessToken = null

export const setAccessToken = (token) => { accessToken = token }
export const getAccessToken = () => accessToken

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request
api.interceptors.request.use(config => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Auto-refresh on 401
let isRefreshing = false
let refreshQueue = []

api.interceptors.response.use(
  res => res.data,   // Unwrap { success, data, meta } → caller gets the full envelope
  async err => {
    const originalReq = err.config

    if (err.response?.status === 401 && !originalReq._retry) {
      if (isRefreshing) {
        // Queue this request to retry after refresh
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject })
        }).then(token => {
          originalReq.headers.Authorization = `Bearer ${token}`
          return api(originalReq)
        })
      }

      originalReq._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
        const newToken = res.data.data.accessToken
        setAccessToken(newToken)
        refreshQueue.forEach(p => p.resolve(newToken))
        refreshQueue = []
        originalReq.headers.Authorization = `Bearer ${newToken}`
        return api(originalReq)
      } catch (refreshErr) {
        refreshQueue.forEach(p => p.reject(refreshErr))
        refreshQueue = []
        localStorage.removeItem('refreshToken')
        setAccessToken(null)
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err.response?.data || err)
  }
)

export default api
```

### Usage Examples
```javascript
import api from './api/client'

// Login
const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password })
  setAccessToken(data.accessToken)
  localStorage.setItem('refreshToken', data.refreshToken)
  return data.user
}

// List leads with filters
const getLeads = (filters = {}) =>
  api.get('/leads', { params: filters })

// Create lead
const createLead = (payload) =>
  api.post('/leads', payload)

// Get paginated data pattern
const [page, setPage] = useState(1)
const { data: leads, meta } = await api.get('/leads', {
  params: { page, limit: 20, status: 'new' }
})
```

---

## Key Frontend Considerations

### Multi-Tenancy
- All data is automatically scoped to the logged-in user's organization
- `organizationId` comes from the JWT — you never need to send it
- `super_admin` users can see everything; frontend should handle this edge case if building an admin panel

### Geolocation
- Attendance check-in, lead collection can capture GPS
- Use `navigator.geolocation.getCurrentPosition()`
- Store as `latitude` (number) and `longitude` (number)

### Offline Support (Field Agents)
- Field agents may work in areas with poor connectivity
- Consider queueing lead creates locally (IndexedDB / localStorage) and syncing when online
- Attendance check-in/out is time-sensitive — sync immediately on reconnection

### Real-Time Considerations
- No WebSocket support in current API — use polling
- Notifications: `GET /notifications/unread-count` every 30 seconds
- Reminders: Refresh `GET /reminders/summary` every 5 minutes
- If you need real-time, consider adding Socket.io or Server-Sent Events layer

### Image / File Uploads
- Currently no file upload endpoint
- For lead photos or attachments, use a third-party storage (S3, Cloudinary) and store the URL in `formData` or `notes`

### Date/Time Handling
- All dates are in ISO 8601 format: `2024-12-25T10:00:00.000Z`
- Use `dayjs` or `date-fns` for parsing and formatting
- Timezone: Store and display in the org's configured timezone (`settings.timezone`)
- For dates without time (leave dates), use `YYYY-MM-DD` format

### Phone Number Format
- Backend validates: 10 digits, starts with 6–9
- Strip spaces/dashes before sending
- Display with country code: `+91 XXXXX XXXXX`

### Lead Status Color Coding (Suggested)
```
new          → Blue     (#3B82F6)
contacted    → Yellow   (#F59E0B)
qualified    → Indigo   (#6366F1)
negotiation  → Orange   (#F97316)
converted    → Green    (#10B981)
lost         → Red      (#EF4444)
invalid      → Gray     (#9CA3AF)
junk         → Gray     (#6B7280)
```

### Priority Color Coding (Suggested)
```
low          → Gray     (#9CA3AF)
medium       → Blue     (#3B82F6)
high         → Orange   (#F97316)
urgent       → Red      (#EF4444)
```
