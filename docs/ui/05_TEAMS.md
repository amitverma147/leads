# Teams Module `/teams`

**Visible to:** All roles (read) | admin, super_admin (write)

---

## Team List Page

```
┌────────────────────────────────────────────────────────────────────┐
│  Teams  (6 teams)                                  [+ Create Team] │
├────────────────────────────────────────────────────────────────────┤
│  [🔍 Search teams...]   [Type ▼]  [Status ▼]  [Sort: Name ▼]       │
├────────────────────────────────────────────────────────────────────┤
│  CARD GRID  (2 or 3 columns depending on viewport)                 │
│                                                                    │
│  ┌──────────────────────┐  ┌──────────────────────┐               │
│  │ 🤝 Field             │  │ 📣 Marketing         │               │
│  │ Delhi North Team     │  │ Mumbai East Team     │               │
│  │ ─────────────────    │  │ ─────────────────    │               │
│  │ 👥 8 members         │  │ 👥 5 members         │               │
│  │ 📋 234 leads         │  │ 📋 189 leads         │               │
│  │ 🟢 Active            │  │ 🟢 Active            │               │
│  │                      │  │                      │               │
│  │ [View] [Edit] [⋮]    │  │ [View] [Edit] [⋮]    │               │
│  └──────────────────────┘  └──────────────────────┘               │
│                                                                    │
│  ┌──────────────────────┐  ┌──────────────────────┐               │
│  │ 🤝 Field             │  │ 📣 Marketing         │               │
│  │ Delhi South Team     │  │ Telecalling Unit     │               │
│  │ ─────────────────    │  │ ─────────────────    │               │
│  │ 👥 6 members         │  │ 👥 12 members        │               │
│  │ 📋 178 leads         │  │ 📋 456 leads         │               │
│  │ 🟢 Active            │  │ 🔴 Inactive          │               │
│  │                      │  │                      │               │
│  │ [View] [Edit] [⋮]    │  │ [View] [Edit] [⋮]    │               │
│  └──────────────────────┘  └──────────────────────┘               │
├────────────────────────────────────────────────────────────────────┤
│  ← Prev   Page 1 of 1   Next →              Showing 6 of 6        │
└────────────────────────────────────────────────────────────────────┘
```

**Alternatively:** Table view (toggle between card/table with icon buttons top-right)

### Filters
**Type Filter:**
```
○ All  ○ Field  ○ Marketing
```

**Status Filter:**
```
○ All  ○ Active  ○ Inactive
```

### Team Card Design
```
┌──────────────────────────────────┐
│  [type icon]  [type badge]       │  ← "Field" or "Marketing" badge
│  Team Name                       │  ← 16px bold
│  Description (1 line, truncated) │  ← 12px gray
│  ──────────────────────────────  │
│  👥 8 members    📋 234 leads    │  ← Stats row
│  ──────────────────────────────  │
│  [Status pill]                   │
│  [View Details] [Edit]  [⋮]      │  ← Buttons row
└──────────────────────────────────┘
```

### Card Kebab Menu (`⋮`)
```
View Details
Edit Team
Add Members
──────────────
Deactivate Team (if active)
Activate Team   (if inactive)
Delete Team     (red, confirm modal)
```

---

## Team Detail Page `/teams/:id`

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Teams                                        [Edit Team]  [⋮]    │
├──────────────────────────────────────────────────────────────────────┤
│  HEADER                                                              │
│  🤝 Field Team                                                       │
│  Delhi North Team                         🟢 Active                  │
│  Covers Delhi NCR region — 8 members · 234 leads                    │
├─────────────────────────────────┬────────────────────────────────────┤
│  MEMBERS TABLE (60%)            │  TEAM STATS (40%)                  │
│                                 │                                    │
│  [+ Add Member]    [🔍 Search]  │  ┌───────┐ ┌───────┐ ┌────────┐  │
│                                 │  │  234  │ │  45   │ │ 19.2%  │  │
│  Avatar  Name       Role   Date │  │ Leads │ │ Conv. │ │  Rate  │  │
│  [RA]    Ravi K.   Agent  Dec1  │  └───────┘ └───────┘ └────────┘  │
│  [SM]    Sunil M.  Supvr  Nov15 │                                    │
│  [DK]    Deepak K. Agent  Dec5  │  Lead Status Breakdown            │
│  [AK]    Arun K.   Agent  Dec3  │  [Mini donut chart]               │
│  ...                            │                                    │
│                                 │  Top Member                       │
│  [Remove ×] on each row         │  🏆 Ravi K.  45 leads            │
│  (admin only, confirm modal)    │  24% conversion                   │
└─────────────────────────────────┴────────────────────────────────────┘
```

### Members Table Columns
| Column | Value |
|--------|-------|
| Avatar | Initials circle |
| Name | Full name (link to user profile) |
| Role | Role badge |
| Leads Assigned | Count |
| Joined Team | Date |
| Actions | Remove button (admin only) |

### Add Member Modal
```
┌───────────────────────────────────────────┐
│  Add Members to Delhi North Team     [×] │
│                                          │
│  [🔍 Search by name, email, role...]     │
│                                          │
│  [RA] Ravi Kumar       Field Agent  [+] │
│  [PS] Priya Sharma     Mktg Agent   [+] │
│  [DK] Deepak Kumar     Field Agent  [+] │
│                                          │
│  ✓ Selected: Ravi Kumar, Priya Sharma    │
│                                          │
│  [Cancel]   [Add 2 Members]              │
└───────────────────────────────────────────┘
```
- Multi-select: can add multiple members at once
- Only shows users in the same org who are NOT already in this team
- Maps to: `POST /teams/:id/members` (called once per user)

### Remove Member Confirmation Modal
```
┌─────────────────────────────────────────────────┐
│  Remove from Team?                              │
│                                                 │
│  "Ravi Kumar" will be removed from             │
│  "Delhi North Team". Their leads and data       │
│  will remain. They can be added again later.    │
│                                                 │
│  [Cancel]            [Remove]                   │
└─────────────────────────────────────────────────┘
```

---

## Create / Edit Team Modal

**Trigger:** `[+ Create Team]` or `[Edit Team]`

```
┌──────────────────────────────────────────────────┐
│  Create New Team                            [×] │
│  ──────────────────────────────────────────     │
│  Team Name *                                    │
│  [__________________________________]           │
│                                                 │
│  Team Type *                                    │
│  ○ 🤝 Field Team                               │
│    For field agents collecting leads in person  │
│  ○ 📣 Marketing Team                           │
│    For telecalling, email, social campaigns     │
│                                                 │
│  Description                                    │
│  [multiline, 3 rows]                            │
│  ──────────────────────────────────────────     │
│  [Cancel]                  [Create Team]        │
└──────────────────────────────────────────────────┘
```

### Field Details
| Field | Type | Required | Validation |
|-------|------|---------|-----------|
| Team Name | text | Yes | 2–100 chars, unique within org |
| Team Type | radio | Yes | `field` or `marketing` |
| Description | textarea | No | max 500 chars |

### Delete Team Confirmation Modal
```
┌──────────────────────────────────────────────────────┐
│  ⚠️  Delete Team?                                    │
│                                                      │
│  Deleting "Delhi North Team" will:                   │
│  • Remove all 8 members from this team               │
│  • Their leads and activities will not be deleted    │
│  • This action cannot be undone                      │
│                                                      │
│  Type the team name to confirm:                      │
│  [__________________________]                        │
│                                                      │
│  [Cancel]                [Delete Team]               │
└──────────────────────────────────────────────────────┘
```
- "Delete Team" button disabled until team name typed correctly
