# Lead Generation WebApp - Backend Flow and Frontend Integration Guide

Date: 2026-04-01
Scope: Backend implementation analysis for frontend planning

## 1) Product Context

This system is a multi-role lead generation platform for field collection and marketing conversion.

Primary actors:
- Admin: Full organization control, user management, metrics, form/campaign/target configuration
- Marketing Team: Lead follow-up, status progression, reminders, templates, conversion work
- Field Agents: Door-to-door data capture, lead creation, geo-tagged attendance/check-ins

Core idea supported by backend:
- Field teams collect leads (name, phone, interests, feedback, dynamic form fields, geolocation)
- Marketing teams process those leads and move them through pipeline stages
- Admin governs users, teams, forms, campaigns, and analytics

## 2) High-Level Architecture

Backend stack:
- Node.js + Express + TypeScript
- Prisma + PostgreSQL
- JWT auth with access and refresh tokens
- Role-based access control via middleware

API base:
- /api/v1

Major route groups:
- /auth
- /users
- /leads
- /forms
- /campaigns
- /templates
- /reminders
- /attendance
- /targets
- /teams
- /organizations
- /analytics
- /notifications

## 3) Role and Permission Model

Roles implemented:
- super_admin
- admin
- marketing_manager
- marketing_agent
- agent_supervisor
- field_agent

Observed behavior:
- Most endpoints require authentication
- Admin-only areas: user CRUD, many config/management operations, destructive actions
- Manager-level access appears in analytics, campaign management, target/team performance
- Agent-level scoping is enforced in services for data visibility:
  - field_agent: typically sees/acts on self-created records
  - marketing_agent: typically sees/acts on assigned records

Frontend implication:
- Build role-aware UI and navigation from day 1
- Do not rely only on hidden buttons; backend enforces permissions and can return 403

## 4) Core End-to-End Business Flows

### Flow A: Field Lead Capture
1. Field user authenticates.
2. User captures lead via /leads POST.
3. Payload can include:
   - basic identity (firstName, lastName, phone, email)
   - dynamic form data (formId + formData)
   - location fields (latitude, longitude, address, city, state, pincode)
   - optional assignee
4. Backend checks duplicate phone within organization.
5. Backend validates referenced form and assignee.
6. Lead is created with initial score and activity log entry.

Frontend requirements:
- Offline-friendly lead form for field use (recommended)
- Fast duplicate error handling (409)
- Capture geolocation and pass with consent/fallback UX

### Flow B: Marketing Follow-up and Conversion
1. Marketing users fetch filtered lead list (/leads GET).
2. Open lead details (/leads/:id GET).
3. Perform updates (/leads/:id PATCH):
   - status, priority, followUpAt, notes, assignee
4. Add communication activities (/leads/:id/activities POST).
5. Create reminders for next touchpoint (/reminders POST).
6. Use templates for preview/send where needed (/templates/...).

Frontend requirements:
- Lead timeline panel (activities + reminders)
- Status transition UX with audit visibility
- Quick actions (call, message, note)

### Flow C: Admin Governance
1. Create/activate/deactivate users (/users).
2. Build teams and assign members (/teams).
3. Build and publish dynamic forms (/forms).
4. Configure campaigns and assignment behavior (/campaigns).
5. Set targets and monitor performance (/targets + /analytics).
6. Track organization-level totals (/organizations/current/stats).

Frontend requirements:
- Admin console split by domains: users, teams, forms, campaigns, targets, org settings

### Flow D: Attendance and Fraud Prevention Support
1. Agent check-in/check-out via geo payload (/attendance/check-in, /attendance/check-out).
2. Attendance service computes lateness and working hours.
3. Team leads/managers use team and summary endpoints.
4. Leave lifecycle managed through attendance module leave endpoints.

Frontend requirements:
- Mobile-first attendance UI
- GPS capture and error fallback
- Late/on-time indicators

## 5) Lead Lifecycle (Pipeline)

States present in backend:
- new
- contacted
- qualified
- negotiation
- converted
- lost
- invalid
- junk

Operational interpretation:
- Typical path: new -> contacted -> qualified -> negotiation -> converted
- Non-success exits: lost, invalid, junk

Automation observed:
- Status changes create lead activity records
- contactedAt/convertedAt timestamps are set on relevant transitions
- Score recalculation hooks are present in lead service logic

Frontend guidance:
- Represent pipeline stages visually
- Show terminal outcomes distinctly (converted vs lost/invalid/junk)
- Surface timestamps and change history for trust/audit

## 6) Module-by-Module Integration Notes

### 6.1 Auth
Endpoints:
- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout
- POST /auth/logout-all
- POST /auth/change-password
- GET /auth/me

Notes:
- Registration creates organization + admin user
- Refresh token rotation is implemented (old token revoked, new one issued)
- Access + refresh token flow should be handled in frontend auth layer

### 6.2 Users
Endpoints:
- POST /users
- GET /users
- GET /users/:id
- PATCH /users/:id
- DELETE /users/:id (soft deactivation behavior in service)
- POST /users/:id/activate

Notes:
- Role hierarchy validation is enforced when creating/updating users
- Team/reporting assignments are validated against organization

### 6.3 Leads
Endpoints:
- POST /leads
- GET /leads
- GET /leads/stats
- GET /leads/:id
- PATCH /leads/:id
- DELETE /leads/:id
- POST /leads/:id/activities
- GET /leads/:id/activities
- POST /leads/bulk/assign
- POST /leads/bulk/status

