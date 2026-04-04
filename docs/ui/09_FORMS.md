# Forms Module `/forms`

**Visible to:** All roles (view public) | admin+ (create/edit/publish)

Forms are the lead collection schema. When a field agent fills a form, the responses go into `lead.formData` (JSON).

---

## Form List Page

```
┌──────────────────────────────────────────────────────────────────────┐
│  Forms  (8 total)                                    [+ Create Form] │
├──────────────────────────────────────────────────────────────────────┤
│  [🔍 Search forms...]  [Status ▼]  [Sort: Updated ▼]                │
├──────────────────────────────────────────────────────────────────────┤
│  Quick Tabs: [All(8)] [Published(5)] [Draft(3)]                      │
├──────────────────────────────────────────────────────────────────────┤
│  Name                    Status       Fields  Leads    Updated       │
│  ─────────────────────────────────────────────────────────────────   │
│  Survey Form 1           🟢 Published   12    234     Dec 20         │
│  Field Visit Form         🟢 Published    8     89     Dec 18         │
│  Product Interest Survey  🔘 Draft        5      0     Dec 15         │
│  Premium Plan Enquiry     🟢 Published   10     56     Dec 10         │
│  Quick Collect (minimal)  🔘 Draft        3      0     Dec 5          │
├──────────────────────────────────────────────────────────────────────┤
│  ← Prev  Page 1 of 1  Next →                                         │
└──────────────────────────────────────────────────────────────────────┘
```

### Row Actions (kebab `⋮`)
```
View Form
Edit in Builder
Preview Form
Duplicate
─────────────────
Publish   (if draft)
Unpublish (if published)
─────────────────
Delete (red)
```

**Cannot publish** if form has 0 fields (API returns error: "Cannot publish a form without fields").

---

## Form Builder Page `/forms/new` or `/forms/:id/edit`

**Full-page, drag-and-drop builder**

```
┌────────────────────────────────────────────────────────────────────────┐
│  ← Forms     [Form Name: "Survey Form 1"  ✎]    [Preview] [Publish]   │
├───────────────┬─────────────────────────────────┬──────────────────────┤
│  LEFT PANEL   │  CANVAS (center, 60%)            │  RIGHT PANEL         │
│  Field Types  │  Drop fields here               │  Field Settings      │
│  (20%)        │                                 │  (20%)               │
│               │                                 │                      │
│  BASIC        │  ┌──────────────────────────┐   │  (When a field is    │
│  [Aa] Text    │  │ * First Name             │   │   selected, shows    │
│  [¶] Textarea │  │ [________________]       │   │   its properties)    │
│  [#] Number   │  └──────────────────────────┘   │                      │
│  [✉] Email    │  ┌──────────────────────────┐   │  FIELD LABEL         │
│  [📱] Phone   │  │ * Phone Number           │   │  [First Name   ]     │
│               │  │ [________________]       │   │                      │
│  CHOICE       │  └──────────────────────────┘   │  PLACEHOLDER         │
│  [▼] Dropdown │  ┌──────────────────────────┐   │  [Enter first name]  │
│  [◉] Radio    │  │   Product Interest       │   │                      │
│  [☐] Checkbox │  │   ○ Basic Plan           │   │  HELP TEXT           │
│  [⊙] Toggle   │  │   ○ Premium Plan         │   │  [______________]    │
│               │  │   ○ Enterprise           │   │                      │
│  DATE/TIME    │  └──────────────────────────┘   │  VALIDATION          │
│  [📅] Date    │                                 │  ☑ Required          │
│  [⏰] Time    │  [+ Add Field]  (drag from left │  Min length: [2 ]    │
│  [📅⏰] Both  │  panel or click this button)    │  Max length: [50]    │
│               │                                 │                      │
│  RATING       │  ════════════════════════════   │  WIDTH               │
│  [⭐] Rating  │  FIELD ORDER (drag to reorder)  │  ○ Full              │
│  [↔] Slider   │  [≡ drag handle] Field name     │  ○ Half              │
│               │                                 │  ○ Third             │
│  MEDIA        │                                 │                      │
│  [📄] File    │                                 │  CONDITIONAL LOGIC   │
│  [🖼] Image   │                                 │  Show when:          │
│  [📷] Camera  │                                 │  [Field ▼] [= ▼]    │
│               │                                 │  [Value      ]       │
│  LOCATION     │                                 │                      │
│  [📍] Location│                                 │  OPTIONS (for        │
│  [🏠] Address │                                 │  dropdown/radio/     │
│               │                                 │  checkbox fields)    │
│  LAYOUT       │                                 │  Basic Plan     [×]  │
│  [─] Divider  │                                 │  Premium Plan   [×]  │
│  [H] Heading  │                                 │  Enterprise     [×]  │
│  [¶] Paragraph│                                 │  [+ Add Option]      │
│  [▣] Section  │                                 │                      │
└───────────────┴─────────────────────────────────┴──────────────────────┘
```

