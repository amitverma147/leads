# Campaigns Module `/campaigns`

**Visible to:** All roles (read) | marketing_manager, admin, super_admin (write)

---

## Campaign List Page

```
┌────────────────────────────────────────────────────────────────────┐
│  Campaigns  (12 total)                         [+ New Campaign]    │
├────────────────────────────────────────────────────────────────────┤
│  [🔍 Search campaigns...]  [Type ▼]  [Status ▼]  [Sort: Date ▼]   │
├────────────────────────────────────────────────────────────────────┤
│  Quick Tabs:  [All(12)] [Draft(2)] [Active(5)] [Paused(2)] [Done(3)]│
├────────────────────────────────────────────────────────────────────┤
│  CARD GRID (2 or 3 columns)                                        │
│                                                                    │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐   │
│  │  Delhi Field Drive Q1        │  │  Telecalling Jan Batch   │   │
│  │  🟢 Active · Field Collection│  │  🟡 Paused · Telecalling  │   │
│  │  ─────────────────────────   │  │  ─────────────────────── │   │
│  │  📋 234 leads                │  │  📋 89 leads             │   │
│  │  👥 3 teams · 8 users        │  │  👥 1 team · 5 users     │   │
│  │  📅 Jan 1 – Mar 31           │  │  📅 Jan 5 – Feb 28       │   │
│  │  💰 ₹50,000 budget           │  │  💰 ₹20,000 budget       │   │
│  │  ─────────────────────────   │  │  ─────────────────────── │   │
│  │  [View] [Manage] [⋮]        │  │  [View] [Manage] [⋮]     │   │
│  └──────────────────────────────┘  └──────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

### Campaign Status Pills
```
🔘 Draft     — Gray
🟢 Active    — Green
🟡 Paused    — Amber
✅ Completed — Indigo
🔴 Cancelled — Red
```

### Campaign Type Icons
```
🤝 Field Collection
📞 Telecalling
📧 Email
💬 SMS
🟢 WhatsApp
🔀 Mixed
```

### Card Kebab (`⋮`) — Manager+ only
```
View Details
Edit Campaign
Duplicate
────────────────
Activate   (if draft/paused)
Pause      (if active)
Complete   (if active/paused)
Cancel     (if not completed)
────────────────
Delete     (admin only, red)
```

---

## Campaign Detail Page `/campaigns/:id`

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Campaigns                [Duplicate] [Change Status ▼] [Edit] [⋮]│
├──────────────────────────────────────────────────────────────────────┤
│  HEADER                                                              │
│  📞 Telecalling                                                      │
│  Delhi Field Drive Q1                      🟢 Active                 │
│  Covers Delhi NCR region — leads collection drive for Q1             │
│  📅 Jan 1, 2024 – Mar 31, 2024   💰 Budget: ₹50,000                 │
├──────────────────────────────────────────────────────────────────────┤
│  TABS: [Overview] [Leads] [Teams & Users] [Settings]                 │
├──────────────────────────────────────────────────────────────────────┤
```

### Tab 1: Overview

```
│  STATS ROW                                                          │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌─────────┐     │
│  │  234   │  │   45   │  │  19.2% │  │   8    │  │   3     │     │
│  │ Leads  │  │ Conv'd │  │  Rate  │  │ Agents │  │  Teams  │     │
│  └────────┘  └────────┘  └────────┘  └────────┘  └─────────┘     │
│                                                                     │
│  LEADS BY STATUS (horizontal stacked bar)                           │
│  New ████ Contacted ███ Qualified ██ Converted ████ Lost █          │
│                                                                     │
│  WEEKLY TREND (bar chart, last 4 weeks)                             │
│  Week 1: 45  Week 2: 72  Week 3: 68  Week 4: 49                    │
│                                                                     │
│  TOP PERFORMERS IN CAMPAIGN                                         │
│  Rank  Agent          Leads  Converted  Rate                        │
│   1    Ravi Kumar      45       11      24%                         │
│   2    Deepak Singh    38        8      21%                         │
```

