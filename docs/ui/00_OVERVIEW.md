# Frontend UI Specification — Overview

This folder contains a complete UI blueprint for building the LeadGen platform frontend. Every screen, component, modal, form, chart, filter, and interaction is specified here.

---

## Document Index

| File | Contents |
|------|----------|
| `00_OVERVIEW.md` | This file — structure, design system, layout |
| `01_AUTH.md` | Login, Register, Change Password screens |
| `02_DASHBOARD.md` | Analytics dashboard (manager+ role) |
| `03_LEADS.md` | Lead list, detail, create/edit, activity timeline |
| `04_USERS.md` | User management (admin) |
| `05_TEAMS.md` | Team management (admin) |
| `06_ORGANIZATION.md` | Org settings, multi-tenancy |
| `07_CAMPAIGNS.md` | Campaign management |
| `08_TEMPLATES.md` | Message template builder and sender |
| `09_FORMS.md` | Dynamic form builder |
| `10_TARGETS.md` | KPI targets and leaderboard |
| `11_REMINDERS.md` | Lead follow-up reminders |
| `12_ATTENDANCE.md` | Attendance and leave management |
| `13_NOTIFICATIONS.md` | Notification inbox |
| `14_COMPONENTS.md` | Shared UI components (tables, modals, filters, etc.) |

---

## App Shell / Global Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  TOPBAR                                                         │
│  [☰ Sidebar toggle]  [App Logo]  [Search]  [🔔 N]  [Avatar ▼]  │
├──────────┬──────────────────────────────────────────────────────┤
│          │                                                      │
│ SIDEBAR  │  MAIN CONTENT AREA                                   │
│          │                                                      │
│ [Nav     │  [Page Header]                                       │
│  items   │  [Breadcrumb]                                        │
│  with    │                                                      │
│  icons   │  [Content: tables / forms / charts / modals]         │
│  and     │                                                      │
│  badges] │  [Pagination / Load more]                            │
│          │                                                      │
└──────────┴──────────────────────────────────────────────────────┘
```

---

## Sidebar Navigation

### Collapsed state: Icons only | Expanded state: Icon + Label + Badge

```
SIDEBAR ITEMS BY ROLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[🏠] Dashboard             manager+ only
[👥] Leads                 all roles
[⏰] Reminders             all roles   [badge: overdue count]
[📅] Attendance            all roles
─────────────────────────────────── section divider
[📣] Campaigns             all roles (view) / manager+ (manage)
[📝] Templates             all roles
[📋] Forms                 admin+ only
─────────────────────────────────── section divider
[🎯] Targets               all roles
[📊] Analytics             manager+ only
─────────────────────────────────── section divider
[🏢] Organization          admin+ only
[👤] Users                 admin+ only
[🤝] Teams                 admin+ only
─────────────────────────────────── section divider
[🔔] Notifications         all roles   [badge: unread count]
[⚙️] Settings              all roles   (profile, password)
```

**Sidebar behavior:**
- Collapsible (icon-only mode) — persist preference in localStorage
- Active route highlighted with accent background
- Hovering collapsed sidebar shows tooltip with label
- Badges update in real-time (poll unread counts every 30s)
- On mobile: drawer overlay, swipe-to-close

---

## Topbar

```
Left:   [☰] Hamburger (collapse sidebar)  |  [Logo + "LeadGen"]

Center: [ 🔍 Search leads, users, campaigns...          ]
        Global search — searches across leads, users, campaigns

Right:  [🔔] Notifications bell  (badge = unread count)
        [Avatar] User menu dropdown:
          - Profile photo + name + role badge
          ─────────
          - My Profile
          - Change Password
          - My Performance
          ─────────
          - Sign Out
          - Sign Out All Devices
```

**Global Search behavior:**
- Debounced (300ms) — searches as you type
- Shows dropdown results grouped by type: Leads, Users, Campaigns
- Keyboard navigable (arrow keys, Enter to open, Esc to close)
- Clicking result navigates to that entity's detail page

---

## Design System Tokens

### Colors
```
Primary:     #6366F1   (Indigo)
Success:     #10B981   (Green)
Warning:     #F59E0B   (Amber)
Danger:      #EF4444   (Red)
Info:        #3B82F6   (Blue)
Gray-50:     #F9FAFB
Gray-100:    #F3F4F6
Gray-900:    #111827
```

### Lead Status Colors
```
new          #3B82F6   Blue
contacted    #F59E0B   Amber
qualified    #6366F1   Indigo
negotiation  #F97316   Orange
converted    #10B981   Green
lost         #EF4444   Red
invalid      #9CA3AF   Gray
junk         #6B7280   Dark Gray
```

### Priority Colors
```
low          #9CA3AF   Gray
medium       #3B82F6   Blue
high         #F97316   Orange
urgent       #EF4444   Red
```

### Campaign Status Colors
```
draft        #9CA3AF   Gray
active       #10B981   Green
paused       #F59E0B   Amber
completed    #6366F1   Indigo
cancelled    #EF4444   Red
```

### Typography
```
Font family: Inter (primary), system-ui (fallback)
Heading XL:  28px / 700
Heading L:   22px / 600
Heading M:   18px / 600
Heading S:   16px / 600
Body:        14px / 400
Caption:     12px / 400
```

### Spacing
```
4px grid — use multiples: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
```

### Border radius
```
Buttons/inputs: 8px
Cards:          12px
Modals:         16px
Chips/badges:   9999px (pill)
```

---

## Standard Page Layout Pattern

Every list page follows this structure:

```
[Page Title]  [+ Primary Action Button]            ← Page header row
──────────────────────────────────────────────────
[🔍 Search...] [Filter ▼] [Status ▼] [Date ▼]  [⬇ Export]  ← Filter bar
──────────────────────────────────────────────────
[Summary chips: All(450)  New(120)  Converted(100)]   ← Quick filter tabs (optional)
──────────────────────────────────────────────────
┌─────────────────────────────────────────────────┐
│  TABLE / CARD GRID                              │
│  [checkbox] col1  col2  col3  col4  [Actions]   │
│  ...rows...                                     │
└─────────────────────────────────────────────────┘
──────────────────────────────────────────────────
← Previous   Page 2 of 8   Next →    20 per page ▼    ← Pagination
```

---

## Shared Component Specifications

### Status Badge / Pill
```
Design: Pill shape, colored dot + text
Props:  status string, size (sm/md)
States: all LeadStatus, CampaignStatus, attendance status, leave status
```

### Priority Badge
```
Design: Pill with background fill
Colors: low=gray, medium=blue, high=orange, urgent=red
```

### Role Badge
```
Design: Pill outline style
Colors: admin=purple, manager=indigo, agent=blue, field=green
```

### Avatar
```
Design: Circle, 32px/40px/48px
States: photo | initials (first+last letter) | placeholder icon
Tooltip: Full name on hover
```

### Empty State
```
Design: Centered illustration + heading + subtext + optional CTA button
Variants: no-data, no-results, no-permission, error
```

### Loading State
```
Table skeleton: animated gray rows matching column layout
Card skeleton:  animated gray cards
Full-page spinner: centered logo + spinner for auth-guarded routes
```

### Confirmation Modal
```
Design:  Small modal (400px wide)
Content: Warning icon + title + description + [Cancel] [Confirm (danger)]
Usage:   Delete, Deactivate, Cancel leave, Cancel reminder
```

### Toast Notifications
```
Position: Top-right, stacked
Types:    success (green), error (red), warning (amber), info (blue)
Duration: 4s auto-dismiss, manual close button
```
