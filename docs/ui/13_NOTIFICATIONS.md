# Notifications Module

---

## Notification Bell (Topbar)

```
Topbar right side:
  [🔔 7]  ← Bell icon with unread badge count

On click → Notification Drawer slides in from right
```

**Badge behavior:**
- Shows count of unread notifications
- Hidden (or shows 0) when no unread
- Max display: "99+" if count > 99
- Updates every 30 seconds via polling: `GET /notifications/unread-count`
- Badge disappears immediately when drawer is opened

---

## Notification Drawer (slide-in panel, 380px wide)

```
┌─────────────────────────────────────────────────────┐
│  Notifications                    [Mark all read]   │
│  ○ All  ● Unread                        [⚙ Settings]│
│  ─────────────────────────────────────────────────  │
│                                                     │
│  ─── TODAY ─────────────────────────────────────    │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ 🔵  [lead_assigned]                  2 min ago│  │
│  │     New lead assigned to you               │  │
│  │     Priya Sharma (9876543210) has been      │  │
│  │     assigned to you by Amit Verma           │  │
│  │     [View Lead →]                           │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ 🟡  [follow_up_reminder]             1 hr ago │  │
│  │     Reminder: "Follow-up call"              │  │
│  │     Due: Today at 3:00 PM                   │  │
│  │     Lead: Raj Mehta                         │  │
│  │     [View Reminder →]                       │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ─── YESTERDAY ─────────────────────────────────    │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ ⚫  [target_achieved]              Yesterday   │  │
│  │     🏆 Target Achieved!                      │  │
│  │     You've hit 100% on "Monthly Leads"       │  │
│  │     [View Targets →]                         │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  [View All Notifications →]       [Delete Read]     │
└─────────────────────────────────────────────────────┘
```

### Notification Item Design

**Unread (bold, white/light background):**
```
┌────────────────────────────────────────────────────┐
│ ● [type icon]  Title (bold)            Timestamp   │
│               Message text (2 lines max)           │
│               [Action link →]                      │
└────────────────────────────────────────────────────┘
```

**Read (normal weight, gray background):**
```
┌────────────────────────────────────────────────────┐
│   [type icon]  Title                  Timestamp   │
│               Message text                         │
└────────────────────────────────────────────────────┘
```

### Notification Type → Icon + Color
```
lead_assigned          🔵  Blue      "New lead assigned to you"
lead_status_changed    🟣  Purple    "Lead status updated"
follow_up_reminder     🟡  Amber     "Reminder due soon"
new_lead               🟢  Green     "New lead collected"
team_invite            🔷  Indigo    "You've been added to a team"
system_alert           🔴  Red       "System alert"
target_achieved        🟢  Green     "Target achieved 🏆"
target_warning         🟠  Orange    "Target falling behind"
```

### Action Links (based on notification type)
```
lead_assigned          → /leads/:leadId
lead_status_changed    → /leads/:leadId
follow_up_reminder     → /reminders/:reminderId
new_lead               → /leads/:leadId
team_invite            → /teams/:teamId
target_achieved        → /targets/my-performance
target_warning         → /targets/my-performance
system_alert           → varies or no link
```

### On Item Click
- Mark that individual notification as read: `POST /notifications/:id/read`
- Navigate to the action link if present

### Mark All Read
- `POST /notifications/read-all`
- All items in drawer switch to read styling instantly

---

## Full Notifications Page `/notifications`

```
┌────────────────────────────────────────────────────────────────────┐
│  Notifications                   [Mark All Read]  [Delete Read]    │
├────────────────────────────────────────────────────────────────────┤
│  [🔍 Search notifications...]   [Type ▼]  [Status: All ▼]          │
├────────────────────────────────────────────────────────────────────┤
│  Quick Tabs: [All] [Unread(7)] [Lead(12)] [Reminders(5)] [System(2)]│
├────────────────────────────────────────────────────────────────────┤
│  NOTIFICATION LIST                                                  │
│  (same card style as drawer but full-width)                         │
│                                                                     │
│  ─── TODAY ──────────────────────────────────────────────────────   │
│  [Card] [Card] [Card]                                               │
│  ─── YESTERDAY ──────────────────────────────────────────────────   │
│  [Card] [Card]                                                      │
│  ─── EARLIER THIS WEEK ─────────────────────────────────────────   │
│  [Card] [Card] [Card]                                               │
├────────────────────────────────────────────────────────────────────┤
│  ← Prev  Page 1 of 4  Next →               Showing 20 of 78        │
└────────────────────────────────────────────────────────────────────┘
```

### Full-width Notification Card
```
┌───────────────────────────────────────────────────────────────────┐
│ ● [icon]  New lead assigned to you            Dec 24, 10:02 AM  [×]│
│           Priya Sharma (9876543210) has been assigned to you       │
│           by Amit Verma.                                           │
│           [View Lead →]                                            │
└───────────────────────────────────────────────────────────────────┘
```

`[×]` on each card: deletes individual notification `DELETE /notifications/:id`

### Delete Read Confirmation
```
┌──────────────────────────────────────────────────────┐
│  Delete Read Notifications?                          │
│                                                      │
│  This will permanently delete all 71 read            │
│  notifications. This cannot be undone.               │
│                                                      │
│  [Cancel]            [Delete All Read]               │
└──────────────────────────────────────────────────────┘
```

---

## Real-Time Simulation (Polling Strategy)

Since the backend has no WebSocket:

```javascript
// Poll unread count every 30 seconds
useEffect(() => {
  const interval = setInterval(async () => {
    const { data } = await api.get('/notifications/unread-count')
    setBadgeCount(data.count)
  }, 30_000)
  return () => clearInterval(interval)
}, [])

// When user opens drawer: fetch fresh notifications
const openDrawer = async () => {
  setDrawerOpen(true)
  const { data } = await api.get('/notifications?limit=20&isRead=false')
  setNotifications(data)
}
```

**When to refresh notification count immediately (without waiting 30s):**
- After completing an action (create lead, change status, complete reminder)
- When user returns to browser tab (Page Visibility API)
- After check-in / check-out
