# API Documentation

This document lists the 19 REST endpoints implemented by the backend. All responses follow the format:

- Success: { success: true, message?: string, data?: any }
- Error: { success: false, message: string }

Authentication
- JWT Bearer tokens required for protected endpoints. Include header: Authorization: Bearer <token>

## Auth
- POST /api/auth/register-tenant
  - Body: { tenantName, subdomain, adminEmail, adminPassword, adminFullName }
  - Roles: public
  - Notes: Creates tenant + tenant_admin; plan free by default.

- POST /api/auth/login
  - Body: { email, password, tenantSubdomain }
  - Roles: public
  - Returns: { token, user, expiresIn }

- GET /api/auth/me
  - Roles: any authenticated
  - Returns: current user + tenant info

- POST /api/auth/logout
  - Roles: any authenticated

## Tenants
- GET /api/tenants/:tenantId
  - Roles: same tenant users or super_admin
  - Returns: tenant details + aggregates

- PUT /api/tenants/:tenantId
  - Roles: tenant_admin (name updates); super_admin (status/plan/limits)

- GET /api/tenants
  - Roles: super_admin
  - Query: { search?, status?, plan?, limit?, offset? }

## Users
- POST /api/tenants/:tenantId/users
  - Roles: tenant_admin in same tenant
  - Body: { email, fullName, password, role }
  - Enforces: max_users limit, unique email per tenant

- GET /api/tenants/:tenantId/users
  - Roles: any user in same tenant
  - Query: { search?, role?, limit?, offset? }

- PUT /api/users/:userId
  - Roles: self (update fullName); tenant_admin (role/isActive)
  - Enforces: same-tenant checks

- DELETE /api/users/:userId
  - Roles: tenant_admin in same tenant
  - Notes: cannot delete self; tasks unassigned

## Projects
- POST /api/projects
  - Roles: any user in tenant
  - Body: { name, description?, status? }
  - Enforces: max_projects per tenant

- GET /api/projects
  - Roles: any user in tenant
  - Query: { status?, search?, limit?, offset? }
  - Returns: list with task counts

- PUT /api/projects/:projectId
  - Roles: tenant_admin or project creator
  - Body: partial updates { name?, description?, status? }

- DELETE /api/projects/:projectId
  - Roles: tenant_admin or project creator
  - Notes: cascades delete via FK

## Tasks
- POST /api/projects/:projectId/tasks
  - Roles: any user in same tenant
  - Body: { title, description?, assignedTo?, priority?, dueDate? }

- GET /api/projects/:projectId/tasks
  - Roles: any user in same tenant
  - Query: { status?, assignedTo?, priority?, search?, limit?, offset? }

- PATCH /api/tasks/:taskId/status
  - Roles: any user in same tenant
  - Body: { status }

- PUT /api/tasks/:taskId
  - Roles: any user in same tenant
  - Body: partial updates { title?, description?, assignedTo?, status?, priority?, dueDate? }

## Health
- GET /api/health
  - Roles: public
  - Returns: { status: "ok", database: "connected" } when ready

## Notes
- Audit logs recorded for key actions.
- All IDs are UUIDv4 via crypto.randomUUID.
- Tenant isolation enforced by JWT-derived `tenantId`.
