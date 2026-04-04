# Templates Module `/templates`

**Visible to:** All roles (read/preview) | marketing_agent+ (send) | marketing_manager+ (create/edit)

---

## Template List Page

```
┌─────────────────────────────────────────────────────────────────────┐
│  Message Templates  (24 total)                  [+ New Template]    │
├─────────────────────────────────────────────────────────────────────┤
│  [🔍 Search templates...]  [Channel ▼]  [Category ▼]  [Status ▼]   │
│  [Tags ▼]   [Sort: Name ▼]                                          │
├─────────────────────────────────────────────────────────────────────┤
│  Quick Tabs: [All(24)] [SMS(10)] [Email(8)] [WhatsApp(6)]           │
├─────────────────────────────────────────────────────────────────────┤
│  CARD GRID (3 columns)                                              │
│                                                                     │
│  ┌─────────────────────────┐  ┌─────────────────────────┐          │
│  │ 💬 SMS                  │  │ 📧 Email                │          │
│  │ Welcome New Lead        │  │ Follow-up Reminder      │          │
│  │ ─────────────────────   │  │ ─────────────────────   │          │
│  │ lead_introduction       │  │ lead_followup           │          │
│  │                         │  │                         │          │
│  │ "Hi {{firstName}},      │  │ "Hi {{firstName}},      │          │
│  │  thank you for your..." │  │  just checking in on..."│          │
│  │ (truncated to 2 lines)  │  │                         │          │
│  │ ─────────────────────   │  │ ─────────────────────   │          │
│  │ 🏷 onboarding  welcome  │  │ 🏷 followup             │          │
│  │ 📊 Used 45 times        │  │ 📊 Used 12 times        │          │
│  │ 🟢 Active               │  │ 🟢 Active               │          │
│  │                         │  │                         │          │
│  │ [Preview] [Send] [⋮]    │  │ [Preview] [Send] [⋮]   │          │
│  └─────────────────────────┘  └─────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
```

### Channel Tab Icons
```
💬 SMS       — Character count visible (160 chars = 1 SMS)
📧 Email     — Has subject line
🟢 WhatsApp  — Supports buttons and header
```

### Category Filter Options
```
☐ Lead Follow-up
☐ Lead Introduction
☐ Appointment Reminder
☐ Status Update
☐ Welcome
☐ Promotional
☐ Feedback
☐ General
```

### Card Kebab (`⋮`)
```
View / Edit
Preview Template
Duplicate
─────────────────
Deactivate  (if active)
Activate    (if inactive)
Delete      (admin only, red)
```

---

## Create / Edit Template Page `/templates/new` or `/templates/:id/edit`