Notes:
- Rich filtering + pagination supported
- Role-based data scoping implemented in service
- Duplicate phone checks on create and update

### 6.4 Forms (Dynamic Form Builder)
Endpoints:
- GET /forms/public/:id (public published form)
- POST /forms
- GET /forms
- GET /forms/:id
- PATCH /forms/:id
- DELETE /forms/:id
- POST /forms/:id/duplicate
- POST /forms/:id/toggle-publish

Notes:
- Field IDs must be unique
- Version increments when field definitions change
- Delete is blocked when form is used by leads

### 6.5 Campaigns
Endpoints include:
- CRUD and duplicate
- PATCH /campaigns/:id/status
- /campaigns/:id/stats
- /campaigns/:id/leads (+ add/remove)
- /campaigns/:id/auto-assign
- team/user assignment endpoints

Notes:
- Campaign supports settings + metadata patterns for targeting and assignment
- Route file naming has a leading-space filename quirk; avoid renaming casually without full import/path audit

### 6.6 Templates
Endpoints:
- CRUD + duplicate
- preview endpoints
- send and bulk-send endpoints

Notes:
- Variable extraction/rendering is implemented using placeholder syntax like {{firstName}}
- Sending currently logs behavior; provider integrations are extension points

### 6.7 Reminders
Endpoints:
- summary, overdue
- CRUD
- snooze, complete, cancel actions

Important implementation detail:
- Service still behaves like reminder metadata is not persisted in dedicated columns (priority/recurrence/channel fallback behavior)
- Prisma schema includes reminder columns, so this is a service-schema mismatch and should be normalized

### 6.8 Attendance + Leave
Endpoints:
- check-in/check-out/today
- records, summary, team, manual entry
- leave create/list/balance/review/cancel

Notes:
- Lateness threshold and working-hour logic are implemented
- Team summary and leave balances are available for manager/admin workflows

### 6.9 Targets
Endpoints:
- CRUD
- assign/unassign
- my-performance
- team/user performance
- leaderboard

Notes:
- Performance aggregates rely on target type/period windows
- Keep charts and ranking UI modular because metrics vary by target type

### 6.10 Teams
Endpoints:
- CRUD
- members list/add/remove

Notes:
- Team deletion blocked when members still attached
- Good candidate for admin roster management screens

### 6.11 Organizations
Endpoints:
- GET /organizations/current
- PATCH /organizations/current
- GET /organizations/current/stats

Notes:
- Stats here are aggregate totals; combine with analytics module for richer dashboards

### 6.12 Notifications
Endpoints:
- list/unread-count
- mark-read/read-all
- delete/delete-read

Notes:
- Notification feed can power top-nav inbox + toast system

### 6.13 Analytics
Endpoints:
- dashboard
- leads-by-status/source/priority
- leads-trend
- agent-performance
- top-performers
- conversion-funnel
- geographic-distribution

Notes:
- Manager+ access enforced
- Data is suited for KPI cards + charts + leaderboard widgets

## 7) Frontend Information Architecture (Recommended)

Primary app sections:
- Auth
- Leads
- Forms
- Campaigns
- Templates
- Reminders
- Attendance
- Teams
- Targets
- Analytics
- Users/Admin
- Organization Settings
- Notifications

Role-based menu examples:
- Field Agent: Leads (create + own list), attendance, reminders, profile
- Marketing Agent: Assigned leads, reminders, templates send, profile
- Manager/Supervisor: Team views, analytics, performance, campaign controls
- Admin: Full access + user/team/form/organization management

## 8) Data Contracts Frontend Should Standardize

Shared client models:
- AuthSession: user, accessToken, refreshToken, expiresIn
- LeadSummary + LeadDetail + LeadActivity
- DynamicForm + FormField + FormSettings
- Campaign + CampaignStats
- Reminder
- AttendanceRecord + LeaveRequest
- Target + Progress + LeaderboardEntry
- Notification
- Dashboard aggregates

Cross-cutting response handling:
- Paginated responses (page, limit, total)
- Conflict responses (409 duplicates)
- Permission responses (403)
- Validation errors (400)

## 9) Important Gaps and Risks to Track

1. Reminder service/schema mismatch:
- Service currently defaults priority/recurrence/channels instead of fully using schema columns.

2. Naming inconsistency in files:
- Mixed case and unusual filenames (for example campaigns route/type filenames with leading spaces) can create tooling and CI friction.

3. Route middleware signature inconsistency:
- Some requireRole calls pass array form while others pass variadic roles.
- Validate middleware utility supports both, or standardize usage.

4. Campaign metadata contract:
- Team/user assignments are largely metadata-driven. Ensure frontend treats campaign detail as source of truth for assignment views.

## 10) Frontend Build Plan (Practical Sequence)

Phase 1:
- Auth shell, token refresh interceptor, role-aware route guards

Phase 2:
- Leads list/detail/edit + activities + reminders + bulk ops

Phase 3:
- Admin foundations: users, teams, forms builder/publish

Phase 4:
- Campaign management + template preview/send

Phase 5:
- Attendance/leave mobile workflows

Phase 6:
- Targets + analytics dashboards + notifications polish

## 11) Final Summary for Frontend Team

You can confidently start frontend implementation now because backend already covers:
- Multi-role auth and RBAC
- Full lead lifecycle management
- Dynamic form builder with publish flow
- Campaign, reminders, templates, attendance, and target systems
- Analytics and notifications

Before production hardening, align backend on reminder persistence semantics and normalize filename/middleware consistency.
