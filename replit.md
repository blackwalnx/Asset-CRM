# Think Tank CRM

## Overview

A secure, institutional CRM web application for managing high-level contacts and policy interactions. Built for research institutions and think tanks. NOT a commercial CRM.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS (artifacts/crm)
- **Backend**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Authentication**: Replit Auth (OIDC/PKCE, no custom login forms)
- **Validation**: Zod (zod/v4), drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **Charts**: Recharts (dashboard)
- **Build**: esbuild (API server)

## Architecture

```text
artifacts/
├── api-server/          # Express 5 API server (port 8080)
│   └── src/
│       ├── lib/auth.ts          # OIDC session management
│       ├── middlewares/authMiddleware.ts   # Auth + role injection
│       └── routes/
│           ├── auth.ts          # OIDC login/callback/logout
│           ├── contacts.ts      # Contact CRUD + soft delete
│           ├── interactions.ts  # Interaction log
│           ├── users.ts         # User/role management
│           ├── dashboard.ts     # Dashboard stats
│           └── audit.ts         # Audit log
└── crm/                 # React + Vite frontend (port 22444)
    └── src/
        ├── pages/        # login, dashboard, contacts, interactions, admin, audit, submit
        ├── components/   # layout, auth-guard, ui
        └── hooks/        # use-roles.ts (role-based auth)

lib/
├── api-spec/openapi.yaml    # OpenAPI 3.1 source of truth
├── api-client-react/        # Generated React Query hooks
├── api-zod/                 # Generated Zod schemas
├── db/                      # Drizzle ORM schema + connection
│   └── src/schema/
│       ├── auth.ts     # sessions, users tables (Replit Auth)
│       └── crm.ts      # contacts, interactions, crm_roles, audit_logs
└── replit-auth-web/    # useAuth() hook for browser auth
```

## Role-Based Access Control

Roles: `super_admin`, `admin`, `fellow`, `associate`, `contributor`, `viewer`

- **super_admin / admin**: Full access including confidential notes, user management, audit log
- **fellow / associate**: Can view/edit contacts and log interactions
- **contributor**: Can only use the /submit form
- **viewer**: Read-only access

## Key Features

- **Contacts Module**: Add/edit/view/archive contacts. Auto-generated Contact IDs (e.g., GOV-0001). Duplicate email detection. Data aging alerts (180+ days without update).
- **Interaction Log**: Log meetings, events, interviews. Follow-up tracking. Overdue alerts.
- **Dashboard**: Charts for contacts by category, relationship breakdown, monthly interactions, overdue follow-ups.
- **Policy Domain Tagging**: Economy, Defence, Tech, Climate, Governance, Health, Foreign Policy, Education
- **Engagement Scoring**: Calculated from interaction count + recency
- **Confidential Field Masking**: `confidentialNotes` hidden from non-admin roles
- **Soft Delete**: Archive instead of permanent delete
- **Audit Logging**: All create/update/archive actions tracked with user + timestamp
- **Public Submit Form**: `/submit` page accessible without login

## API Endpoints

All under `/api`:
- `GET /auth/user` — Current auth state
- `GET /login` — Start OIDC login
- `GET /callback` — OIDC callback
- `GET /logout` — End session
- `GET/POST /contacts` — List and create contacts
- `POST /contacts/submit` — Public form submission
- `GET/PUT/DELETE /contacts/:id` — Contact CRUD
- `GET/POST /interactions` — List and log interactions
- `GET/PUT /interactions/:id` — Interaction CRUD
- `GET /users` — List users with roles (admin only)
- `GET /users/me` — Current user with role
- `PUT /users/:id/role` — Update user role (admin only)
- `GET /dashboard/stats` — Dashboard statistics
- `GET /audit` — Audit log (admin only)

## Environment Variables

- `SESSION_SECRET` — Express session secret
- `DATABASE_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` — Database connection
- `REPL_ID` — Used for OIDC client ID (auto-provided by Replit)

## Running

- Frontend dev: `pnpm --filter @workspace/crm run dev`
- API dev: `pnpm --filter @workspace/api-server run dev`
- DB schema push: `pnpm --filter @workspace/db run push`
- Codegen: `pnpm --filter @workspace/api-spec run codegen`
