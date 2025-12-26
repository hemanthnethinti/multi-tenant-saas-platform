# Architecture

This system follows a shared-database, shared-schema multi-tenancy model using `tenant_id` on all rows except `super_admin` users. Isolation is enforced at the API layer via JWT-derived tenant context.

## Diagram
Planned: docs/images/system-architecture.png

## Database ERD
Planned: docs/images/database-erd.png

## API Architecture
- Auth: register tenant, login, me, logout
- Tenants: get details, update (role-restricted), list (super_admin only)
- Users: add, list, update, delete
- Projects: create, list, update, delete
- Tasks: create, list by project, update status, update
