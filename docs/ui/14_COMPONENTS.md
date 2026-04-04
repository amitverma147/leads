# Shared Components Library

All reusable UI components with their props, states, and behavior specifications.

---

## 1. Data Table

Used across: Leads, Users, Teams, Campaigns, Attendance, Notifications

### Structure
```
┌──────────────────────────────────────────────────────────────────┐
│  [☐] Column Header ↑    Column 2    Column 3    Actions          │
│  ──────────────────────────────────────────────────────────────  │
│  [☐] Row data            data        data         [⋮]           │
│  [☐] Row data            data        data         [⋮]           │
│  ──────────────────────────────────────────────────────────────  │
│  Bulk Bar (hidden until rows selected)                           │
│  ──────────────────────────────────────────────────────────────  │
│  Pagination bar                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Props / Behavior
- **Sortable columns:** Click column header → cycles asc → desc → none, arrow icon shows direction
- **Sticky header:** Header stays visible on scroll for long tables
- **Row selection:** Checkbox on each row + "select all on this page" in header
- **Bulk action bar:** Slides up from bottom when rows selected, slides back when cleared
- **Empty state:** Centered message when no rows (`<EmptyState>` component)
- **Loading skeleton:** Gray animated placeholder rows while data loads
- **Row hover:** Light gray background on hover
- **Dense mode:** Smaller row height for data-heavy views (toggle button)
- **Column resizer:** Drag column borders to resize (optional, store in localStorage)

### Mobile behavior (< 768px)
- Horizontal scroll for wide tables
- Or switch to card list view automatically

---

## 2. Pagination Bar

Used on every list page.

```
← Previous    1  [2]  3  4  ...  8    Next →      Rows: [20 ▼]
                                                    Showing 21–40 of 150
```

### Props
```typescript
{
  page: number        // current page
  totalPages: number
  total: number       // total records
  limit: number       // rows per page
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}
```

### Rows Per Page Options: `[10, 20, 50, 100]`

### Behavior
- Shows max 5 page numbers around current, with `...` for gaps
- "Previous" disabled on page 1, "Next" disabled on last page
- Changing rows per page resets to page 1
- URL sync: `?page=2&limit=20` (use query params for shareability)

---

## 3. Search Bar

```
[🔍 Search by name, phone...]  [×]
```

### Props
```typescript
{
  placeholder: string
  value: string
  onChange: (value: string) => void
  debounce?: number   // default 300ms
}
```

### Behavior
- Debounced — fires `onChange` after N ms of inactivity
- `[×]` clear button appears when value is non-empty
- Pressing Escape clears and blurs input
- Full-width on mobile

---

## 4. Filter Dropdowns

Three variants:

### a) Single Select Dropdown
```
[Label ▼]
──────────
○ Option A
○ Option B
○ Option C
──────────
[Clear]
```

### b) Multi Select Dropdown
```
[Label (2) ▼]
─────────────────
[🔍 Search...]
☑ Option A
☑ Option B
☐ Option C
─────────────────
[Clear]  [Apply]
```
- Badge count shows how many options selected
- "Apply" fires the filter change
- "Clear" deselects all

### c) Date Range Picker
```
[📅 Dec 1 – Dec 31 ▼]
────────────────────────────
Quick: [Today] [Week] [Month]

  < December 2024 >
  Su Mo Tu We Th Fr Sa
                     1
   2  3  4  5  6  7  8
   9 10 11 12 13 14 15
  [S] 17 18 19 20 21 22
  23 24 25 26 27 28 29
  30 31
────────────────────────────
From: [Dec 1, 2024]
To:   [Dec 31, 2024]
[Clear]   [Apply]
```

### Filter Bar Pattern
```
[🔍 Search] | [Filter1 ▼] [Filter2 ▼] [Filter3 ▼] | [⟳ Reset All]
```
- Active filters shown as chips below bar (optional):
  ```
  [Status: New ×] [Priority: High ×]  [Clear all filters]
  ```

---

## 5. Status Badge / Pill

```typescript
<StatusBadge status="new" />           // 🔵 New
<StatusBadge status="converted" />     // 🟢 Converted
<StatusBadge status="lost" />          // 🔴 Lost
```

Design:
```
• Label    ← colored dot + text, pill shape, capitalized
```

All status types and colors defined in `00_OVERVIEW.md`.

---

## 6. Avatar Component

```typescript
<Avatar
  src="https://..."          // optional photo URL
  name="Ravi Kumar"          // used for initials fallback
  size={32 | 40 | 48 | 64}  // px
