# LeadGen Platform — Documentation

> **Frontend UI Spec** → [`docs/ui/`](ui/) folder — 16 detailed files covering every screen, modal, form, chart, and component.

---

# Backend Documentation

A multi-tenant CRM and lead management platform for field sales teams, telecalling, and marketing. Built with Node.js, Express, TypeScript, Prisma ORM, and PostgreSQL.

---

## Quick Reference

| Item | Value |
|------|-------|
| Base URL | `http://localhost:5000/api/v1` |
| Auth | Bearer JWT (access token) |
| Content-Type | `application/json` |
| API Docs | `http://localhost:5000/api-docs` |
| Health Check | `GET /health` |

---

## Documents in This Folder

| File | Contents |
|------|----------|
| `README.md` | This file — project overview and quick reference |
| `API_REFERENCE.md` | Every endpoint with request/response shapes |
| `PERMISSIONS.md` | Role hierarchy and per-endpoint access control |
| `FRONTEND_GUIDE.md` | Auth flows, pagination, error handling, UI patterns |
| `DATA_MODELS.md` | All Prisma models, enums, and field definitions |

---

## Architecture Overview

```
src/
├── config/          # Environment, constants, database, logger, swagger
├── middleware/       # Auth, RBAC, validation, error handling
├── modules/         # Feature modules (self-contained)
│   ├── auth/
│   ├── users/
│   ├── leads/
│   ├── teams/
│   ├── organization/
│   ├── analytics/
│   ├── targets/
│   ├── campaigns/
│   ├── templates/
│   ├── reminders/
│   ├── attendance/
│   └── notifications/
├── utils/           # ApiResponse, ApiError, JWT, pagination helpers
└── types/           # Global TypeScript type extensions
```

Each module has the same structure:
```
module/
├── module.routes.ts       # Express Router + Swagger JSDoc
├── module.controller.ts   # Request handlers
├── module.service.ts      # Business logic + DB queries (Prisma)
├── module.types.ts        # TypeScript interfaces
├── module.validation.ts   # Zod schemas
└── index.ts               # Barrel exports
```

---

## Role System (6 Roles)

```
super_admin        Full platform access (cross-organization)
admin              Full access within own organization
marketing_manager  Manage campaigns, leads, agents within org
marketing_agent    View & create leads, run campaigns
agent_supervisor   Manage field agents, review attendance
field_agent        Collect leads in field, check-in/out
```

---

## Module Summary

| Module | Base Route | Key Capability |
|--------|-----------|----------------|
| Auth | `/auth` | Register, login, token refresh, password change |
| Users | `/users` | Create and manage org members |
| Leads | `/leads` | Full sales pipeline (create → convert) |
| Teams | `/teams` | Group users into marketing/field teams |
| Organization | `/organizations` | Org settings and stats |
| Analytics | `/analytics` | Dashboard, trends, agent performance |
| Targets | `/targets` | Set and track KPI goals |
| Campaigns | `/campaigns` | Lead collection campaigns |
| Templates | `/templates` | SMS/Email/WhatsApp message templates |
| Reminders | `/reminders` | Lead follow-up reminders |
| Attendance | `/attendance` | Check-in/out, leave management |
| Notifications | `/notifications` | In-app notification inbox |

---

## Standard Response Envelope

### Success
```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { ... }
}
```

### Paginated List
```json
{
  "success": true,
  "message": "...",
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Error
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    { "field": "email", "message": "Invalid email address" }
  ]
}
```

---

## HTTP Status Codes Used

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request / Validation Error |
| 401 | Unauthenticated |
| 403 | Forbidden (wrong role) |
| 404 | Resource Not Found |
| 409 | Conflict (duplicate) |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your DB credentials and JWT secrets

# Generate Prisma client
npm run db:generate -- --schema=src/database/prisma/schema.prisma

# Run migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed

# Development
npm run dev

# Production build
npm run build
node dist/server.js
```
