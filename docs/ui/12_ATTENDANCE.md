# Attendance & Leave Module `/attendance`

**Visible to:** All roles (own data) | manager+ (team data, manual entry, leave review)

---

## Attendance Dashboard `/attendance`

```
┌──────────────────────────────────────────────────────────────────────┐
│  Attendance                                                          │
│  TABS: [My Attendance] [Leave Management] [Team Attendance]          │
└──────────────────────────────────────────────────────────────────────┘
```

---

### Tab 1: My Attendance

```
┌──────────────────────────────────────────────────────────────────────┐
│  TODAY'S STATUS                            [Check In] / [Check Out]  │
│  ─────────────────────────────────────────────────────────────────   │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  📅 Saturday, December 24, 2024                             │    │
│  │                                                             │    │
│  │  Check In:   ✅ 9:02 AM       📍 Connaught Place, Delhi    │    │
│  │  Check Out:  ─ Not yet                                      │    │
│  │  Hours:      ─                                              │    │
│  │  Status:     🟢 Present                                     │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  MONTHLY SUMMARY  [December 2024 ▼]                                  │
│  ─────────────────────────────────────────────────────────────────   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐   │
│  │  22     │  │   0     │  │   2     │  │   1     │  │ 7hr 45m│   │
│  │ Present │  │ Absent  │  │  Leave  │  │ Half Day│  │ Avg Hrs│   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └────────┘   │
│                                                                      │
│  ATTENDANCE CALENDAR                                                 │
│  ─────────────────────────────────────────────────────────────────   │
│  Sun  Mon  Tue  Wed  Thu  Fri  Sat                                   │
│   1    2    3    4    5    6    7                                     │
│  [─] [🟢] [🟢] [🟢] [🟢] [🟢] [─]     ← [─] = weekend/off          │
│   8    9   10   11   12   13   14                                    │
│  [─] [🟢] [🟢] [🟡] [🟢] [🟢] [─]     ← [🟡] = half day            │
│  15   16   17   18   19   20   21                                    │
│  [─] [🟢] [🟢] [🟢] [🟠] [🟢] [─]     ← [🟠] = leave               │
│  22   23   24   25   26   27   28                                    │
│  [─] [🟢] [🟢][ T ] ...                ← [T] = today                 │
│                                                                      │
│  Legend: 🟢 Present  🔴 Absent  🟡 Half-day  🟠 Leave  [─] Weekend   │
│                                                                      │
│  ATTENDANCE HISTORY TABLE                                            │
│  [Date ▼]  [Status ▼]                                                │
│  Date         Check In   Check Out  Hours   Status    Location      │
│  Dec 23       09:05AM    06:12PM    9h 7m   Present   Delhi NCR     │
│  Dec 22       09:01AM    05:58PM    8h 57m  Present   Delhi NCR     │
│  Dec 21       ─          ─          ─       Absent    ─             │
│  Dec 20       10:00AM    02:30PM    4h 30m  Half Day  Delhi         │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Check-In Screen

**Trigger:** `[Check In]` button (only shown if not checked in today)

```
┌────────────────────────────────────────────────────┐
│  Check In for Today                           [×] │
│  Saturday, December 24, 2024                       │
│  ──────────────────────────────────────────────    │
│  📍 LOCATION                                       │
│                                                    │
│  [🗺 Map showing current location]                 │
│  Detected: Connaught Place, New Delhi              │
│  Lat: 28.6315, Lng: 77.2167                        │
│  [🔄 Refresh Location]                             │
│                                                    │
│  Notes (optional)                                  │
│  [___________________________________]             │
│  ──────────────────────────────────────────────    │
│  ⏰ Current Time: 9:02 AM                          │
│                                                    │
│  [Cancel]              [✅ Check In]               │
└────────────────────────────────────────────────────┘
```

- Auto-requests `navigator.geolocation` on modal open
- If geolocation denied: shows address input manually
- "Check In" button shows current time (updates live)
- Maps to: `POST /attendance/check-in`
- Error if already checked in: "You've already checked in today at 9:02 AM."

## Check-Out Screen

Same modal but for check-out. Shows:
```
Today's Check-In: 9:02 AM
Time Elapsed:     7h 45m
```

---

### Tab 2: Leave Management

```
┌──────────────────────────────────────────────────────────────────────┐
│  LEAVE BALANCE                                      [Apply for Leave] │
│  ─────────────────────────────────────────────────────────────────   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │  Sick Leave     │  │  Casual Leave   │  │  Earned Leave       │  │
│  │  Used: 3        │  │  Used: 2        │  │  Used: 5            │  │
│  │  Available: 9   │  │  Available: 10  │  │  Available: 10      │  │
│  │  Total: 12/yr   │  │  Total: 12/yr   │  │  Total: 15/yr       │  │
│  │  [█████░░░░░░]  │  │  [████░░░░░░░]  │  │  [███████░░░░]      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │
│                                                                      │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────────┐   │
│  │Unpaid  │  │Maternity│  │Paternity│  │Bereave.│  │Compensatory│   │
│  │ 0/∞   │  │ 0/90dy │  │ 0/5dy  │  │ 0/3dy  │  │  0/0      │   │
│  └────────┘  └────────┘  └────────┘  └────────┘  └────────────┘   │
│  ─────────────────────────────────────────────────────────────────   │
│  MY LEAVE REQUESTS                                                   │
│  [Status ▼]  [Type ▼]  [Date ▼]                                      │
│                                                                      │
│  Type       Dates                Days  Status    Review Note         │
│  Sick        Dec 20              1     🟢 Approved  "Get well soon"  │
│  Casual      Nov 15–16           2     🟢 Approved                   │
│  Earned      Oct 10–12           3     🔴 Rejected  "Busy period"    │
│  Casual      Sep 5               1     🔘 Cancelled (by me)          │
│  Sick        Sep 1–2             2     ⏳ Pending   Awaiting review  │
└──────────────────────────────────────────────────────────────────────┘
```

### Leave Balance Card Design
```
┌────────────────────────────┐
│  🤒 Sick Leave             │
│  ─────────────────────     │
│  [████████░░░░] 9/12       │
│  Available: 9              │
│  Used: 3  ·  Total: 12     │
└────────────────────────────┘
```

---

## Apply for Leave Modal

**Trigger:** `[Apply for Leave]`

```
┌────────────────────────────────────────────────────────┐
│  Apply for Leave                                  [×] │
│  ──────────────────────────────────────────────────    │
│  Leave Type *                                          │
│  [Dropdown ▼]                                          │
│  ○ 🤒 Sick Leave        (9 days available)             │
│  ○ 😊 Casual Leave      (10 days available)            │
│  ○ 🏖 Earned Leave      (10 days available)            │
│  ○ 💸 Unpaid Leave      (unlimited)                    │
│  ○ 🤱 Maternity Leave   (90 days available)            │
│  ○ 👶 Paternity Leave   (5 days available)             │
│  ○ 🙏 Bereavement Leave (3 days available)             │
│  ○ 🔄 Compensatory      (0 days available)             │
│  ──────────────────────────────────────────────────    │
│  Date Range *                                          │
│  From: [📅 MM/DD/YYYY]    To: [📅 MM/DD/YYYY]          │
│  Duration: 2 working days                              │
│                                                        │
│  ⚠ You have 9 sick days available                     │
│  ──────────────────────────────────────────────────    │
│  Reason *                                              │
│  [___________________________________________]         │
│  [___________________________________________]         │
│  ──────────────────────────────────────────────────    │
│  [Cancel]                  [Submit Request]            │
└────────────────────────────────────────────────────────┘
```

- Duration calculated automatically (excludes weekends based on org settings)
- Warning shown if requesting more than available balance
- Cannot apply for past dates

---

### Tab 3: Team Attendance (Manager+ only)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Team Attendance                   [Team ▼]  [December 2024 ▼]       │
├──────────────────────────────────────────────────────────────────────┤
│  SUMMARY ROW                                                         │
│  ✅ Present: 7    ❌ Absent: 1    🟠 On Leave: 0    Total: 8          │
├──────────────────────────────────────────────────────────────────────┤
│  Name           Check In   Check Out  Hours   Status   Location      │
│  Ravi Kumar     09:05 AM   ─          7h 34m  🟢Present Delhi NCR    │
│  Deepak Singh   09:02 AM   ─          7h 37m  🟢Present Delhi        │
│  Arun Kumar     10:15 AM   ─          6h 24m  🟢Present Noida        │
│  Sunil Mehta    ─          ─          ─       🔴Absent  ─            │
│  Priya Sharma   09:00 AM   ─          7h 39m  🟢Present Mumbai       │
├──────────────────────────────────────────────────────────────────────┤
│  [+ Manual Attendance Entry]  (manager+ only)                        │
└──────────────────────────────────────────────────────────────────────┘
```