### Tab 2: Leads

```
│  [🔍 Search leads...]  [Status ▼]  [Assigned To ▼]  [Sort ▼]      │
│  [+ Add Leads]  [Auto-Assign Unassigned]                            │
│  ─────────────────────────────────────────────────────────────────  │
│  ☐  Name        Phone        Status    Assigned To  Date  [⋮]      │
│  ☐  Priya S.    9876543210   🔵 New    Ravi K.      Dec 20  [⋮]   │
│  ☐  Raj M.      9876543211   🟡 Cont.  Sunil M.     Dec 21  [⋮]   │
│  ─────────────────────────────────────────────────────────────────  │
│  [Bulk: Assign ▼]  [Bulk: Remove from Campaign]                     │
│  Pagination                                                         │
```

**Add Leads Modal:**
```
┌────────────────────────────────────────────────┐
│  Add Leads to Campaign                    [×] │
│                                               │
│  Select leads to add:                         │
│  [🔍 Search leads by name, phone...]          │
│                                               │
│  ☐  Priya Sharma   9876543210   New          │
│  ☐  Ankit Gupta    9876543212   Contacted    │
│  ☐  Meena Roy      9876543213   New          │
│                                               │
│  Selected: 0 leads                            │
│                                               │
│  [Cancel]        [Add Selected Leads]         │
└────────────────────────────────────────────────┘
```

**Auto-Assign Modal:**
```
┌────────────────────────────────────────────────┐
│  Auto-Assign Leads                        [×] │
│                                               │
│  Strategy: Round Robin (from settings)        │
│  Unassigned leads: 45                         │
│  Available agents: 8                          │
│  Estimated: ~6 leads per agent                │
│                                               │
│  [Cancel]     [Run Auto-Assign]               │
└────────────────────────────────────────────────┘
```

### Tab 3: Teams & Users

```
│  ASSIGNED TEAMS                              [+ Add Teams]          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Delhi North Team  · 8 members  · 🤝 Field  [Remove ×]      │   │
│  │ Mumbai East Team  · 5 members  · 📣 Marketing [Remove ×]   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ASSIGNED USERS (individuals)                [+ Add Users]          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ [RA] Ravi Kumar    Field Agent    Delhi North  [Remove ×]  │   │
│  │ [PS] Priya Sharma  Mktg Agent     Mumbai East  [Remove ×]  │   │
│  └─────────────────────────────────────────────────────────────┘   │
```

**Add Teams Modal:**
```
┌────────────────────────────────────────────┐
│  Assign Teams to Campaign             [×] │
│                                           │
│  ☐ Delhi South Team   (6 members)  Field │
│  ☐ Pune Marketing     (4 members)  Mktg  │
│                                           │
│  [Cancel]       [Assign Selected Teams]   │
└────────────────────────────────────────────┘
```

### Tab 4: Settings

```
│  Campaign Settings                                                  │
│  ─────────────────────────────────────────────────────────────────  │
│  Daily Lead Target (per agent)   [20]                               │
│  Max Leads Total                 [1000]  (0 = unlimited)            │
│  ─────────────────────────────────────────────────────────────────  │
│  ☐ Allow duplicate leads (same phone in this campaign)              │
│  ☑ Auto-assign new leads                                            │
│  Auto-assign Strategy:  ○ Round Robin  ○ Least Loaded  ○ Manual     │
│  ─────────────────────────────────────────────────────────────────  │
│  ☑ Require geolocation on check-in                                  │
│  ☑ Form required (linked form)                                      │
│  ─────────────────────────────────────────────────────────────────  │
│  Calling Script (optional)                                          │
│  [large textarea — script for agents to follow]                     │
│  ─────────────────────────────────────────────────────────────────  │
│  Agent Incentive (optional)                                         │
│  [text — e.g. "₹50 per converted lead"]                            │
│  ─────────────────────────────────────────────────────────────────  │
│  [Save Settings]                                                    │
```

