# Multi-Tenant SaaS Platform

Production-ready, multi-tenant project and task management system with strict tenant data isolation, RBAC, subscription limits, RESTful APIs, responsive React frontend, and Docker orchestration.

**Target audience:** Teams building SaaS offerings requiring multi-tenancy, strong auth, and fast deployability.

## Features
- Multi-tenancy with strict `tenant_id` isolation
- Roles: `super_admin`, `tenant_admin`, `user`
- JWT auth (24h), protected routes, RBAC
- Subscription limits (free/pro/enterprise)
- Projects and tasks with rich filtering
- Full audit logging for key actions
- Health check: `/api/health`
- One-command Docker deployment

## Tech Stack
- Backend: Node.js, Express, PostgreSQL (`pg`), `bcrypt`, JWT
- Frontend: React (CRA), Axios (planned), React Router (planned)
- Containerization: Docker, docker-compose

## Architecture Overview
See docs/architecture.md and diagrams in docs/images (planned). Backend exposes `/api/*` with auth middleware enforcing tenant isolation; Postgres stores tenants, users, projects, tasks, and audit logs.

## Installation & Setup
Prerequisites: Docker Desktop

Start all services:

```bash
docker-compose up -d
```

Verify:

```bash
curl http://localhost:5000/api/health
# -> {"status":"ok","database":"connected"}
```

Frontend: http://localhost:3000
Backend Base URL (from frontend): http://localhost:5000/api

## Environment Variables
Backend (provided via docker-compose):
- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- JWT_SECRET, PORT, NODE_ENV
- FRONTEND_URL (use http://frontend:3000 in Docker)

## API Documentation
See docs/API.md for the full list of 19 endpoints. Key groups:
- Auth: `POST /api/auth/register-tenant`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- Tenants: `GET /api/tenants/:tenantId`, `PUT /api/tenants/:tenantId`, `GET /api/tenants`
- Users: `POST /api/tenants/:tenantId/users`, `GET /api/tenants/:tenantId/users`, `PUT /api/users/:userId`, `DELETE /api/users/:userId`
- Projects: `POST /api/projects`, `GET /api/projects`, `PUT /api/projects/:projectId`, `DELETE /api/projects/:projectId`
- Tasks: `POST /api/projects/:projectId/tasks`, `GET /api/projects/:projectId/tasks`, `PATCH /api/tasks/:taskId/status`, `PUT /api/tasks/:taskId`

## Demo Video
Add your YouTube link here.