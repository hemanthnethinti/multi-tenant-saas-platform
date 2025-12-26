# Research

## Multi-Tenancy Approaches
Comparison of:
- Shared DB + Shared Schema (chosen): simple ops, `tenant_id` isolation, efficient; requires strict query filtering.
- Shared DB + Separate Schemas: stronger isolation, more complex migrations.
- Separate DB per tenant: strongest isolation, highest cost and operational overhead.

Chosen: Shared DB + Shared Schema, with rigorous API-layer isolation and per-tenant indexes.

## Technology Stack Justification
- Backend: Node.js/Express for rapid API dev and ecosystem.
- Database: PostgreSQL for robust constraints, JSON support, extensions.
- Auth: JWT for stateless scale; optional sessions omitted.
- Frontend: React for responsive UI, routing, and component model.
- Deployment: Docker Compose for local orchestration and evaluation.

## Security Considerations
- Password hashing (bcrypt 10 rounds), never store plaintext.
- JWT includes only `{userId, tenantId, role}`; 24h expiry.
- Tenant isolation: enforce `tenant_id` from JWT; never trust client `tenant_id`.
- Input validation on all endpoints; least-privilege RBAC.
- Audit logging of CREATE/UPDATE/DELETE.
