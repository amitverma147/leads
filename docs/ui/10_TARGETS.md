# Targets / KPIs Module `/targets`

**Visible to:** All roles (own performance) | manager+ (team performance) | admin (create/assign)

---

## Targets List Page

```
┌──────────────────────────────────────────────────────────────────────┐
│  Targets & KPIs  (8 targets)                      [+ Create Target]  │
├──────────────────────────────────────────────────────────────────────┤
│  [🔍 Search targets...]  [Type ▼]  [Period ▼]  [Status ▼]            │
├──────────────────────────────────────────────────────────────────────┤
│  Quick Tabs: [All(8)] [Monthly(5)] [Weekly(2)] [Daily(1)]            │
├──────────────────────────────────────────────────────────────────────┤
│  CARD GRID (2 columns)                                               │
│                                                                      │
│  ┌────────────────────────────────┐  ┌───────────────────────────┐  │
│  │  Monthly Leads Target          │  │  Weekly Calls Target       │  │
│  │  📅 Monthly  ·  leads_collected│  │  📅 Weekly  ·  calls_made  │  │
│  │  ────────────────────────      │  │  ────────────────────────  │  │
│  │  Jan 1, 2024 – Dec 31, 2024   │  │  Jan 1 – Dec 31, 2024     │  │
│  │  Target Value: 100 leads       │  │  Target Value: 80 calls    │  │
│  │  ────────────────────────      │  │  ────────────────────────  │  │
│  │  👥 3 teams  · 8 users         │  │  👤 5 users                │  │
│  │  🟢 Active                     │  │  🟢 Active                 │  │
│  │                                │  │                            │  │
│  │  [View] [Assign] [Edit] [⋮]   │  │  [View] [Assign] [Edit] [⋮]│  │
│  └────────────────────────────────┘  └───────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### Target Type Labels & Icons
```
leads_collected  → 📋 Leads Collected
leads_converted  → ✅ Leads Converted
calls_made       → 📞 Calls Made
revenue          → 💰 Revenue
visits           → 📍 Visits
follow_ups       → 🔄 Follow-ups
```

### Period Labels
```
daily     → 📅 Daily
weekly    → 📅 Weekly
monthly   → 📅 Monthly
quarterly → 📅 Quarterly
```

---

## Target Detail Page `/targets/:id`

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Targets                  Monthly Leads Target      [Edit] [⋮]     │
├──────────────────────────────────────────────────────────────────────┤
│  📋 Leads Collected  ·  Monthly  ·  🟢 Active                        │
│  Jan 1, 2024 – Dec 31, 2024  ·  Target: 100 leads per month          │
├──────────────────────────────────────────────────────────────────────┤
│  TABS: [Overview] [Team Assignments] [User Assignments]               │
├──────────────────────────────────────────────────────────────────────┤
```

### Overview Tab
```
│  CURRENT PERIOD PROGRESS                                             │
│  December 2024                                                       │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │  ORGANIZATION OVERALL                                    │       │
│  │  Target: 100   Achieved: 78   Remaining: 22             │       │
│  │  [████████████████░░░░░░░░░░░░░░]  78%                  │       │
│  │  🟡 On Track                                             │       │
│  └──────────────────────────────────────────────────────────┘       │
│                                                                      │
│  Progress by Status:                                                 │
│  🟢 Achieved (≥100%):  2 users                                       │
│  🟡 On Track (75–99%): 4 users                                       │
│  🔴 Behind (<75%):     2 users                                       │
```

### Team Assignments Tab
```
│  [+ Assign to Teams]                                                 │
│                                                                      │
│  Team               Target    Achieved    %       Status            │
│  ─────────────────────────────────────────────────────────────────  │
│  Delhi North Team   100       78          78%    🟡 On Track         │
│  Mumbai East Team   100       93          93%    🟡 On Track         │
│  Delhi South Team   120       125         104%   🟢 Achieved ✓       │
│                                                                      │
│  [Remove ×] on each row (admin only)                                 │
```

### User Assignments Tab
```
│  [+ Assign to Users]                                                 │
│                                                                      │
│  User          Team         Target  Current   %      Status         │
│  ─────────────────────────────────────────────────────────────────  │
│  Ravi Kumar    Delhi North  100      78        78%   🟡 On Track      │
│  Deepak Singh  Delhi North   80      45        56%   🔴 Behind        │
│  Priya S.      Mumbai East  100     105       105%   🟢 Exceeded ✓    │
│                                                                      │
│  [Remove ×] on each row (admin only)                                 │
```

---

## Assign Target Modal

**Trigger:** `[Assign]` or `[+ Assign to Teams/Users]`

```
┌────────────────────────────────────────────────────────────────────┐
│  Assign Target: Monthly Leads Target                          [×]  │
│                                                                    │
│  ─── ASSIGN TO TEAMS ─────────────────────────────────────────    │
│  [🔍 Search teams...]                                              │
│  ☐ Delhi South Team (6 members)   Field                           │
│  ☐ Pune Marketing    (4 members)   Marketing                       │
│                                                                    │
│  ─── ASSIGN TO USERS ─────────────────────────────────────────    │
│  [🔍 Search users...]                                              │
│  ☐ Ravi Kumar     Field Agent    Delhi North                      │
│  ☐ Sunil Mehta    Supervisor     Delhi North                       │
│                                                                    │
│  ─── CUSTOM TARGET VALUE ─────────────────────────────────────    │
│  ☐ Override target value for this assignment                      │
│  Custom Value: [100  ]  (default: 100 from target)               │
│                                                                    │
│  [Cancel]                            [Assign]                      │
└────────────────────────────────────────────────────────────────────┘
```

