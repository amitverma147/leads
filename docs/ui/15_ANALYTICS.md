# Analytics Module `/analytics`

**Visible to:** marketing_manager, agent_supervisor, admin, super_admin

---

## Analytics Page Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  Analytics                    [Date Range: This Month ▼]  [Export]  │
├──────────────────────────────────────────────────────────────────────┤
│  TABS: [Overview] [Lead Analysis] [Agent Performance] [Geography]    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Tab 1: Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│  STAT CARDS ROW                                                      │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐        │
│  │ Total  │  │ New    │  │ Conv'd │  │  Rate  │  │ Active │        │
│  │ 1,450  │  │  450   │  │  290   │  │ 20.0%  │  │ Users  │        │
│  │        │  │        │  │        │  │        │  │   22   │        │
│  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘        │
│                                                                      │
│  ┌────────────────────────────────┐  ┌────────────────────────────┐ │
│  │  LEADS TREND (line chart)      │  │  CONVERSION FUNNEL         │ │
│  │  [filter: 7d | 30d | 90d]      │  │                            │ │
│  │                                │  │  New        ████████ 450   │ │
│  │  [chart: daily counts]         │  │  Contacted  ██████   320   │ │
│  │                                │  │  Qualified  ████     180   │ │
│  │                                │  │  Negotiation ███      95   │ │
│  │                                │  │  Converted  ██        72   │ │
│  └────────────────────────────────┘  └────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────┐  ┌────────────────────────────┐ │
│  │  TODAY'S ACTIVITY              │  │  TEAMS OVERVIEW            │ │
│  │  Created:  15                  │  │  Team        Leads  Conv%  │ │
│  │  Contacted: 8                  │  │  Delhi North  234    24%   │ │
│  │  Converted: 3                  │  │  Mumbai East  189    19%   │ │
│  │                                │  │  Delhi South  178    22%   │ │
│  │  Week total: 45 created        │  │  Telecalling  456    12%   │ │
│  └────────────────────────────────┘  └────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### Leads Trend Chart
- **Type:** Area line chart
- **X-axis:** Dates (formatted: "Dec 1", "Dec 5" etc.)
- **Series:** "Total Created" (blue), "Converted" (green) — toggle per series
- **Tooltip:** Hover shows date + both values
- **Controls:** `[7 days] [30 days] [90 days] [Custom]` pill tabs
- **API:** `GET /analytics/leads-trend?startDate=&endDate=`

### Conversion Funnel Chart
- **Type:** Horizontal funnel / bar chart
- **Data:** Each pipeline stage with count + drop-off %
- **Colors:** Gradient from blue (New) to green (Converted)
- **API:** `GET /analytics/conversion-funnel`
- **Tooltip:** Shows count and % dropped from previous stage

---

## Tab 2: Lead Analysis