/>
```

Design states:
1. Photo: Circular image
2. No photo: Circle with initials (first + last letter), background color derived from name hash
3. Loading: Gray circle with shimmer

**Avatar Group (for teams):**
```
[RK] [PS] [DK] +5   ← overlapping circles, +N for overflow
```

---

## 7. Modal

```
┌────────────────────────────────────────────────────────┐
│  Modal Title                                      [×]  │
│  ──────────────────────────────────────────────────    │
│  [Modal content — form, info, confirm, etc.]           │
│  ──────────────────────────────────────────────────    │
│  [Secondary action]              [Primary action]      │
└────────────────────────────────────────────────────────┘
```

### Sizes
- `sm` — 400px — confirmations, simple prompts
- `md` — 540px — forms, most modals
- `lg` — 720px — complex forms, previews
- `xl` — 900px — builder, bulk operations

### Behavior
- Click outside / press Escape → close (unless form is dirty)
- If form dirty: "Unsaved changes — are you sure?" confirmation
- Focus trapped inside while open (accessibility)
- Scrollable body if content is tall
- Fixed footer buttons

---

## 8. Drawer (Slide-in Panel)

Used for: Create Lead, Create Reminder, Notifications

```
┌──────────────────────────────────────────────────────────┐
│ PAGE CONTENT (dimmed)          DRAWER SLIDES IN →        │
│                           ┌──────────────────────────┐   │
│                           │  Drawer Title       [×]  │   │
│                           │  ────────────────────    │   │
│                           │  [Scrollable Content]    │   │
│                           │                          │   │
│                           │  ────────────────────    │   │
│                           │  [Cancel] [Save]         │   │
│                           └──────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### Sizes
- `sm` — 380px — notifications, simple drawers
- `md` — 540px — create/edit forms
- `lg` — 720px — complex forms (campaign, template)

### Behavior
- Slides in from right with animation (200ms ease)
- Background dims (50% opacity overlay)
- Click overlay → close (with unsaved-changes warning if form dirty)
- Escape key → close
- Scrollable independently from background
- Footer buttons fixed at bottom of drawer

---

## 9. Confirmation Modal

```
┌────────────────────────────────────────────────────────┐
│  ⚠️  Are you sure?                                [×]  │
│  ──────────────────────────────────────────────────    │
│  [Icon]   Title                                        │
│           Description explaining consequences          │
│  ──────────────────────────────────────────────────    │
│  [Cancel]                        [Confirm]             │
└────────────────────────────────────────────────────────┘
```

### Variants
- `danger` — Confirm button is red (delete, deactivate, cancel)
- `warning` — Confirm button is amber (unpublish, pause)
- `info` — Confirm button is primary (neutral confirmation)

### Type-to-Confirm Variant (for destructive actions)
```
To confirm, type the name below:
[__________________________]
[Delete] button enabled only when text matches exactly
```

---

## 10. Toast Notifications

```
                    ┌──────────────────────────────────┐
                    │ ✅  Lead created successfully     │  [×]
                    └──────────────────────────────────┘
```

Position: top-right, stacked (newest on top)

### Types
```
success  ✅  Green background
error    ❌  Red background
warning  ⚠️  Amber background
info     ℹ️  Blue background
```

### Behavior
- Auto-dismiss after 4 seconds
- Hover pauses auto-dismiss timer
- Manual close button `[×]`
- Max 5 toasts stacked; oldest dismissed first when overflow

### Usage
```javascript
toast.success('Lead created successfully')
toast.error('Failed to save. Please try again.')
toast.warning('You have 3 overdue reminders')
toast.info('Syncing data...')
```

---

## 11. Empty State

```
┌────────────────────────────────────────────────────┐
│                                                    │
│           [Illustration SVG]                       │
│                                                    │
│           No leads found                           │
│           Try adjusting your filters or            │
│           add your first lead.                     │
│                                                    │
│           [+ Add Lead]                             │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Variants
- `no-data` — First time, nothing created yet (show CTA)
- `no-results` — Search/filter returned 0 results (show "Clear filters")
- `no-permission` — Role doesn't have access (no CTA, explain)
- `loading-error` — Failed to load (show "Retry" button)

---

## 12. Loading Skeleton

### Table Skeleton
```
[░░░░░░░░░░░░░░] [░░░░░░░] [░░░░░░░░░] [░░░░]  ← animated shimmer rows
[░░░░░░░░░░░░░░] [░░░░░░░] [░░░░░░░░░] [░░░░]
[░░░░░░░░░░░░░░] [░░░░░░░] [░░░░░░░░░] [░░░░]
```

### Card Skeleton
```
┌────────────────────────────────┐
│ [░░░░░░░░░░░░]  ← title        │
│ [░░░░░░] [░░░░░░]              │
│ [░░░░░░░░░░░░░░░░░░]           │
└────────────────────────────────┘
```

### Stat Card Skeleton
```
┌─────────────┐
│ [░░]        │
│ [░░░░░░░]   │
│ [░░░░]      │
└─────────────┘
```

---

## 13. Charts (shared configuration)

Library recommendation: **Recharts** (React-native, lightweight) or **ApexCharts**

### Line Chart (Trends)
```typescript
{
  type: 'line',
  height: 280,
  data: [{ date: '2024-01-01', value: 15 }, ...],
  xKey: 'date',
  yKey: 'value',
  color: '#6366F1',
  tooltip: true,
  gridLines: true,
  responsive: true
}
```

### Donut / Pie Chart (Status breakdown)
```typescript
{
  type: 'donut',
  data: [{ label: 'New', value: 120, color: '#3B82F6' }, ...],
  innerRadius: '60%',  // donut hole
  legend: true,
  tooltip: true
}
```

### Bar Chart (Performance, trends)
```typescript
{
  type: 'bar',
  data: [...],
  xKey: 'name',
  yKey: 'value',
  color: '#6366F1',
  horizontal: false  // or true for horizontal bars
}
```

### Progress Bar (Targets)
```
[████████████████░░░░░░░░░░]  78%
```
Color changes based on percentage:
- ≥100% → Green `#10B981`
- 75–99% → Amber `#F59E0B`
- 50–74% → Orange `#F97316`
- <50% → Red `#EF4444`

