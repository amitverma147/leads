# Organization & Multi-Tenancy

---

## Multi-Tenancy Model

Every user belongs to exactly one Organization. All data — leads, users, teams, campaigns, forms, templates, targets, reminders — is **isolated per organization**. The `organizationId` is embedded in the JWT token and enforced server-side. The frontend never needs to send or manage `organizationId`.

**Key rules for the UI:**
- User can only ever see their own organization's data
- The organization context is always implicit — no org switcher for normal users
- `super_admin` users can theoretically see all orgs — build an org switcher only for super_admin dashboard (optional, separate admin panel)
- Slug is set at registration and is immutable — do not show it as editable
- Organization name appears in the topbar / sidebar header

---

## Organization Settings Page `/settings/organization`

**Visible to:** admin, super_admin

```
┌──────────────────────────────────────────────────────────────────┐
│  Organization Settings                                           │
├──────────────────────────────────────────────────────────────────┤
│  TABS:  [General]  [Working Hours]  [Notifications]  [Advanced]  │
└──────────────────────────────────────────────────────────────────┘
```

---

### Tab 1: General

```
┌──────────────────────────────────────────────────────────────────┐
│  Organization Profile                                            │
│  ─────────────────────────────────────────────────────────────   │
│  [Logo 80px circle / square]  [Change Logo]  [Remove]            │
│                                                                  │
│  Organization Name *                                             │
│  [__________________________________]                            │
│                                                                  │
│  Organization Slug (read-only)                                   │
│  [my-company] ← grayed out, cannot edit                         │
│  ─────────────────────────────────────────────────────────────   │
│  Localization                                                    │
│                                                                  │
│  Timezone                     Date Format                        │
│  [Asia/Kolkata (IST) ▼]       [DD/MM/YYYY ▼]                    │
│                                                                  │
│  Currency                     Language                           │
│  [INR - ₹ ▼]                  [English ▼]                        │
│  ─────────────────────────────────────────────────────────────   │
│  Lead Settings                                                   │
│                                                                  │
│  ☑ Auto-assign leads to available agents                         │
│  ☑ Check for duplicate leads (by phone number)                  │
│  ☐ Require geolocation on lead collection                       │
│                                                                  │
│  Max Leads Per Agent                                             │
│  [50]  agents                                                    │
│  ─────────────────────────────────────────────────────────────   │
│  [Save Changes]                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Timezone Dropdown:** Searchable, major Indian/global timezones. Default `Asia/Kolkata`.

**Date Format Options:**
- DD/MM/YYYY (Indian standard)
- MM/DD/YYYY
- YYYY-MM-DD

**Currency Options:** INR ₹ (default), USD $, EUR €, GBP £

**Logo Upload:**
- Click "Change Logo" → file picker, accepts JPEG/PNG, max 2MB
- Shows preview before saving
- Crops to circle/square in a cropper UI
- Saves URL to `settings.logo`

---

### Tab 2: Working Hours

```
┌──────────────────────────────────────────────────────────────────┐
│  Working Hours                                                   │
│  Configure when your team is expected to be active               │
│  ─────────────────────────────────────────────────────────────   │
│  Day        Enabled    Start Time    End Time                    │
│  ─────────────────────────────────────────────────────────────   │
│  Monday     [☑]        [09:00]       [18:00]                     │
│  Tuesday    [☑]        [09:00]       [18:00]                     │
│  Wednesday  [☑]        [09:00]       [18:00]                     │
│  Thursday   [☑]        [09:00]       [18:00]                     │
│  Friday     [☑]        [09:00]       [18:00]                     │
│  Saturday   [☐]        [10:00]       [14:00]  (disabled/gray)   │
│  Sunday     [☐]        [10:00]       [14:00]  (disabled/gray)   │
│  ─────────────────────────────────────────────────────────────   │
│  [Apply Mon–Fri to All]   [Reset to Defaults]                    │
│  [Save Changes]                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- Toggle rows on/off with the checkbox. Disabled rows grayed out.
- Time inputs: 30-minute increments in dropdown or direct text input (HH:MM)
- "Apply Mon–Fri to All" copies Mon settings to all enabled days
- Maps to `settings.workingHours` in `PATCH /organizations/current`

---

### Tab 3: Notifications

```
┌──────────────────────────────────────────────────────────────────┐
│  Notification Preferences                                        │
│  ─────────────────────────────────────────────────────────────   │
│  Channels                                                        │
│  ☑ In-app notifications                                          │
│  ☑ Email notifications                                           │
│  ☐ SMS notifications                                             │
│  ─────────────────────────────────────────────────────────────   │
│  Events                                                          │
│  ☑ Notify when a new lead is assigned                            │
│  ☑ Notify when lead status changes                               │
│  ☑ Follow-up reminder alerts                                     │
│  ☑ New lead collected (for managers)                             │
│  ☑ Daily digest email (8 AM)                                     │
│  ─────────────────────────────────────────────────────────────   │
│  [Save Preferences]                                              │
└──────────────────────────────────────────────────────────────────┘
```

---

### Tab 4: Advanced / Danger Zone

```
┌──────────────────────────────────────────────────────────────────┐
│  Advanced Settings                                               │
│  ─────────────────────────────────────────────────────────────   │
│  Organization Stats                                              │
│  Total Users: 25   Active: 22                                    │
│  Total Leads: 1,500    Teams: 4    Forms: 8                      │
│  ─────────────────────────────────────────────────────────────   │
│  ⚠️  Danger Zone                                                  │
│  ─────────────────────────────────────────────────────────────   │
│  Export All Data                                                 │
│  Download a full export of all leads, users, and activities      │
│  [Export Data]  (grayed if export not implemented yet)           │
│                                                                  │
│  Deactivate Organization                                         │
│  Disables all user logins. Contact support to reactivate.       │
│  [Deactivate Organization]  (red, requires confirmation)         │
└──────────────────────────────────────────────────────────────────┘
```

---

## Organization Stats Card (Dashboard / Sidebar footer)

Shown in sidebar bottom or on Settings page:

```
┌────────────────────────────────┐
│  My Company                    │
│  [Logo]  Slug: my-company      │
│  ─────────────────────────────  │
│  👥 25 users   🏢 6 teams      │
│  📋 1,500 leads   📝 8 forms   │
└────────────────────────────────┘
```

---

## Sidebar Header (Org context display)

```
┌──────────────────────────┐
│  [Logo] My Company       │  ← Org name + logo
│  Amit Verma · Admin      │  ← Logged-in user name + role
└──────────────────────────┘
```

When sidebar is collapsed (icon-only mode):
- Shows just the org logo (40px square/circle)
- Tooltip on hover shows org name