```
┌──────────────────────────────────────────────────────────────────────┐
│  FOUR CHART GRID                                                     │
│                                                                      │
│  ┌───────────────────────────┐  ┌───────────────────────────────┐   │
│  │  BY STATUS (donut)        │  │  BY SOURCE (bar chart)        │   │
│  │  [donut chart]            │  │  Field Collection  ████  234  │   │
│  │                           │  │  Website           ███   180  │   │
│  │  New      26%  🔵         │  │  Referral          ██    120  │   │
│  │  Contacted17%  🟡         │  │  Social Media      ██     98  │   │
│  │  Converted22%  🟢         │  │  Import            █      45  │   │
│  │  Lost      9%  🔴         │  │  API               █      22  │   │
│  │  ...                      │  │                               │   │
│  └───────────────────────────┘  └───────────────────────────────┘   │
│                                                                      │
│  ┌───────────────────────────┐  ┌───────────────────────────────┐   │
│  │  BY PRIORITY (donut)      │  │  TRENDS COMPARISON            │   │
│  │  [donut chart]            │  │  [Multi-line chart]           │   │
│  │                           │  │  This month vs last month     │   │
│  │  Urgent 5%   🔴           │  │  Line 1: Dec (blue)           │   │
│  │  High   20%  🟠           │  │  Line 2: Nov (gray dashed)    │   │
│  │  Medium 55%  🔵           │  │                               │   │
│  │  Low    20%  ⚪            │  │                               │   │
│  └───────────────────────────┘  └───────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

- All donut charts: clicking a segment navigates to `/leads?status=x` or `?priority=x`
- **API calls:**
  - `GET /analytics/leads-by-status`
  - `GET /analytics/leads-by-source`
  - `GET /analytics/leads-by-priority`

---

## Tab 3: Agent Performance

```
┌──────────────────────────────────────────────────────────────────────┐
│  Agent Performance              [Team Filter ▼]  [Period ▼]          │
├──────────────────────────────────────────────────────────────────────┤
│  TOP PERFORMERS PODIUM (optional visual)                             │
│          🥈 Sunil M.                                                 │
│  🥇 Priya S.    🥉 Ravi K.                                           │
│                                                                      │
│  PERFORMANCE TABLE                                                   │
│  ─────────────────────────────────────────────────────────────────   │
│  Rank  Agent          Team         Created  Conv'd  Rate  Activities │
│   1    Priya Sharma   Mumbai East   105       33    31%      89      │
│   2    Sunil M.       Delhi South    98       22    22%      76      │
│   3    Ravi Kumar     Delhi North    78       18    23%      65      │
│   4    Deepak Singh   Delhi North    56        8    14%      42      │
│   5    Arun Kumar     Delhi North    45        6    13%      38      │
│                                                                      │
│  [Export to CSV]                                                     │
├──────────────────────────────────────────────────────────────────────┤
│  INDIVIDUAL PERFORMANCE CHART                                        │
│  Select agent: [Ravi Kumar ▼]                                        │
│  [Bar chart: daily leads created for selected agent, last 30 days]  │
└──────────────────────────────────────────────────────────────────────┘
```

### Performance Table Column Details

| Column | Type | Color Code |
|--------|------|-----------|
| Rank | Number (1,2,3 with medal emoji) | Top 3 highlighted |
| Agent | Avatar + name | — |
| Team | Team name | — |
| Created | Number | — |
| Converted | Number | — |
| Conversion Rate | % | ≥30% green, 15-29% amber, <15% red |
| Activities | Count | — |

**API:** `GET /analytics/agent-performance`

---

## Tab 4: Geographic Distribution

```
┌──────────────────────────────────────────────────────────────────────┐
│  Geographic Distribution                     [Limit: 20 ▼]          │
├──────────────────────────────────────────────────────────────────────┤
│  TOP CITIES                              TOP STATES                  │
│  ┌──────────────────────────────┐   ┌──────────────────────────┐   │
│  │  City          Count  %      │   │  State     Count    %    │   │
│  │  Delhi          420   29%    │   │  Delhi      420     29%  │   │
│  │  Mumbai         280   19%    │   │  Maharashtra 350    24%  │   │
│  │  Noida          150   10%    │   │  UP         180     12%  │   │
│  │  Gurgaon        120    8%    │   │  Haryana    160     11%  │   │
│  │  Pune           110    8%    │   │  Others     340     24%  │   │
│  └──────────────────────────────┘   └──────────────────────────┘   │
│                                                                      │
│  HORIZONTAL BAR CHART (cities)                                       │
│  Delhi      [████████████████████████████████] 29%                  │
│  Mumbai     [████████████████████         ] 19%                     │
│  Noida      [█████████████                ] 10%                     │
│  Gurgaon    [██████████                   ]  8%                     │
│  Pune       [██████████                   ]  8%                     │
│  Others     [████████████████████████     ] 26%                     │
└──────────────────────────────────────────────────────────────────────┘
```

**API:** `GET /analytics/geographic-distribution?limit=20`

---

## Global Date Range Filter

Applied across all analytics tabs:

```
[📅 Date Range: This Month ▼]
─────────────────────────────
○ Today
○ Yesterday
○ Last 7 Days
● This Month
○ Last Month
○ Last 3 Months
○ This Year
○ Custom Range...
─────────────────────────────
Custom:
From: [📅]   To: [📅]
[Apply]
```

Changing the date range refetches all charts simultaneously. Show loading state per chart while fetching.

---

## Export Button

```
[⬇ Export]
────────────────
  Export as CSV
  Export as PDF  (if implemented)
```

- CSV export: generates downloadable file with current filtered/date-ranged data
- Show "Generating..." state while processing
