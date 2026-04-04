# Users Module `/users`

**Visible to:** admin, super_admin only

---

## User List Page

```
┌───────────────────────────────────────────────────────────────────┐
│  Users  (25 members)                              [+ Add Member]  │
├───────────────────────────────────────────────────────────────────┤
│  [🔍 Search name, email, phone...]                                │
│  [Role ▼]  [Team ▼]  [Status ▼]  [Sort: Name ▼]  [⟳ Reset]      │
├───────────────────────────────────────────────────────────────────┤
│  Quick Tabs:  [All (25)]  [Active (22)]  [Inactive (3)]           │
├───────────────────────────────────────────────────────────────────┤
│  Avatar  Name/Email         Role          Team         Status [⋮] │
│  [RA]    Ravi Kumar         Field Agent   Delhi North  🟢 Active  │
│          ravi@co.com                                              │
│  [PS]    Priya Sharma       Mktg. Agent   Mumbai East  🟢 Active  │
│  [SM]    Sunil M.           Supervisor    Delhi North  🟢 Active  │
│  [AV]    Amit Verma         Admin         —            🟢 Active  │
│  [KJ]    Kiran J.           Mktg.Manager  —            🔴 Inactive│
├───────────────────────────────────────────────────────────────────┤
│  ← Prev   Page 1 of 2   Next →         Showing 20 of 25   [20▼]  │
└───────────────────────────────────────────────────────────────────┘
```

### Search
- Searches across: firstName, lastName, email, phone
- Maps to: `GET /users?search=`

### Filters

**Role Filter** (multi-select):
```
☐ Admin
☐ Marketing Manager
☐ Marketing Agent
☐ Agent Supervisor
☐ Field Agent
```

**Team Filter** (searchable single-select):
```
[🔍 Search team...]
○ Delhi North Team
○ Mumbai East Team
○ No Team (Unassigned)
```

**Status Filter:**
```
○ All  ○ Active  ○ Inactive
```

### Table Columns

| Column | Value | Width |
|--------|-------|-------|
| Avatar | Initials circle | 48px |
| Name & Email | Bold name + email below | 220px |
| Role | Role badge (colored) | 160px |
| Team | Team name or "—" | 150px |
| Leads | Assigned leads count | 80px |
| Status | Active/Inactive pill | 100px |
| Actions | `⋮` kebab | 60px |

### Role Badges
```
super_admin       Purple background
admin             Indigo background
marketing_manager Blue background
marketing_agent   Cyan background
agent_supervisor  Teal background
field_agent       Green background
```

### Row Actions (`⋮`)
```
View Profile
Edit
Reset Password (opens modal)
────────────────
Activate  (if inactive)
Deactivate (if active, not self)
```

---

## Create User Modal

**Trigger:** `[+ Add Member]` button

```
┌──────────────────────────────────────────────────┐
│  Add Team Member                            [×]  │
│  ────────────────────────────────────────────    │
│  First Name *         Last Name *                │
│  [______________]     [______________]           │
│                                                  │
│  Email Address *                                 │
│  [__________________________________]            │
│                                                  │
│  Phone Number                                    │
│  [__________________________________]            │
│                                                  │
│  Role *                                          │
│  [Dropdown: Field Agent ▼]                       │
│                                                  │
│  Team (optional)                                 │
│  [Dropdown: Select Team ▼]                       │
│                                                  │
│  Reports To (optional)                           │
│  [Search manager/supervisor... ▼]               │
│                                                  │
│  Password *                                      │
│  [______________________________] [👁]           │
│  OR  [⚡ Auto-generate password]                 │
│                                                  │
│  ☐ Send welcome email with login credentials    │
│  ────────────────────────────────────────────    │
│  [Cancel]                  [Create Member]       │
└──────────────────────────────────────────────────┘
```

### Field Details
| Field | Type | Required | Notes |
|-------|------|---------|-------|
| First Name | text | Yes | 2–50 chars |
| Last Name | text | Yes | 2–50 chars |
| Email | email | Yes | Must be unique platform-wide |
| Phone | tel | No | 10-digit Indian mobile |
| Role | select | Yes | All roles except super_admin |
| Team | searchable select | No | Teams in same org |
| Reports To | async search | No | Must be in same org, higher role |
| Password | password | Yes | 8+ chars, strong |
| Auto-generate | button | — | Generates strong password |
| Send email | checkbox | — | (frontend-only, implement email later) |

### Role Dropdown with Descriptions
```
Field Agent          → Collects leads in field
Marketing Agent      → Calls and manages telecalling leads
Agent Supervisor     → Manages field agents and reviews work
Marketing Manager    → Manages campaigns, reports, agents
Admin                → Full organization access
```

---

## User Detail Page `/users/:id`

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Users                               [Edit]  [Deactivate]      │
├──────────────────────────────────────────────────────────────────┤
│  [Avatar 80px]  Ravi Kumar                                       │
│                 🟢 Active   Field Agent                          │
│                 📧 ravi@company.com                               │
│                 📱 9876543210                                     │
│                 🏢 My Company → Delhi North Team                  │
│                 Last Login: Dec 24, 10:30 AM                     │
├──────────────────┬───────────────────────────────────────────────┤
│  STATS (3 cards) │  DETAILS PANEL                                │
│                  │                                               │
│  [Leads Created] │  Reporting To: Sunil M. (Supervisor)         │
│       45         │  Team: Delhi North                           │
│                  │  Joined: Dec 1, 2024                         │
│  [Leads Assigned]│  Email Verified: ✓                           │
│       52         │  Phone Verified: ✗                           │
│                  │                                               │
│  [Subordinates]  │  Subordinates:                               │
│        3         │  • Arun Kumar (Field Agent)                  │
│                  │  • Deepak S. (Field Agent)                   │
│                  │  [View all 3 →]                              │
├──────────────────┴───────────────────────────────────────────────┤
│  Recent Activity (leads assigned to this user)                   │
│  [Table: Lead Name  Status  Created  Assigned]                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Edit User Drawer

Same as Create User form, but:
- Email field is **read-only**
- No password field (separate "Reset Password" action)
- Shows current values pre-filled
- Additional field: **Avatar URL** (text input or upload)

---

## Reset Password Modal

```
┌──────────────────────────────────────────┐
│  Reset Password for Ravi Kumar      [×] │
│                                         │
│  New Password                           │
│  [___________________________] [👁]     │
│  OR  [⚡ Generate random password]      │
│                                         │
│  ☐ Send email to ravi@company.com       │
│                                         │
│  [Cancel]  [Reset Password]             │
└──────────────────────────────────────────┘
```

---

## Deactivate User Confirmation Modal

```
┌──────────────────────────────────────────────────┐
│  ⚠️  Deactivate User?                            │
│                                                  │
│  "Ravi Kumar" will no longer be able to          │
│  log in. Their leads and data will remain.       │
│  You can reactivate them at any time.            │
│                                                  │
│  [Cancel]            [Deactivate]                │
└──────────────────────────────────────────────────┘
```

Button "Deactivate" is red/danger color.
