# Product Requirements (PRD)

## User Personas
- Super Admin: System-level administrator; manages tenants and plans.
- Tenant Admin: Organization admin; manages users, projects, tasks.
- End User: Team member; works on assigned tasks.

## Functional Requirements (examples)
- FR-001: The system shall allow tenant registration with unique subdomain.
- FR-002: The system shall enforce subscription plan limits.
- FR-003: The system shall isolate tenant data completely.
- FR-004: The system shall provide JWT-based authentication.
- FR-005: The system shall provide role-based authorization.
- FR-006: The system shall allow tenant admins to add users.
- FR-007: The system shall allow listing users per tenant with filters.
- FR-008: The system shall allow updating user profiles and status.
- FR-009: The system shall prevent tenant admins deleting themselves.
- FR-010: The system shall allow creating, listing, updating, deleting projects.
- FR-011: The system shall enforce project limits by subscription plan.
- FR-012: The system shall allow creating and listing tasks per project.
- FR-013: The system shall allow updating task status.
- FR-014: The system shall allow updating task fields and assignment.
- FR-015: The system shall log audit actions for CREATE/UPDATE/DELETE.

## Non-Functional Requirements
- NFR-001: Security: All passwords must be hashed; JWT expiry 24 hours.
- NFR-002: Performance: API response time < 200ms for 90% of requests.
- NFR-003: Scalability: Support minimum 100 concurrent users.
- NFR-004: Availability: 99% uptime target.
- NFR-005: Usability: Mobile responsive design.
