# Roles & Permissions

## Role Hierarchy

```
Level 100  super_admin       — Cross-org, full platform control
Level 80   admin             — Full control within own organization
Level 60   marketing_manager — Manage leads, campaigns, agents
Level 60   agent_supervisor  — Manage field agents, attendance
Level 40   marketing_agent   — Create/work leads, run templates
Level 40   field_agent       — Collect leads in field, check-in
```

Higher level roles **inherit** access to everything lower-level roles can do (enforced via `requireMinRole`), except where specific role checks are used.

---

## Per-Module Access Control

### AUTH `/api/v1/auth`

| Endpoint | Method | Auth Required | Allowed Roles |
|----------|--------|--------------|---------------|
| `/register` | POST | No | Public |
| `/login` | POST | No | Public |
| `/refresh` | POST | No | Public (refresh token) |
| `/logout` | POST | Yes | Any authenticated |
| `/logout-all` | POST | Yes | Any authenticated |
| `/change-password` | POST | Yes | Any authenticated |
| `/me` | GET | Yes | Any authenticated |

---

### USERS `/api/v1/users`

| Endpoint | Method | Auth Required | Allowed Roles |
|----------|--------|--------------|---------------|
| `/` | POST | Yes | admin, super_admin |
| `/` | GET | Yes | admin, super_admin |
| `/:id` | GET | Yes | admin, super_admin |
| `/:id` | PATCH | Yes | admin, super_admin |
| `/:id` | DELETE | Yes | admin, super_admin |
| `/:id/activate` | POST | Yes | admin, super_admin |

> **Note:** A user cannot delete or deactivate themselves. Super admin cannot be deleted.

---

### LEADS `/api/v1/leads`

| Endpoint | Method | Auth Required | Allowed Roles |
|----------|--------|--------------|---------------|
| `/` | POST | Yes | All authenticated roles |
| `/` | GET | Yes | All authenticated roles (scoped by role) |
| `/stats` | GET | Yes | marketing_manager, agent_supervisor, admin, super_admin |
| `/bulk/assign` | POST | Yes | marketing_manager, agent_supervisor, admin, super_admin |
| `/bulk/status` | POST | Yes | marketing_manager, agent_supervisor, admin, super_admin |
| `/:id` | GET | Yes | All authenticated (own org, own leads for agents) |
| `/:id` | PATCH | Yes | All authenticated (own leads or manager+) |
| `/:id` | DELETE | Yes | admin, super_admin |
| `/:id/activities` | POST | Yes | All authenticated |
| `/:id/activities` | GET | Yes | All authenticated |

**Role-scoped data access:**
- `field_agent`, `marketing_agent` — See only leads they created or are assigned to
- `agent_supervisor`, `marketing_manager` — See leads of their team members
- `admin`, `super_admin` — See all org leads

---

### TEAMS `/api/v1/teams`

| Endpoint | Method | Auth Required | Allowed Roles |
|----------|--------|--------------|---------------|
| `/` | POST | Yes | admin, super_admin |
| `/` | GET | Yes | All authenticated |
| `/:id` | GET | Yes | All authenticated |
| `/:id` | PATCH | Yes | admin, super_admin |
| `/:id` | DELETE | Yes | admin, super_admin |
| `/:id/members` | GET | Yes | All authenticated |
| `/:id/members` | POST | Yes | admin, super_admin |
| `/:id/members/:userId` | DELETE | Yes | admin, super_admin |

---

### ORGANIZATION `/api/v1/organizations`

| Endpoint | Method | Auth Required | Allowed Roles |
|----------|--------|--------------|---------------|
| `/current` | GET | Yes | All authenticated |
| `/current` | PATCH | Yes | admin, super_admin |
| `/current/stats` | GET | Yes | All authenticated |

---

### ANALYTICS `/api/v1/analytics`

