# Leads Module

---

## Lead List Page `/leads`

**Data:** `GET /leads` (role-scoped automatically)

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Leads  (1,450 total)                          [+ Add Lead]         │
├─────────────────────────────────────────────────────────────────────┤
│  [🔍 Search name, phone, email...]                                  │
│  [Status ▼] [Source ▼] [Priority ▼] [Assigned To ▼] [Date ▼] [⟳]  │
├─────────────────────────────────────────────────────────────────────┤
│  Quick Tabs:                                                        │
│  [All (1450)] [New (120)] [Contacted (80)] [Follow-up Due (5)]      │
├─────────────────────────────────────────────────────────────────────┤
│  [☐] Sort header row                                                │
│  [☐] Name/Phone    Status      Priority   Assigned To  Created  [⋮] │
│  [☐] Priya Sharma  🔵 New      🟠 High    Ravi K.      2h ago   [⋮] │
│  [☐] Raj Mehta     🟡 Cont.   🔵 Medium  Sunil M.     Yesterday[⋮] │
│  ...                                                                │
├─────────────────────────────────────────────────────────────────────┤
│  Bulk bar (shows when rows selected):                               │
│  3 selected  [Assign To ▼] [Change Status ▼] [Clear]               │
├─────────────────────────────────────────────────────────────────────┤
│  ← Prev   Page 2 of 73   Next →         Showing 20 of 1,450  [20▼] │
└─────────────────────────────────────────────────────────────────────┘
```

### Search Bar
- Placeholder: "Search by name, phone, email..."
- Debounced 300ms
- Maps to: `GET /leads?search=`
- Clear button (×) appears when value entered
- Pressing Enter triggers immediate search

### Filter Bar

**Status Filter** (multi-select dropdown):
```
☐ New             (120)
☐ Contacted       (80)
☐ Qualified       (50)
☐ Negotiation     (30)
☐ Converted       (100)
☐ Lost            (40)
☐ Invalid         (20)
☐ Junk            (10)
─────────────────
[Clear] [Apply]
```

**Source Filter** (multi-select):
```
☐ Field Collection
☐ Website
☐ Referral
☐ Social Media
☐ Import
☐ API
```

**Priority Filter** (multi-select):
```
☐ Urgent  ☐ High  ☐ Medium  ☐ Low
```

**Assigned To Filter** (searchable single-select):
```
[ 🔍 Search team member... ]
○ Ravi Kumar (Field Agent)
○ Priya S. (Marketing Agent)
○ Unassigned
```

**Date Range Filter:**
```
From: [📅 DD/MM/YYYY]   To: [📅 DD/MM/YYYY]
[Today] [This Week] [This Month] [Last Month]
[Apply]
```

### Quick Tabs
- All / New / Contacted / Follow-up Due
- Clicking a tab sets the `status` filter
- Counts update when data refreshes

### Table Columns

| Column | Value | Width | Sortable |
|--------|-------|-------|---------|
| Checkbox | Row selection | 40px | — |
| Name & Phone | Full name (bold) + phone below | 200px | firstName |
| Status | Status pill badge | 120px | status |
| Priority | Priority badge | 100px | priority |
| Source | Text or icon | 120px | source |
| Assigned To | Avatar + name | 150px | — |
| City | Text | 100px | — |
| Created | Relative time ("2h ago") + tooltip absolute | 120px | createdAt |
| Actions | `⋮` kebab menu | 60px | — |

**Row Actions (kebab `⋮` menu):**
```
View Details
Edit
Add Activity
Add Reminder
Assign To...
Change Status →  ──────
                 New
                 Contacted
                 Qualified
                 Negotiation
                 Converted
                 Lost
                 Invalid
                 Junk