**Monthly view toggle:** Shows calendar heatmap for team

```
          Mon  Tue  Wed  Thu  Fri
Ravi K.   🟢   🟢   🟢   🟢   🟢
Deepak S. 🟢   🟢   🟡   🟢   🟢
Arun K.   🟢   🔴   🟢   🟢   🟢
```

---

## Manual Attendance Entry Modal (Manager+ only)

```
┌────────────────────────────────────────────────────────┐
│  Manual Attendance Entry                          [×] │
│  ──────────────────────────────────────────────────    │
│  Member *                                              │
│  [🔍 Search team member...]                            │
│  Selected: Sunil Mehta                                 │
│  ──────────────────────────────────────────────────    │
│  Date *                                                │
│  [📅 December 24, 2024]                                │
│  ──────────────────────────────────────────────────    │
│  Status *                                              │
│  ○ Present   ○ Half Day   ○ Absent   ○ Holiday         │
│  ──────────────────────────────────────────────────    │
│  (if Present or Half Day):                             │
│  Check In Time: [09:00]    Check Out: [18:00]          │
│  ──────────────────────────────────────────────────    │
│  Notes                                                 │
│  [_____________________________________________]       │
│  ──────────────────────────────────────────────────    │
│  [Cancel]              [Save Entry]                    │
└────────────────────────────────────────────────────────┘
```