| Endpoint | Method | Auth Required | Allowed Roles |
|----------|--------|--------------|---------------|
| `/dashboard` | GET | Yes | marketing_manager, agent_supervisor, admin, super_admin |
| `/leads-by-status` | GET | Yes | marketing_manager, agent_supervisor, admin, super_admin |
| `/leads-by-source` | GET | Yes | marketing_manager, agent_supervisor, admin, super_admin |
| `/leads-by-priority` | GET | Yes | marketing_manager, agent_supervisor, admin, super_admin |
| `/leads-trend` | GET | Yes | marketing_manager, agent_supervisor, admin, super_admin |
| `/agent-performance` | GET | Yes | marketing_manager, agent_supervisor, admin, super_admin |
| `/top-performers` | GET | Yes | marketing_manager, agent_supervisor, admin, super_admin |
| `/conversion-funnel` | GET | Yes | marketing_manager, agent_supervisor, admin, super_admin |
| `/geographic-distribution` | GET | Yes | marketing_manager, agent_supervisor, admin, super_admin |

---

### TARGETS `/api/v1/targets`

| Endpoint | Method | Auth Required | Allowed Roles |
|----------|--------|--------------|---------------|
| `/` | POST | Yes | admin, super_admin |
| `/` | GET | Yes | All authenticated |
| `/my-performance` | GET | Yes | All authenticated |
| `/leaderboard` | GET | Yes | All authenticated |
| `/:id` | GET | Yes | All authenticated |
| `/:id` | PATCH | Yes | admin, super_admin |
| `/:id` | DELETE | Yes | admin, super_admin |
| `/assign` | POST | Yes | admin, super_admin |
| `/:id/unassign` | POST | Yes | admin, super_admin |
| `/team/:teamId/performance` | GET | Yes | marketing_manager, agent_supervisor, admin, super_admin |
| `/user/:userId/performance` | GET | Yes | marketing_manager, agent_supervisor, admin, super_admin |

---

### CAMPAIGNS `/api/v1/campaigns`

| Endpoint | Method | Auth Required | Allowed Roles |
|----------|--------|--------------|---------------|
| `/` | POST | Yes | marketing_manager, admin, super_admin |
| `/` | GET | Yes | All authenticated |
| `/:id` | GET | Yes | All authenticated |
| `/:id` | PATCH | Yes | marketing_manager, admin, super_admin |
| `/:id` | DELETE | Yes | admin, super_admin |
| `/:id/duplicate` | POST | Yes | marketing_manager, admin, super_admin |
| `/:id/status` | PATCH | Yes | marketing_manager, admin, super_admin |
| `/:id/stats` | GET | Yes | All authenticated |
| `/:id/leads` | GET | Yes | All authenticated |
| `/:id/leads` | POST | Yes | marketing_manager, admin, super_admin |
| `/:id/leads/remove` | POST | Yes | marketing_manager, admin, super_admin |
| `/:id/auto-assign` | POST | Yes | marketing_manager, admin, super_admin |
| `/:id/teams` | POST | Yes | marketing_manager, admin, super_admin |
| `/:id/teams/remove` | POST | Yes | marketing_manager, admin, super_admin |
| `/:id/users` | POST | Yes | marketing_manager, admin, super_admin |
| `/:id/users/remove` | POST | Yes | marketing_manager, admin, super_admin |

---

### TEMPLATES `/api/v1/templates`

| Endpoint | Method | Auth Required | Allowed Roles |
|----------|--------|--------------|---------------|
| `/` | POST | Yes | marketing_manager, admin, super_admin |
| `/` | GET | Yes | All authenticated |
| `/:id` | GET | Yes | All authenticated |
| `/:id` | PATCH | Yes | marketing_manager, admin, super_admin |
| `/:id` | DELETE | Yes | admin, super_admin |
| `/:id/duplicate` | POST | Yes | marketing_manager, admin, super_admin |
| `/preview` | POST | Yes | All authenticated |
| `/preview/lead/:leadId` | POST | Yes | All authenticated |
| `/send` | POST | Yes | marketing_manager, marketing_agent, admin, super_admin |
| `/send/bulk` | POST | Yes | marketing_manager, marketing_agent, admin, super_admin |

---

### REMINDERS `/api/v1/reminders`