**Full-page layout (not a modal) due to complexity**

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Templates         New Template                      [Save Draft]  │
│                                                        [Publish]     │
├──────────────────────────────────────────────────────────────────────┤
│  LEFT (editor, 55%)              RIGHT (preview, 45%)                │
│  ─────────────────────────────   ──────────────────────────────────  │
│  Template Name *                 LIVE PREVIEW                        │
│  [___________________________]                                       │
│                                  ┌──────────────────────────────┐   │
│  Channel *                       │  📱 SMS Preview              │   │
│  ○ 💬 SMS  ○ 📧 Email  ○ 🟢 WA  │                              │   │
│                                  │  Hi John, thank you for      │   │
│  Category *                      │  your interest! Our agent    │   │
│  [Dropdown ▼]                    │  Ravi will call you on       │   │
│                                  │  9876543210 shortly.         │   │
│  Tags (optional)                 │                              │   │
│  [tag input]                     │  [Missing: assignedTo]       │   │
│  ─────────────────────────────   └──────────────────────────────┘   │
│  [EMAIL ONLY] Subject *                                              │
│  [_________________________________]     Sample Data (for preview)   │
│                                          ──────────────────────────  │
│  Content *                               firstName:  [John      ]   │
│  ┌─────────────────────────────────┐    lastName:   [Doe       ]   │
│  │  Hi {{firstName}}, thank you    │    phone:      [9876...]   ]   │
│  │  for your interest! Our agent   │    city:       [Delhi     ]   │
│  │  {{assignedTo}} will call you   │    assignedTo: [Ravi      ]   │
│  │  on {{phone}} shortly.          │                              │   │
│  │                                 │    [Update Preview]          │   │
│  └─────────────────────────────────┘                              │   │
│  Characters: 125 / 160  (SMS)       Variables found:              │   │
│                                     ✓ {{firstName}}               │   │
│  Available Variables (click to insert):  ✓ {{phone}}              │   │
│  [{{firstName}}] [{{lastName}}]     ⚠ {{assignedTo}} — dynamic   │   │
│  [{{phone}}] [{{email}}] [{{city}}]                               │   │
│  [{{state}}] [{{assignedTo}}]                                     │   │
│  [{{createdDate}}] [{{status}}]                                   │   │
│                                                                      │
│  ─────────────────────────────────────────────────────────────────   │
│  [CHANNEL SETTINGS — expands per channel]                            │
└──────────────────────────────────────────────────────────────────────┘
```

### Channel Settings — SMS
```
┌─────────────────────────────────────────────────────┐
│  SMS Settings                                       │
│  Sender ID: [LEADGN    ] (6 chars, A-Z)             │
│  ☐ Unicode (for Hindi / regional language)          │
│  Character count: 125 / 160  (1 SMS)               │
│  160+ chars = multiple SMS segments                 │
└─────────────────────────────────────────────────────┘
```

### Channel Settings — Email
```
┌─────────────────────────────────────────────────────┐
│  Email Settings                                     │
│  From Name:   [LeadGen App     ]                    │
│  Reply-To:    [support@company.com]                 │
│  CC:          [tag input — emails]                  │
│  BCC:         [tag input — emails]                  │
│  ☑ Track Email Opens                               │
│  ☑ Track Link Clicks                               │
└─────────────────────────────────────────────────────┘
```

### Channel Settings — WhatsApp
```
┌─────────────────────────────────────────────────────┐
│  WhatsApp Settings                                  │
│  WA Template ID: [_______________________]          │
│  Header Type: ○ Text  ○ Image  ○ Document  ○ Video  │
│  Header Value: [_____________________________]       │
│  Footer Text:  [_____________________________]       │
│  Buttons (max 3):                                   │
│  [Type ▼][Text         ][Value/URL    ] [+ Add]     │
└─────────────────────────────────────────────────────┘
```

### Content Editor Features
- Plain textarea (not rich-text for SMS/WhatsApp)
- Rich text editor (WYSIWYG) for Email channel — with bold, italic, links, bullets, images
- Variable pill buttons below — clicking inserts `{{variableName}}` at cursor
- Real-time character counter for SMS (with SMS segment count)
- Variables auto-detected in content and listed in preview panel

---

## Template Preview Modal

**Trigger:** `[Preview]` button on card or detail page

```
┌──────────────────────────────────────────────────────────────────┐
│  Preview: Welcome New Lead                              [×]       │
│  ──────────────────────────────────────────────────────────────  │
│  Preview with:                                                   │
│  ○ Sample Data   ● Real Lead Data                               │
│                                                                  │
│  [SMS  channel pill]                                             │
│  ──────────────────────────────────────────────────────────────  │
│  RENDERED OUTPUT:                                                │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Hi Priya, thank you for your interest! Our agent      │     │
│  │  Ravi Kumar will call you on 9876543210 shortly.       │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ✓ All variables resolved                                        │
│  ──────────────────────────────────────────────────────────────  │
│  (if "Real Lead Data" mode selected)                             │
│  Lead: [🔍 Search lead by name/phone...]                         │
│  Selected: Priya Sharma (9876543210)                             │
│  ──────────────────────────────────────────────────────────────  │
│  [Close]                              [Send to this Lead →]      │
└──────────────────────────────────────────────────────────────────┘
```

---

## Send Template Modal

**Trigger:** `[Send]` on card, or from Lead detail page

```
┌──────────────────────────────────────────────────────────────────┐
│  Send: Welcome New Lead                                    [×]   │
│  Channel: 💬 SMS                                                 │
│  ──────────────────────────────────────────────────────────────  │
│  Send Mode:                                                      │
│  ○ Single Lead    ● Bulk (multiple leads)                        │
│  ──────────────────────────────────────────────────────────────  │
│  [SINGLE MODE]                                                   │
│  Lead:  [🔍 Search lead...]                                      │
│  Preview:                                                        │
│  "Hi Priya, thank you..."                                        │
│  ──────────────────────────────────────────────────────────────  │
│  [BULK MODE — shown when "Bulk" selected]                        │
│  Select Leads (max 200):                                         │
│  [🔍 Search leads...]  [Filter by Status ▼] [Filter by Tags ▼]  │
│  ☑ Priya Sharma    9876543210   New                             │
│  ☑ Raj Mehta       9876543211   Contacted                       │
│  ☐ Sunil Gupta     9876543212   Qualified                       │
│  Selected: 2 / 200 max                                          │
│  ──────────────────────────────────────────────────────────────  │
│  Override Variables (optional):                                  │
│  assignedTo: [Override value or leave blank for auto]            │
│  ──────────────────────────────────────────────────────────────  │
│  [Cancel]                              [Send Now]                │
└──────────────────────────────────────────────────────────────────┘
```

### Bulk Send Result UI

After send completes, shows a result summary:

```
┌──────────────────────────────────────────────┐
│  Bulk Send Complete                    [×]  │
│                                             │
│  ✅ Sent successfully:  48                  │
│  ❌ Failed:              2                  │
│  Total:                 50                  │
│                                             │
│  Failed leads:                              │
│  • Sunil Gupta — No phone number            │
│  • Ankit K.    — Invalid phone              │
│                                             │
│  [Download Report]    [Close]               │
└──────────────────────────────────────────────┘
```

---

## Template Detail Page `/templates/:id`

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Templates    Welcome New Lead           [Edit] [Duplicate] [⋮]│
├──────────────────────────────────────────────────────────────────┤
│  💬 SMS  ·  lead_introduction  ·  🟢 Active                      │
│  Tags: [onboarding] [welcome]                                    │
│  Used 45 times  ·  Created Dec 1, 2024                           │
├────────────────────────────────┬─────────────────────────────────┤
│  CONTENT                       │  VARIABLES                      │
│  ─────────────────────────     │  ──────────────────────────     │
│  "Hi {{firstName}}, thank you  │  {{firstName}} — Lead first name│
│  for your interest! Our agent  │  {{phone}}     — Lead phone     │
│  {{assignedTo}} will call you  │  {{assignedTo}}— Assigned agent │
│  on {{phone}} shortly."        │                                 │
│                                │  SETTINGS                       │
│  Characters: 125               │  ──────────────────────────     │
│                                │  Sender ID: LEADGN              │
│                                │  Unicode: No                    │
│                                │                                 │
│                                │  USAGE                          │
│                                │  ──────────────────────────     │
│                                │  Last sent: Dec 24, 2024        │
│                                │  Total sent: 45                 │
│                                │  Success rate: 97.8%            │
├────────────────────────────────┴─────────────────────────────────┤
│  [Preview]                              [Send Template →]         │
└──────────────────────────────────────────────────────────────────┘
```
