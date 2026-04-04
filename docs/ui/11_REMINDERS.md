# Reminders / Follow-ups Module `/reminders`

**Visible to:** All roles (own reminders) | manager+ (team reminders + overdue)

---

## Reminders List Page

```
┌─────────────────────────────────────────────────────────────────────┐
│  Reminders                                          [+ Add Reminder] │
├─────────────────────────────────────────────────────────────────────┤
│  [🔍 Search reminders...]  [Status ▼]  [Priority ▼]  [Date ▼]       │
├─────────────────────────────────────────────────────────────────────┤
│  Quick Tabs:                                                        │
│  [All(23)] [⚠Overdue(3)] [📅Today(5)] [Pending(15)] [Completed(45)] │
├─────────────────────────────────────────────────────────────────────┤
│  REMINDER CARDS (list view, grouped by date)                        │
│                                                                      │
│  ─── OVERDUE ───────────────────────────────────────────── (red bg)  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  ⚠️ OVERDUE · 3 hours ago                  🔴 High Priority  │   │
│  │  Follow-up call with Priya Sharma                            │   │
│  │  📱 Priya Sharma  ·  9876543210  ·  🔵 New Lead             │   │
│  │  "Interested in Premium Plan, said call back in 2 days"      │   │
│  │                                     [Snooze ▼] [Complete ✓]  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ─── TODAY ──────────────────────────────────────────────────────   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  📅 Today, 3:00 PM · Due in 2 hours           🟡 Medium      │   │
│  │  Check quote acceptance — Raj Mehta                          │   │
│  │  📱 Raj Mehta  ·  9876543211  ·  🟡 Negotiation             │   │
│  │                                     [Snooze ▼] [Complete ✓]  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ─── TOMORROW ───────────────────────────────────────────────────   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  📅 Dec 25, 10:00 AM                          🟢 Low         │   │
│  │  Send brochure link                                          │   │
│  │  📱 Sunil Gupta  ·  9876543212  ·  🟡 Contacted             │   │
│  │                                     [Snooze ▼] [Complete ✓]  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ← Prev   Page 1 of 2   Next →                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Grouping Behavior
- Cards grouped by: Overdue → Today → Tomorrow → This Week → Later
- Overdue section has a red tinted background
- Today section has amber tinted background
- Counts in quick tabs update in real-time

### Reminder Card Design
```
┌───────────────────────────────────────────────────────────────┐
│  [status indicator]  Time/Date             [priority badge]   │
│  Title (bold, 16px)                                           │
│  📱 Lead Name  ·  Phone  ·  [Lead Status pill]                │
│  Description text (max 1 line, truncated)                     │
│  Recurrence: 🔄 Weekly  (if not "none")                       │
│                              [Snooze ▼] [✓ Complete] [⋮]      │
└───────────────────────────────────────────────────────────────┘
```

### Card Kebab (`⋮`)
```
View Details
Edit Reminder
View Lead
────────────────
Cancel Reminder  (gray)
Delete Reminder  (red)
```

---

## Snooze Dropdown

Clicking `[Snooze ▼]` opens an inline popover:
```
Snooze for:
  ● 15 minutes
  ○ 30 minutes
  ○ 1 hour
  ○ 2 hours
  ○ 1 day (tomorrow, same time)
  [Snooze]
```
Maps to: `POST /reminders/:id/snooze { snoozeMinutes: 15|30|60|120|1440 }`

After snooze: card moves to appropriate time slot, shows "Snoozed · X times" badge.

---

## Complete Reminder Modal

**Trigger:** `[✓ Complete]` button

```
┌─────────────────────────────────────────────────────┐
│  Complete Reminder                             [×] │
│                                                    │
│  "Follow-up call with Priya Sharma"                │
│                                                    │
│  Completion Note (optional)                        │
│  [What happened? What was the outcome?         ]   │
│  [                                             ]   │
│                                                    │
│  ℹ️ A follow-up activity will be logged on          │
│     Priya Sharma's lead automatically.             │
│                                                    │
│  [Cancel]          [Mark as Complete]              │
└─────────────────────────────────────────────────────┘
```

After completing: card disappears from "Pending" list with success animation. Toast: "Reminder completed. Activity logged on lead."

---

## Create Reminder Drawer

**Trigger:** `[+ Add Reminder]` or from Lead Detail page

```
┌───────────────────────────────────────────────────────┐ DRAWER
│  Add Reminder                                    [×]  │
│  ─────────────────────────────────────────────────    │
│  Lead *                                               │
│  [🔍 Search lead by name or phone...]                 │
│  Selected: Priya Sharma  (9876543210)  🔵 New         │
│  ─────────────────────────────────────────────────    │
│  Title *                                              │
│  [__________________________________]                 │
│  e.g. "Follow-up call", "Send brochure"               │
│                                                       │
│  Description (optional)                               │
│  [multiline textarea]                                 │
│  ─────────────────────────────────────────────────    │
│  Reminder Date & Time *                               │
│  [📅 Dec 25, 2024]   [⏰ 10:00 AM]                    │
│                                                       │
│  Quick: [+15min] [+30min] [+1hr] [Tomorrow] [+3days]  │
│  ─────────────────────────────────────────────────    │
│  Priority                                             │
│  ○ Low   ● Medium   ○ High                            │
│  ─────────────────────────────────────────────────    │
│  Recurrence                                           │
│  ● None  ○ Daily  ○ Weekly  ○ Monthly                 │
│  ─────────────────────────────────────────────────    │
│  Notify via                                           │
│  ☑ In-app   ☐ SMS   ☐ Email                          │
│  ─────────────────────────────────────────────────    │
│  [Cancel]                        [Save Reminder]      │
└───────────────────────────────────────────────────────┘
```

### Quick Time Buttons
- `[+15min]` → sets reminderAt to now + 15 minutes
- `[+30min]` → now + 30 min
- `[+1hr]` → now + 1 hour
- `[Tomorrow]` → tomorrow at 9:00 AM
- `[+3days]` → 3 days from now at 9:00 AM

---

## Reminder Summary Widget (Dashboard & Sidebar)

```
┌──────────────────────────────────────┐
│  ⏰ Follow-ups                       │
│  ─────────────────────────────────   │
│  ⚠️  Overdue      3   →             │
│  📅  Due Today    5   →             │
│  📆  This Week   12   →             │
│  ✅  Completed   45                  │
│  ─────────────────────────────────   │
│  Next: "Call Priya Sharma"           │
│  Due in 2 hours                      │
│  [View All Reminders →]              │
└──────────────────────────────────────┘
```

---

## Overdue Reminders Page (Manager+ only)

**Data:** `GET /reminders/overdue`

```
┌──────────────────────────────────────────────────────────────────────┐
│  ⚠️  Overdue Reminders  (3 total)                     [Refresh]      │
│  All team members' overdue follow-ups                                │
├──────────────────────────────────────────────────────────────────────┤
│  Agent          Lead           Title               Overdue Since     │
│  ─────────────────────────────────────────────────────────────────   │
│  Ravi Kumar     Priya Sharma   Follow-up call       3 hours ago      │
│  Deepak Singh   Raj Mehta      Send proposal        Yesterday 2PM    │
│  Arun Kumar     Meena Roy      Check decision       2 days ago       │
└──────────────────────────────────────────────────────────────────────┘
```

- Manager can click on any row to navigate to the lead detail page
- Useful for supervision and accountability checks