─────────────────
Delete (admin only, red)
```

### Bulk Action Bar (appears when rows selected)
```
[✓ 3 selected]  [Assign To ▼]  [Change Status ▼]  [×  Clear selection]
```

- **Assign To:** Opens modal with user search + select
- **Change Status:** Opens inline dropdown with all status options
- Maps to: `POST /leads/bulk/assign` and `POST /leads/bulk/status`
- Max 200 rows selectable at once

### Column View Toggle
Button in top-right of table header: `[⊞ Columns]`
Opens checklist of all columns — user can hide/show columns. Persist in localStorage.

### Export Button
`[⬇ Export]` — Downloads CSV of current filtered results. (UI only — no backend endpoint yet, show "coming soon" if not available)

---

## Lead Detail Page `/leads/:id`

```
┌────────────────────────────────────────────────────────────────────┐
│  ← Back to Leads                                    [Edit] [⋮]     │
├────────────────────────────────────────────────────────────────────┤
│  HEADER                                                            │
│  [Avatar initials]  Priya Sharma                                   │
│  📱 9876543210    📧 priya@gmail.com    📍 Delhi                    │
│  🔵 New   🟠 High Priority   Field Collection                      │
│                                                                    │
│  Assigned to: [Avatar] Ravi Kumar   |   Created: Dec 20 by Sunil   │
├──────────────────────────────┬─────────────────────────────────────┤
│  LEFT COLUMN (60%)           │  RIGHT COLUMN (40%)                 │
│                              │                                     │
│  ACTIVITY TIMELINE           │  LEAD INFO CARD                     │
│  ─────────────────           │  ─────────────                      │
│  [+ Add Activity]            │  Status: 🔵 New  [Change ▼]         │
│                              │  Priority: High  [Change ▼]         │
│  🔵 Dec 24 10:30 AM          │  Source: Field Collection           │
│  📞 Call — Ravi Kumar        │  Campaign: Delhi Drive              │
│  "Interested in plan B,      │  Form: Survey Form 1                │
│   wants callback tomorrow"   │  Tags: [hot-lead] [×] [+ Add tag]  │
│                              │                                     │
│  🟡 Dec 22 3:00 PM           │  CONTACT                            │
│  📝 Note — Sunil M.          │  Phone: 9876543210                  │
│  "Lead collected at CP       │  Alt Phone: 9876543211              │
│   exhibition stall"          │  Email: priya@gmail.com             │
│                              │                                     │
│  🟢 Dec 22 2:45 PM           │  LOCATION                           │
│  ✅ Status Change            │  📍 Delhi, Delhi 110001             │
│  new → contacted             │  Connaught Place, New Delhi         │
│                              │  [View on Map] (if lat/lng present) │
│  [Load more activities]      │                                     │
│                              │  ADDITIONAL INFO                    │
│  REMINDERS                   │  Deal Value: ₹50,000                │
│  ──────────                  │  Notes: "Very interested..."        │
│  ⏰ Dec 25 10:00 AM          │  Follow Up: Dec 25, 10 AM           │
│  "Follow-up call"  [Snooze]  │                                     │
│  [Complete] [Cancel]         │  FORM DATA                          │
│  [+ Add Reminder]            │  productInterest: Premium Plan      │
│                              │  budget: 50000                      │
│                              │                                     │
│  TEMPLATES                   │  ASSIGNMENT                         │
│  ──────────                  │  Assigned To: Ravi Kumar            │
│  [Send Template ▼]           │  [Reassign →]                       │
│                              │  Created By: Sunil M.               │
│                              │  Created: Dec 20, 2024              │
└──────────────────────────────┴─────────────────────────────────────┘
```

### Activity Timeline

**Add Activity button** → opens inline form or modal:
```
Type: [dropdown: Call / Email / SMS / WhatsApp / Meeting / Note]
Title: [___________________________________________]
Description: [multiline textarea]
Duration: [___] minutes  (shown only for Call type)
[Save Activity]
```

**Timeline item design:**
```
[icon]  Type — Username          Time ago
        Title text (bold)
        Description text (gray)
