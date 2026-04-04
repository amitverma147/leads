# Dashboard `/dashboard`

**Visible to:** marketing_manager, agent_supervisor, admin, super_admin

**Data sources:**
- `GET /analytics/dashboard`
- `GET /analytics/leads-by-status`
- `GET /analytics/leads-trend`
- `GET /analytics/top-performers`
- `GET /reminders/summary`
- `GET /targets/my-performance` (for personal KPI strip)

---

## Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Dashboard    [Today ▼] [This Week ▼] [This Month ▼]  [Export]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │ Total   │  │ New     │  │Converted│  │Conv.Rate│           │
│  │ Leads   │  │ Today   │  │ Today   │  │         │           │
│  │  1,450  │  │   15    │  │    8    │  │  22.4%  │           │
│  │ ↑ 12%   │  │ ↑ 5%    │  │ ↑ 14%  │  │ ↑ 2.1%  │           │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘           │
│                                                                  │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐ │
│  │  LEADS TREND (line chart)   │  │  STATUS BREAKDOWN        │ │
│  │  30-day daily count         │  │  (donut/pie chart)       │ │
│  │                             │  │                          │ │
│  │  [chart]                    │  │  [chart]                 │ │
│  │                             │  │  New 26%  Contacted 17%  │ │
│  └──────────────────────────────┘  └──────────────────────────┘ │
│                                                                  │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐ │
│  │  TOP PERFORMERS (table)     │  │  REMINDER SUMMARY        │ │
│  │  Rank  Name  Leads  Conv%   │  │  ⚠ Overdue:    3         │ │
│  │   1.   Ravi   45    24%    │  │  📅 Due Today: 5         │ │
│  │   2.   Priya  38    31%    │  │  📆 Upcoming: 12         │ │
│  │   3.   Sunil  35    18%    │  │                          │ │
│  │  [View all →]              │  │  [View Reminders →]      │ │
│  └──────────────────────────────┘  └──────────────────────────┘ │
│                                                                  │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐ │
│  │  MY KPI TARGETS             │  │  ACTIVE CAMPAIGNS        │ │
│  │  Leads/Month  78/100 (78%)  │  │  Delhi Drive   Active    │ │
│  │  [████████░░] On Track      │  │  Q1 Tele       Paused    │ │
│  │  Calls/Month  45/80  (56%)  │  │  [View all →]            │ │
│  │  [█████░░░░░] Behind        │  │                          │ │
│  │  [View all targets →]       │  │                          │ │
│  └──────────────────────────────┘  └──────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## Stat Cards (Row 1)

4 cards in a responsive grid (2×2 on mobile, 4×1 on desktop):

| Card | Value Source | Trend Calc | Click Action |
|------|-------------|-----------|--------------|
| Total Leads | `leads.total` | vs last period | Navigate to `/leads` |
| New Today | `todayActivity.leadsCreated` | vs yesterday | Navigate to `/leads?status=new` |
| Converted Today | `todayActivity.leadsConverted` | vs yesterday | Navigate to `/leads?status=converted` |
| Conversion Rate | `leads.conversionRate` | vs last period | Navigate to `/analytics` |

**Card design:**
```
┌─────────────────────────────┐
│  [icon]                     │
│  1,450                      │  ← Large number (24px bold)
│  Total Leads                │  ← Label (12px gray)
│  ↑ 12% vs last month        │  ← Trend (green up / red down)
└─────────────────────────────┘
```

---

## Leads Trend Chart

- **Type:** Line chart with area fill
- **X-axis:** Dates (last 30 days, formatted as "Jan 1")
- **Y-axis:** Lead count
- **Lines:** Total created (blue), Converted (green)
- **Tooltip:** Date + count on hover
- **Controls:** Date range picker — Last 7d / 30d / 90d / Custom
- **Data:** `GET /analytics/leads-trend?startDate=&endDate=`
- **Library suggestion:** Recharts, ApexCharts, or Chart.js

---

## Status Breakdown Chart

- **Type:** Donut chart (preferred) or horizontal bar chart
- **Segments:** One per LeadStatus with status colors
- **Legend:** Below chart, shows status name + count + percentage
- **Center text:** Total leads count
- **Data:** `GET /analytics/leads-by-status`
- **On click segment:** Navigates to `/leads?status={status}`

---

## Top Performers Table

```
Rank  Name        Team          Leads  Converted  Rate
 1    Ravi Kumar  Delhi North   45     11         24%  ★
 2    Priya S.    Mumbai East   38     12         31%
 3    Sunil M.    Delhi South   35      6         18%
```
- Max 5 rows, "View All" link goes to `/analytics?tab=agents`
- Rank 1 gets star icon
- Rate colored: ≥30% green, 15-29% amber, <15% red
- Data: `GET /analytics/top-performers?limit=5`

---

## Reminder Summary Widget

```
┌─────────────────────────────┐
│  Follow-up Summary          │
│                             │
│  ⚠️  Overdue         3  →  │  ← Red, clickable
│  📅  Due Today       5  →  │  ← Amber, clickable
│  📆  This Week      12  →  │  ← Blue, clickable
│  ✅  Completed      45     │  ← Green, not clickable
│                             │
│  Next: "Call Priya Sharma"  │
│  Due in 2 hours             │
└─────────────────────────────┘
```
- Data: `GET /reminders/summary`
- Overdue row pulses/blinks if count > 0
- Clicking each row navigates to `/reminders` with appropriate filter

---

## My KPI Targets Widget

```
┌─────────────────────────────┐
│  My Targets — This Month    │
│                             │
│  Leads Collected            │
│  78 / 100  (78%)            │
│  [████████░░]  🟡 On Track  │
│                             │
│  Calls Made                 │
│  45 / 80   (56%)            │
│  [██████░░░░]  🔴 Behind    │
│                             │
│  [View All Targets →]       │
└─────────────────────────────┘
```
- Data: `GET /targets/my-performance`
- Progress bar colors: ≥100% green, 75-99% amber, <75% red
- Status badge: "Achieved" / "On Track" / "Behind"

---

## Active Campaigns Widget

```
┌─────────────────────────────┐
│  Active Campaigns     [2]   │
│                             │
│  Delhi Field Drive          │
│  🟢 Active  |  234 leads    │
│  Ends Dec 31               │
│                             │
│  Q1 Telecalling             │
│  🟡 Paused  |  89 leads     │
│  Ends Mar 31               │
│                             │
│  [View All Campaigns →]     │
└─────────────────────────────┘
```
- Data: `GET /campaigns?status=active,paused&limit=3`

---

## Field Agent Dashboard (different layout for field agents)

Field agents see a simplified dashboard (no analytics charts):

```
┌──────────────────────────────────────────────────────┐
│  Good morning, Ravi! 👋                               │
│  Tuesday, 24 Dec 2024                                │
├──────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │Check-In  │  │Leads     │  │Reminders Today   │   │
│  │Today     │  │Today     │  │                  │   │
│  │✅ 9:02AM │  │    7     │  │  3  (1 overdue)  │   │
│  └──────────┘  └──────────┘  └──────────────────┘   │
│                                                      │
│  My Progress — December                              │
│  Leads: 34/50  [████████░░]  68%                    │
│                                                      │
│  Upcoming Reminders                                  │
│  • Call Priya Sharma — Due in 1 hour                │
│  • Follow up Raj Mehta — Due at 3 PM               │
│                                                      │
│  [+ Add Lead]  [Check In / Out]                      │
└──────────────────────────────────────────────────────┘
```
- Data: `GET /attendance/today`, `GET /reminders/summary`, `GET /targets/my-performance`
- Primary action buttons are prominently visible