---

## My Performance Page `/my-performance`

**All roles can access their own performance**

```
┌──────────────────────────────────────────────────────────────────────┐
│  My Performance                   [December 2024 ▼]  [Monthly ▼]    │
├──────────────────────────────────────────────────────────────────────┤
│  Ravi Kumar · Field Agent · Delhi North Team                         │
│  Overall Score: 78%  ·  Rank: #3 in organization                    │
├──────────────────────────────────────────────────────────────────────┤
│  TARGET PROGRESS CARDS (one per assigned target)                     │
│                                                                      │
│  ┌──────────────────────────────────┐  ┌─────────────────────────┐  │
│  │  📋 Leads Collected              │  │  📞 Calls Made          │  │
│  │  Monthly Target: 100             │  │  Weekly Target: 80      │  │
│  │  Current: 78                     │  │  Current: 45            │  │
│  │  Remaining: 22                   │  │  Remaining: 35          │  │
│  │  [████████████████░░░░]  78%     │  │  [████████████░░░░░░]56%│  │
│  │                                  │  │                         │  │
│  │  Period: Dec 1 – Dec 31          │  │  Period: Dec 23 – 29    │  │
│  │  Status: 🟡 On Track             │  │  Status: 🔴 Behind      │  │
│  └──────────────────────────────────┘  └─────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────┐                               │
│  │  ✅ Leads Converted              │                               │
│  │  Monthly Target: 20              │                               │
│  │  Current: 22                     │                               │
│  │  [████████████████████] 110%     │                               │
│  │  Status: 🟢 Exceeded! +2         │                               │
│  └──────────────────────────────────┘                               │
└──────────────────────────────────────────────────────────────────────┘
```

### Progress Bar Colors
```
≥ 100%    → Green   (Achieved / Exceeded)
75–99%    → Amber   (On Track)
50–74%    → Orange  (At Risk)
< 50%     → Red     (Behind)
```

---

## Leaderboard Page `/targets/leaderboard`

```
┌───────────────────────────────────────────────────────────────────┐
│  Leaderboard                                                      │
│  Type: [Leads Collected ▼]    Period: [Monthly ▼]                 │
│  Team Filter: [All Teams ▼]                                       │
├───────────────────────────────────────────────────────────────────┤
│  December 2024  ·  Leads Collected  ·  Monthly                    │
├───────────────────────────────────────────────────────────────────┤
│  Rank  Name           Team          Current  Target   %    Trend  │
│  ─────────────────────────────────────────────────────────────    │
│   🥇1  Priya Sharma   Mumbai East   105      100     105%  ↑      │
│   🥈2  Sunil M.       Delhi South   98       80      123%  ↑      │
│   🥉3  Ravi Kumar     Delhi North   78       100      78%  →      │
│      4  Arun Kumar    Delhi North   56       100      56%  ↓      │
│      5  Deepak S.     Delhi North   45       100      45%  ↓      │
│      ...                                                          │
├───────────────────────────────────────────────────────────────────┤
│  YOU ARE RANKED #3 OUT OF 8 (highlighted row for current user)    │
└───────────────────────────────────────────────────────────────────┘
```

### Trend Indicators
```
↑ (green)   → Improved vs previous period
→ (gray)    → Same as previous period
↓ (red)     → Declined vs previous period
```

### Top 3 Podium (optional above table)
```
         🥈 Sunil M.
         123%
         
🥇 Priya   |   🥉 Ravi
   105%    |    78%
```

---

## Create Target Modal

**Trigger:** `[+ Create Target]` (admin only)

```
┌──────────────────────────────────────────────────────────┐
│  Create Target                                      [×] │
│  ────────────────────────────────────────────────────    │
│  Target Name *                                          │
│  [__________________________________]                   │
│                                                         │
│  Description                                            │
│  [multiline textarea]                                   │
│  ────────────────────────────────────────────────────    │
│  Target Type *                                          │
│  [Dropdown ▼]                                           │
│  ○ Leads Collected   ○ Leads Converted                  │
│  ○ Calls Made        ○ Revenue (₹)                      │
│  ○ Visits            ○ Follow-ups                       │
│  ────────────────────────────────────────────────────    │
│  Period *                                               │
│  ○ Daily  ○ Weekly  ○ Monthly  ○ Quarterly              │
│  ────────────────────────────────────────────────────    │
│  Target Value *                                         │
│  [100  ]  leads / calls / ₹ (unit shows per type)       │
│  ────────────────────────────────────────────────────    │
│  Active Period                                          │
│  Start Date *      End Date *                           │
│  [📅 MM/DD/YYYY]   [📅 MM/DD/YYYY]                       │
│  ────────────────────────────────────────────────────    │
│  [Cancel]               [Create & Assign Later]         │
│                         [Create & Assign Now →]         │
└──────────────────────────────────────────────────────────┘
```

"Create & Assign Now" saves the target then immediately opens the Assign Target modal.