---

## Create Campaign Drawer (multi-step)

**Trigger:** `[+ New Campaign]`
**Format:** Right-side drawer (640px) with step indicators

```
Step 1 of 3: Basic Info
Step 2 of 3: Assign Teams & Users
Step 3 of 3: Settings & Launch
```

### Step 1: Basic Info
```
┌──────────────────────────────────────────────────────┐
│  New Campaign  ━━━━━━━━━━━  ○────○────○         [×] │
│  Step 1: Basic Info                                  │
│  ────────────────────────────────────────────────    │
│  Campaign Name *                                     │
│  [________________________________________]          │
│                                                      │
│  Description                                         │
│  [multiline textarea]                                │
│                                                      │
│  Campaign Type *                                     │
│  ○ 🤝 Field Collection                              │
│  ○ 📞 Telecalling                                    │
│  ○ 📧 Email                                          │
│  ○ 💬 SMS                                            │
│  ○ 🟢 WhatsApp                                       │
│  ○ 🔀 Mixed                                          │
│                                                      │
│  Start Date *      End Date *                        │
│  [📅 MM/DD/YYYY]   [📅 MM/DD/YYYY]                   │
│                                                      │
│  Budget (optional)                                   │
│  ₹ [__________]                                      │
│                                                      │
│  Linked Form (optional)                              │
│  [Search published forms... ▼]                       │
│  ────────────────────────────────────────────────    │
│  [Cancel]                           [Next Step →]   │
└──────────────────────────────────────────────────────┘
```

### Step 2: Assign Teams & Users
```
│  Step 2: Assign Teams & Users                        │
│  ────────────────────────────────────────────────    │
│  Add Teams                                           │
│  [🔍 Search teams...]                                │
│  ☑ Delhi North Team (8 members)  🤝 Field           │
│  ☐ Mumbai East Team (5 members)  📣 Marketing       │
│  ☐ Delhi South Team (6 members)  🤝 Field           │
│                                                      │
│  Add Individual Users (optional)                     │
│  [🔍 Search users...]                                │
│  ☐ Ravi Kumar  Field Agent  Delhi North             │
│  ☐ Priya S.    Mktg Agent   Mumbai East             │
│                                                      │
│  Summary: 1 team (8 members) selected               │
│  ────────────────────────────────────────────────    │
│  [← Back]                           [Next Step →]   │
```

### Step 3: Settings & Launch
```
│  Step 3: Settings                                    │
│  ────────────────────────────────────────────────    │
│  Daily Lead Target  [20]  per agent                 │
│  Max Total Leads    [1000]                           │
│  ☑ Auto-assign leads                                 │
│  Strategy: ○ Round Robin ○ Least Loaded ○ Manual     │
│  ☐ Require geolocation                               │
│  ☐ Allow duplicate leads                             │
│  ────────────────────────────────────────────────    │
│  Launch Status:                                      │
│  ○ Save as Draft (launch manually later)             │
│  ○ Activate Now (campaign goes live immediately)     │
│  ────────────────────────────────────────────────    │
│  [← Back]           [Save Draft] / [Launch Now]     │
```

---

## Change Status Modal

```
┌──────────────────────────────────────────────────┐
│  Change Campaign Status                     [×] │
│                                                  │
│  Current status: 🟡 Paused                      │
│                                                  │
│  New Status:                                     │
│  ○ 🟢 Activate   (resume campaign)              │
│  ○ ✅ Complete   (mark as done)                  │
│  ○ 🔴 Cancel     (stop permanently)              │
│                                                  │
│  Reason (optional):                              │
│  [________________________________]              │
│                                                  │
│  [Cancel]          [Confirm Change]              │
└──────────────────────────────────────────────────┘
```