### Left Panel: Field Type Palette

Organized into groups:

**Basic Input:**
- Text (single line)
- Textarea (multi-line)
- Number
- Email
- Phone

**Choice:**
- Dropdown (select one)
- Radio (select one, visible options)
- Checkbox (select multiple)
- Toggle (yes/no)

**Date & Time:**
- Date
- Time
- Date + Time

**Scale:**
- Rating (stars, 1–5)
- Slider (numeric range)

**Media / Capture:**
- File Upload
- Image Upload
- Camera (capture photo)

**Location:**
- GPS Location (captures lat/lng)
- Address (structured address fields)

**Layout Elements:**
- Divider (horizontal line)
- Section Header
- Heading (display text)
- Paragraph (description text)

Clicking a field type adds it to the bottom of the canvas.
Dragging a field type drops it at the cursor position.

---

### Canvas: Field Cards

Each field on canvas shows:
```
┌──────────────────────────────────────────────────────────┐
│  [≡ drag]  📱 Phone  *Required                 [✎] [×]  │
│  ──────────────────────────────────────────────────────  │
│  Phone Number                                            │
│  [Enter phone number                           ]         │
│  Help: "10-digit Indian mobile number"                   │
└──────────────────────────────────────────────────────────┘
```

- `[≡]` drag handle — reorder fields
- `[✎]` select field (opens Right Panel with settings)
- `[×]` delete field (confirm if data exists)
- Fields can be laid out in full/half/third width columns

---

### Right Panel: Field Settings

Dynamically shows settings for the currently selected field:

**All field types:**
- Label (required)
- Placeholder text
- Help text
- Required toggle
- Width: Full / Half / Third

**Text / Textarea:**
- Min length
- Max length
- Pattern regex (advanced)

**Number:**
- Min value
- Max value

**Dropdown / Radio / Checkbox:**
- Options list (add/remove/reorder)
- Default selected option

**Rating:**
- Max stars (3/5/10)
- Labels for min/max

**Slider:**
- Min value / Max value / Step

**Date:**
- Min date / Max date
- Default to today toggle

**Conditional Logic (all types):**
```
Show this field when:
Field: [Product Interest ▼]
Operator: [equals ▼]
Value: [Premium Plan]
Action: ○ Show  ○ Hide  ○ Require
```

---

## Form Preview Modal

**Trigger:** `[Preview]` button on builder page

```
┌────────────────────────────────────────────────────────────┐
│  Preview: Survey Form 1                            [×]     │
│  ──────────────────────────────────────────────────────    │
│  [Mobile view toggle] [Desktop view toggle]                │
│  ──────────────────────────────────────────────────────    │
│  RENDERED FORM (as users would see it):                    │
│                                                            │
│  * First Name            * Phone Number                    │
│  [__________________]    [__________________]             │
│                                                            │
│  Product Interest *                                        │
│  ○ Basic Plan                                             │
│  ○ Premium Plan                                           │
│  ○ Enterprise                                             │
│                                                            │
│  Notes                                                     │
│  [_____________________________________________]          │
│  [_____________________________________________]          │
│                                                            │
│  [Submit Lead]                                             │
│  ──────────────────────────────────────────────────────    │
│  [Close Preview]                                           │
└────────────────────────────────────────────────────────────┘
```

---

## Public Form Page `/forms/public/:id`

**No authentication required** — used when sharing form link externally or embedding.

```
┌────────────────────────────────────────────────────────────┐
│  [Org Logo]   My Company                                   │
│  ──────────────────────────────────────────────────────    │
│  Survey Form 1                                             │
│  Please fill in your details below                         │
│  ──────────────────────────────────────────────────────    │
│  [Form fields rendered dynamically from API]               │
│  ──────────────────────────────────────────────────────    │
│  [Submit]                                                  │
│  ──────────────────────────────────────────────────────    │
│  Powered by LeadGen                                        │
└────────────────────────────────────────────────────────────┘
```

- On submit: `POST /leads` with `formId` and `formData`
- Success state: "Thank you! Your information has been submitted."
- GPS auto-capture if form has location field

---

## Publish / Unpublish Confirmation

```
┌──────────────────────────────────────────────────────┐
│  Publish Form?                                       │
│                                                      │
│  "Survey Form 1" will be available for lead          │
│  collection. Agents can use this form to submit      │
│  leads.                                              │
│                                                      │
│  [Cancel]              [Publish]                     │
└──────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────┐
│  Unpublish Form?                                     │
│                                                      │
│  "Survey Form 1" will no longer accept new leads.    │
│  Existing leads collected via this form are retained.│
│                                                      │
│  [Cancel]              [Unpublish]                   │
└──────────────────────────────────────────────────────┘
```
