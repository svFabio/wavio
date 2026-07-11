# Architecture Decision Records

Each ADR captures one decision: the context, the options considered, the choice made, and why.
Once recorded, an ADR is immutable. If a decision changes, a new ADR supersedes the old one.

---

## ADR-001 — Backend architecture: Layered Clean

**Date**: 2026-07-11
**Status**: Accepted

**Context**: The backend had no defined architecture. Controllers imported Prisma directly, services mixed HTTP concerns with business logic, and cron jobs were bootstrapped inline in `server.ts`.

**Options considered**:
- Pure Hexagonal (ports & adapters): correct destination but high migration cost from current state.
- Microservices: operationally complex for a small team; no clear bounded context boundaries yet.
- Layered Clean Architecture: explicit layer separation with enforced communication direction.

**Decision**: Layered Clean Architecture with 4 explicit layers (routes → controllers → services → repositories) and a domain layer with zero external dependencies.

**Consequences**:
- Prisma is isolated to `repositories/`. Any ORM swap only touches that layer.
- Business logic is unit-testable without HTTP or database setup.
- Onboarding cost is low: the folder structure tells the full story.

---

## ADR-002 — Frontend architecture: Feature-based + Container/Presentational

**Date**: 2026-07-11
**Status**: Accepted

**Context**: Pages were monolithic (Calendario.tsx at 34KB, Chat.tsx at 16KB). State management used three different patterns with no rule. Components mixed data fetching with rendering.

**Options considered**:
- Atomic design: good for design systems, not well suited for domain-driven feature organization.
- Redux Toolkit: overkill for server-state-dominant app; adds boilerplate.
- Feature slices + React Query + Container/Presentational split.

**Decision**: Feature-based organization with Container/Presentational pattern enforced at the component level. React Query as the single solution for server data.

**Consequences**:
- Each feature is independently navigable.
- Presentational components are trivially testable and reusable.
- React Query eliminates the useState+useEffect anti-pattern for remote data.

---

## ADR-003 — Auth token storage: localStorage via centralized lib/auth.ts

**Date**: 2026-07-11
**Status**: Accepted

**Context**: JWT was read directly from `localStorage` in 6+ components. No central point of control.

**Options considered**:
- HttpOnly cookies: eliminates XSS token theft but requires CSRF handling and backend coordination.
- In-memory storage: most secure, but token lost on page refresh requiring silent refresh flow.
- localStorage via centralized module: current XSS exposure is unchanged, but access is centralized.

**Decision**: Keep localStorage as storage mechanism but centralize ALL reads and writes in `lib/auth.ts`. No component or service imports from localStorage directly for auth.

**Tradeoff accepted**: XSS risk exists (same as before). Mitigation: CSP headers on backend, no inline scripts, Helmet.js already in place.

**Future**: If a silent refresh flow is implemented, only `lib/auth.ts` changes. No component changes needed.

---

## ADR-004 — Validation: Zod on both layers

**Date**: 2026-07-11
**Status**: Accepted

**Context**: Backend had no systematic request validation. Frontend had ad-hoc form checks.

**Decision**: Zod as the validation library on both frontend and backend. Schemas live in `domain/` on the backend and in `features/<domain>/` on the frontend.

**Consequences**:
- Types are inferred from schemas — no type/schema duplication.
- Validation errors are consistent and typed.
- Shared types could be extracted to a monorepo package in the future.

---

## ADR-005 — Logging: Pino on backend, no console.log in production

**Date**: 2026-07-11
**Status**: Accepted

**Context**: Pino was installed but unused. Console.log calls were scattered through the codebase.

**Decision**: All structured logging uses Pino. `console.log` is allowed only in development scripts and bootstrap messages. ESLint rule `no-console` set to `warn` for src/, `error` for production builds.