---

## 14. Tag Input

Used for: Lead tags, Template tags

```
[hot-lead ×] [premium ×] [follow-up ×] [Type and press Enter...]
```

### Behavior
- Type text → press Enter or comma to add tag
- `[×]` removes a tag
- Max tags: enforced (10 for leads, unlimited for templates)
- Max tag length: 50 chars
- Duplicate tags: ignored
- Shows remaining count when near limit: "7/10 tags"

---

## 15. Async Search Select

Used for: Assign To, Team select, Lead select, Form select

```
[🔍 Search team members...        ▼]
─────────────────────────────────────
Loading...
─────────────────────────────────────
  [RA] Ravi Kumar    Field Agent
  [PS] Priya Sharma  Mktg Agent
  [SM] Sunil M.      Supervisor
─────────────────────────────────────
No results for "xyz"
```

### Behavior
- Debounced search (300ms) triggers API call
- Shows loading spinner while fetching
- Displays option rows with avatar + name + role/type
- Single or multi-select variant
- Selected value shows avatar + name in trigger button
- `[×]` in trigger clears selection

---

## 16. Date/Time Picker

```
[📅 December 24, 2024  ⏰ 10:00 AM]
```

Single-click opens a calendar + time picker:

```
┌────────────────────────────────────────┐
│   < December 2024 >                    │
│  Su Mo Tu We Th Fr Sa                  │
│                          1             │
│   2  3  4  5  6  7  8                 │
│   9 10 11 12 13 14 15                 │
│  16 17 18 19 20 21 22                 │
│  23[24]25 26 27 28 29                 │  ← selected highlighted
│  30 31                                 │
│  ──────────────────────────────────    │
│  Time:  [10] : [00]  [AM ▼]           │
│  ──────────────────────────────────    │
│  [Cancel]         [Select]             │
└────────────────────────────────────────┘
```

### Quick options (where appropriate):
```
[Today] [Tomorrow] [Next Week] [+1 Month]
```

---

## 17. Role Guard Component

Wraps any UI element to conditionally render based on role:

```jsx
<RoleGuard roles={['admin', 'super_admin']}>
  <Button>Delete User</Button>
</RoleGuard>

<RoleGuard minRole="marketing_manager">
  <Button>Create Campaign</Button>
</RoleGuard>
```

Role hierarchy for `minRole`:
```javascript
const ROLE_LEVELS = {
  super_admin: 100,
  admin: 80,
  marketing_manager: 60,
  agent_supervisor: 60,
  marketing_agent: 40,
  field_agent: 40,
}
```

---

## 18. Inline Editable Field

Used on Lead detail for quick edits without opening a full modal:

```
Status:  🔵 New  [Change ▼]
         ↓ Click
         ┌────────────────┐
         │ ○ New          │
         │ ● Contacted    │
         │ ○ Qualified    │
         │ ...            │
         └────────────────┘
```

Saves immediately on selection with optimistic UI update.

---

## 19. Copy-to-Clipboard

On phone numbers, emails, IDs:

```
9876543210  [📋]
```

Click `[📋]` → copies to clipboard → shows "Copied!" tooltip for 2 seconds.

---

## 20. Breadcrumb

Shown on nested pages (Lead detail, Team detail, Campaign detail):

```
Leads  >  Priya Sharma

Teams  >  Delhi North Team  >  Members

Campaigns  >  Delhi Drive Q1  >  Leads
```

Each segment is a link except the last (current page).