---

## Leave Review Queue (Manager+ only)

Found within Team Attendance tab or separate sub-tab:

```
┌──────────────────────────────────────────────────────────────────────┐
│  Pending Leave Requests  (2)                                         │
├──────────────────────────────────────────────────────────────────────┤
│  Member        Type     Dates         Days   Reason          Action  │
│  Sunil Mehta   Casual   Dec 26        1      "Family event"  [⋮]    │
│  Arun Kumar    Sick     Dec 27–28     2      "Fever"         [⋮]    │
└──────────────────────────────────────────────────────────────────────┘
```

### Leave Review Modal

**Trigger:** `[⋮]` → Review

```
┌────────────────────────────────────────────────────┐
│  Review Leave Request                         [×] │
│  ──────────────────────────────────────────────    │
│  Member:  Sunil Mehta                              │
│  Type:    Casual Leave                             │
│  Dates:   December 26, 2024 (1 day)               │
│  Reason:  "Family event at home town"              │
│  Balance: 10 casual days available                 │
│  ──────────────────────────────────────────────    │
│  Decision *                                        │
│  ○ Approve  ○ Reject                               │
│                                                    │
│  Note (optional)                                   │
│  [_____________________________________________]   │
│  ──────────────────────────────────────────────    │
│  [Cancel]  [Reject]  [Approve]                     │
└────────────────────────────────────────────────────┘
```

"Approve" is green, "Reject" is red. Both require decision selection.