```
- Icons: 📞 call, 📧 email, 💬 sms, 🟢 whatsapp, 🤝 meeting, 📝 note, 🔄 status_change, 👤 assignment, ✅ follow_up
- Color-coded left border per activity type
- Paginated (20 per page with "Load more")

### Status Change Dropdown (inline on detail page)
- Clicking current status opens a popover with all 8 status options
- Selecting a new status: calls `PATCH /leads/:id { status }` and auto-creates a `status_change` activity

### Send Template Dropdown
- Clicking `[Send Template ▼]` opens a searchable list of available templates
- After selecting template, shows preview modal before confirming send

### Reassign Modal
```
┌─────────────────────────────────────┐
│  Reassign Lead                      │
│                                     │
│  [🔍 Search team member...]         │
│  ○ Ravi Kumar    Field Agent        │
│  ○ Sunil M.      Marketing Agent    │
│  ○ ...                              │
│                                     │
│  [Cancel]  [Reassign]               │
└─────────────────────────────────────┘
```

---

## Create Lead Modal (or Drawer)

**Trigger:** `[+ Add Lead]` button on list page

**Preferred UX:** Right-side drawer (540px wide) slides in

```
┌────────────────────────────────────────────┐ DRAWER
│  Add New Lead                         [×]  │
│  ─────────────────────────────────────     │
│  CONTACT INFO                              │
│  First Name *         Last Name            │
│  [______________]     [______________]     │
│                                            │
│  Phone *              Alternate Phone      │
│  [______________]     [______________]     │
│                                            │
│  Email                                     │
│  [__________________________________]      │
│  ─────────────────────────────────────     │
│  LEAD INFO                                 │
│  Source          Priority                  │
│  [Dropdown ▼]    [Dropdown ▼]              │
│                                            │
│  Campaign (optional)                       │
│  [Search campaign...         ▼]            │
│                                            │
│  Form (optional)                           │
│  [Search form...             ▼]            │
│                                            │
│  Assign To (optional)                      │
│  [Search team member...      ▼]            │
│  ─────────────────────────────────────     │
│  LOCATION (optional)                       │
│  [📍 Use GPS]   or fill manually           │
│                                            │
│  Address                                   │
│  [__________________________________]      │
│  City            State     Pincode         │
│  [____________]  [_______] [______]        │
│  ─────────────────────────────────────     │
│  NOTES & TAGS                              │
│  Tags: [hot-lead ×] [+ Add tag]            │
│                                            │
│  Notes                                     │
│  [multiline textarea, max 1000 chars]      │
│  0/1000                                    │
│  ─────────────────────────────────────     │
│  [Cancel]                [Save Lead]       │
└────────────────────────────────────────────┘
```

### Field Details
| Field | Type | Required | Validation |
|-------|------|---------|-----------|
| First Name | text | Yes | 1–50 chars |
| Last Name | text | No | max 50 chars |
| Phone | tel | Yes | 10-digit Indian mobile |
| Alternate Phone | tel | No | 10-digit Indian mobile |
| Email | email | No | valid email format |
| Source | select | No | enum values |
| Priority | select | No | low/medium/high/urgent (default: medium) |
| Campaign | async search select | No | searches campaigns |
| Form | async search select | No | searches published forms |
| Assign To | async search select | No | searches active users |
| GPS button | button | No | Requests geolocation, fills city/address |
| Address | textarea | No | max 500 chars |
| City | text | No | max 100 chars |
| State | text | No | max 100 chars |
| Pincode | text | No | 6-digit number |
| Tags | tag-input | No | max 10 tags, each max 50 chars |
| Notes | textarea | No | max 1000 chars with counter |

### Source Dropdown Options
```
Field Collection
Website
Referral
Social Media
Import
API
```

### Priority Dropdown Options (with colored dots)
```
🔴 Urgent
🟠 High
🔵 Medium
⚪ Low
```

---

## Edit Lead Drawer

Same as Create Lead but pre-filled. Title changes to "Edit Lead".  
Additional fields visible on edit that are not on create:
- **Status** (select — all 8 options)
- **Deal Value** (number input, ₹)
- **Follow Up At** (datetime picker)
- **Contacted At** (datetime, read-only auto-set)
- **Converted At** (datetime, auto-set on status = converted)

---

## Lead Stats Page `/leads/stats`

**Visible to:** manager+ only

```
┌─────────────────────────────────────────────────────┐
│  Lead Statistics             [This Month ▼]         │
│  ─────────────────────────────────────────────────  │
│  Total: 450    New: 120    Contacted: 80             │
│  Qualified: 50  Converted: 100   Lost: 40            │
│                                                     │
│  STATUS BAR CHART (horizontal)                      │
│  New       ████████████████░░░░  26.7%              │
│  Contacted ████████████░░░░░░░░  17.8%              │
│  Converted ████████████████░░░░  22.2%              │
│  ...                                                │
│                                                     │
│  TODAY: +15    THIS WEEK: +45    THIS MONTH: +180   │
└─────────────────────────────────────────────────────┘
```
