# Auth Screens

---

## Login Page `/login`

**Layout:** Centered card on split-screen (left: illustration/branding, right: form)

```
┌──────────────────────────────────────────────────────────┐
│  LEFT PANEL (40%)             RIGHT PANEL (60%)          │
│  ┌─────────────────┐          ┌──────────────────────┐   │
│  │  App logo       │          │  Welcome back        │   │
│  │  Illustration   │          │  Sign in to continue │   │
│  │  "Manage your   │          │                      │   │
│  │   leads better" │          │  Email               │   │
│  │                 │          │  [________________]  │   │
│  │  Tagline text   │          │                      │   │
│  └─────────────────┘          │  Password            │   │
│                               │  [____________] [👁] │   │
│                               │                      │   │
│                               │  [Sign In →]         │   │
│                               │                      │   │
│                               │  Don't have an org?  │   │
│                               │  [Register]          │   │
│                               └──────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### Form Fields
| Field | Type | Validation | Error Messages |
|-------|------|-----------|----------------|
| Email | email input | required, valid email | "Enter a valid email" |
| Password | password input (toggle visibility) | required | "Password is required" |

### Buttons
- **Sign In** — Primary, full-width, loading spinner on submit
- **Register** — Link-style, routes to `/register`

### States
- Loading: Button disabled, spinner inside button
- Error (401): Red banner above form: "Invalid email or password"
- Error (401 deactivated): "Your account has been deactivated. Contact your admin."

### On Success
- Store `accessToken` in memory, `refreshToken` in localStorage
- Store `user` object in global state (Zustand/Redux/Context)
- Redirect to `/dashboard` (manager+) or `/leads` (agents)

---

## Register Page `/register`

**Layout:** Same split-screen as login

```
┌──────────────────────────────────────────────────────────┐
│  RIGHT PANEL                                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Create your account                             │   │
│  │  Set up your organization                        │   │
│  │                                                  │   │
│  │  ┌─────────────────┐  ┌─────────────────────┐   │   │
│  │  │ First Name      │  │ Last Name           │   │   │
│  │  └─────────────────┘  └─────────────────────┘   │   │
│  │                                                  │   │
│  │  Email                                           │   │
│  │  [__________________________________________]   │   │
│  │                                                  │   │
│  │  Phone (10-digit Indian mobile)                  │   │
│  │  [__________________________________________]   │   │
│  │                                                  │   │
│  │  Organization Name                               │   │
│  │  [__________________________________________]   │   │
│  │                                                  │   │
│  │  Password             Confirm Password           │   │
│  │  [______________]     [______________]           │   │
│  │                                                  │   │
│  │  Password strength: [████████░░] Strong          │   │
│  │  ✓ 8+ chars  ✓ Uppercase  ✓ Number  ✓ Symbol    │   │
│  │                                                  │   │
│  │  [Create Account →]                              │   │
│  │                                                  │   │
│  │  Already have an account? [Sign In]              │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### Form Fields
| Field | Type | Validation | Note |
|-------|------|-----------|------|
| First Name | text | required, 2–50 chars | |
| Last Name | text | required, 2–50 chars | |
| Email | email | required, valid email | Must be unique |
| Phone | tel | required, 10-digit, starts 6-9 | |
| Organization Name | text | required, 2–100 chars | Slug auto-generated |
| Password | password | min 8, uppercase+lowercase+number+symbol | Show strength meter |
| Confirm Password | password | must match password | |

### Password Strength Meter
- 4-segment bar: Weak / Fair / Strong / Very Strong
- Real-time checklist: ✓ 8+ chars / ✓ Uppercase / ✓ Number / ✓ Symbol

### Errors
- `409` on email already registered: "This email is already registered. Sign in instead?"
- Field validation: Inline red text below each field

---

## Change Password Page `/settings/password`

**Layout:** Centered card (max 480px wide)

```
┌────────────────────────────────────────┐
│  Change Password                       │
│                                        │
│  Current Password                      │
│  [________________________] [👁]       │
│                                        │
│  New Password                          │
│  [________________________] [👁]       │
│  Password strength: [███████░░░] Fair  │
│                                        │
│  Confirm New Password                  │
│  [________________________] [👁]       │
│                                        │
│  ⚠ You will be signed out from all    │
│    devices after changing password     │
│                                        │
│  [Cancel]  [Update Password]           │
└────────────────────────────────────────┘
```

### Post-Change Behavior
- Show success toast: "Password updated. Please sign in again."
- Clear tokens, redirect to `/login`

---

## Profile Page `/settings/profile`

**Layout:** Two-column form card

```
┌──────────────────────────────────────────────────┐
│  My Profile                                      │
│                                                  │
│  [Avatar circle 80px]  [Change Photo]            │
│  Role badge: "Field Agent"                       │
│  Team: "Delhi North Team"                        │
│  Org: "My Company"                               │
│  ─────────────────────────────────────────────   │
│  First Name         Last Name                    │
│  [______________]   [______________]             │
│                                                  │
│  Email (read-only)                               │
│  [________________________________]             │
│                                                  │
│  Phone                                           │
│  [________________________________]             │
│                                                  │
│  [Save Changes]                                  │
└──────────────────────────────────────────────────┘
```

- **Avatar upload:** Click opens file picker. Accepts JPEG/PNG max 2MB. Preview before save. (Store URL externally, save in PATCH /users/:id)
- Email is read-only (cannot be changed from UI)
- Role, Team, Org are display-only