| Endpoint | Method | Auth Required | Allowed Roles |
|----------|--------|--------------|---------------|
| `/summary` | GET | Yes | All authenticated (own data) |
| `/overdue` | GET | Yes | marketing_manager, agent_supervisor, admin, super_admin |
| `/` | POST | Yes | All authenticated |
| `/` | GET | Yes | All authenticated (role-scoped) |
| `/:id` | GET | Yes | All authenticated (own or manager) |
| `/:id` | PATCH | Yes | All authenticated (own or manager) |
| `/:id` | DELETE | Yes | All authenticated (own or manager) |
| `/:id/snooze` | POST | Yes | All authenticated (own or manager) |
| `/:id/complete` | POST | Yes | All authenticated (own or manager) |
| `/:id/cancel` | POST | Yes | All authenticated (own or manager) |

**Role-scoped visibility:**
- Agents see only their own reminders
- Managers/supervisors see their team members' reminders
- Admins see all org reminders

---

### ATTENDANCE `/api/v1/attendance`

| Endpoint | Method | Auth Required | Allowed Roles |
|----------|--------|--------------|---------------|
| `/check-in` | POST | Yes | All authenticated |
| `/check-out` | POST | Yes | All authenticated |
| `/today` | GET | Yes | All authenticated |
| `/` | GET | Yes | All (own) / marketing_manager, agent_supervisor, admin (team) |
| `/summary` | GET | Yes | All authenticated (own) |
| `/team` | GET | Yes | marketing_manager, agent_supervisor, admin, super_admin |
| `/manual` | POST | Yes | marketing_manager, agent_supervisor, admin, super_admin |
| `/leave` | POST | Yes | All authenticated |
| `/leave` | GET | Yes | All authenticated |
| `/leave/balance` | GET | Yes | All authenticated |
| `/leave/:id/review` | POST | Yes | marketing_manager, agent_supervisor, admin, super_admin |
| `/leave/:id/cancel` | POST | Yes | Owner or manager |

---

### NOTIFICATIONS `/api/v1/notifications`

| Endpoint | Method | Auth Required | Allowed Roles |
|----------|--------|--------------|---------------|
| `/` | GET | Yes | All (own only) |
| `/unread-count` | GET | Yes | All (own only) |
| `/:id/read` | POST | Yes | Owner only |
| `/read-all` | POST | Yes | All (own only) |
| `/:id` | DELETE | Yes | Owner only |
| `/delete-read` | DELETE | Yes | All (own only) |

---

## Business Rules / Restrictions

### Users
- Email must be unique across the entire platform
- Phone must be unique within an organization
- Cannot deactivate yourself
- Cannot delete/deactivate the last super_admin
- Assigning `teamId` must be a team in the same organization
- `reportingToId` must be a user in the same organization

### Leads
- Phone is required, must be valid 10-digit Indian mobile
- `assignedToId` must be a user in the same organization
- Status transitions are unrestricted (any to any allowed)
- Bulk assign: max leads per operation is not explicitly limited
- Activities are append-only (no delete on activities)
- `formId` must be a published form in the same org

### Targets
- `startDate` must be before `endDate`
- Target value must be positive
- Team/User assignments use `skipDuplicates` (idempotent)
- Custom value overrides the target's base value for that assignee

### Campaigns
- Cannot activate a campaign that requires a form if no form is linked
- Status transitions: `draft → active → paused → completed/cancelled`
- Cannot activate if `formRequired = true` and no formId set
- Auto-assign respects `autoAssignStrategy` (round_robin / least_loaded / manual)

### Templates
- `subject` is required for `email` channel
- Variable syntax: `{{variableName}}` — auto-extracted on create/update
- Bulk send: max 200 leads per request

### Reminders
- Snooze options: 15, 30, 60, 120 minutes, or 1440 (1 day)
- Completing a reminder automatically logs a `follow_up` activity on the lead
- Cannot modify a cancelled reminder
- Recurring reminders create the next occurrence on completion

### Attendance
- Can only check in once per day (no duplicate check-in)
- Must check in before checking out
- Manual attendance entry bypasses the single check-in restriction (admin only)
- Leave balance is tracked per year; balance resets annually
- Leave requests must be reviewed before taking effect

### Organization
- Organization slug is immutable after creation
- Settings are merged (not replaced) on PATCH
