# Architecture Decision Records

Each ADR captures one decision: the context, the options considered, the choice made, and why.
Once recorded, an ADR is immutable. If a decision changes, a new ADR supersedes the old one.

---

## ADR-001 — Backend architecture: Layered Clean

**Date**: 2026-07-11
**Status**: Superseded by ADR-006

**Note**: The layered principles from this ADR remain valid, but the framework and module structure have been replaced by NestJS. See ADR-006 for the current backend architecture.

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

---

## ADR-006 — Migrate backend from Express to NestJS

**Date**: 2026-07-16
**Status**: Accepted

**Context**: The backend started as Express 5 with the layered architecture defined in ADR-001. As the codebase grew, several structural problems emerged:

- Manual dependency injection: services instantiated `new Repository(prisma)` inline, creating tight coupling and making testing painful.
- No module boundaries: routes, services, and repositories were organized by folder but had no enforcement of dependency direction.
- Inconsistent auth, validation, and error handling: guards were ad-hoc middleware, validation was mixed between Zod and manual checks, and error responses varied by endpoint.
- No standardized request lifecycle: interceptors, pipes, and filters were absent — each route handled its own concerns.

**Options considered**:

- Stay on Express with manual DI container (e.g., tsyringe): adds complexity without framework benefits; still no module enforcement.
- Fastify with plugin architecture: faster raw throughput, but similar gaps in DI and module boundaries.
- NestJS: opinionated framework with DI, module system, guards, pipes, interceptors, and filters built in. Strong TypeScript support. Large ecosystem.

**Decision**: Migrate to NestJS with a phased approach over 4 commits on 2026-07-16:

1. **Phase 1** — Scaffold NestJS, PrismaModule, AppConfigModule, AuthModule, HealthModule, decorators (`@CurrentUser`, `@TenantId`, `@Roles`), guards (`JwtAuthGuard`, `TenantGuard`, `RolesGuard`), and `AllExceptionsFilter`.
2. **Phase 2** — Convert CRUD modules: Usuarios, Servicios, Clientes, Negocio, Citas.
3. **Phase 3** — Convert EventsModule (WebSocket/Socket.IO gateway), ChatModule, WebhookModule.
4. **Phase 4** — Convert StatisticsModule, SchedulingModule, add ThrottlerModule, Swagger. Remove all Express legacy code.

**Module structure** (19 modules registered in `app.module.ts`):

```
PrismaModule (@Global)      — database access, injected everywhere
AppConfigModule             — env parsing via config/env.ts
AuthModule                  — JWT auth, Passport strategy
UsuariosModule              — user CRUD
ServiciosModule             — service CRUD
ClientesModule              — client CRUD
NegocioModule               — business settings
CitasModule                 — appointment management
EventsModule                — WebSocket gateway (Socket.IO)
ChatModule                  — AI chat with Gemini
WebhookModule               — WhatsApp Cloud API webhooks
StatisticsModule            — analytics and reporting
SchedulingModule            — automated scheduling logic
WaitlistModule              — waitlist management
CalendarModule              — calendar integration
PortalModule                — client-facing portal
PushModule                  — push notifications
HealthModule                — liveness/readiness probes
```

**Common infrastructure** (`src/common/`):

```
guards/     JwtAuthGuard, TenantGuard, RolesGuard
decorators/ @CurrentUser, @TenantId, @Roles, @Pagination
pipes/      ZodValidationPipe
interceptors/ PaginationInterceptor
filters/    AllExceptionsFilter (registered globally via APP_FILTER)
```

**Consequences**:

### Positive

- **Dependency injection container**: services and repositories are constructed by NestJS, eliminating manual `new` calls and making the dependency graph explicit.
- **Module boundaries**: each module owns its controllers, services, repositories, and DTOs. Cross-module dependencies go through `exports`, not direct imports.
- **Standardized cross-cutting concerns**: auth (`JwtAuthGuard`), validation (`ZodValidationPipe`), error handling (`AllExceptionsFilter`), and pagination (`PaginationInterceptor`) are configured once and applied uniformly.
- **Global PrismaModule**: `PrismaService` is `@Global()`, available to all modules without explicit imports.
- **Better testability**: NestJS `Test.createTestingModule()` provides isolated module containers for unit and integration tests.
- **Swagger integration**: auto-generated API docs from decorators.

### Negative

- **NestJS boilerplate**: simple CRUD endpoints require controller + service + repository + module + DTO files, even when the logic is trivial.
- **Learning curve**: team must understand NestJS-specific concepts (decorators, IoC container, execution context, module system).
- **Migration cost**: the phased migration took a full day of focused work. Some Express middleware needed manual adaptation.

### Risks

- **Over-engineering**: for small modules like WaitlistModule, the NestJS structure adds files without proportional benefit. Acceptable tradeoff for consistency.
- **Express under the hood**: NestJS uses Express (or Fastify) as the HTTP adapter. Debugging may require understanding both frameworks.

---

## ADR-007 — Shared test utilities directory

**Date**: 2026-07-30
**Status**: Accepted

**Context**: Test files across 19+ modules import shared factories, mocks, and test utilities. Co-locating these in each module's `__tests__/` directory would duplicate 300+ lines of factory code and make test data inconsistent across modules.

**Options considered**:

- Co-located `__tests__/` per module: most aligned with co-location principle, but duplicates factory definitions 19 times.
- Inline test data in each test file: maximum duplication, no single source of truth for test data shape.
- Shared `src/__tests__/` directory: centralizes factories, mocks, and test utilities; single import path for all test files.

**Decision**: Use `src/__tests__/` as a shared directory for test utilities (factories, mocks, setup, test-utils). Individual test files (`*.test.ts`) remain co-located with their source module.

**Consequences**:

- One source of truth for test data shapes via factory functions.
- Mock Prisma service is defined once, not per module.
- The `src/__tests__/` directory is NOT part of the module architecture — it only exists at test time and is excluded from production builds.
- Future: if the project grows significantly, consider extracting test utilities to a separate `packages/test-utils/` workspace.

---

## ADR-008 — `UsuarioNegocio.rol` is the source of truth for per-business roles

**Date**: 2026-08-07
**Status**: Accepted

**Context**: The JWT was signed with a flat `negocioId` and `rol` taken from the global `Usuario.rol` and the first membership's business. A user with different roles in different businesses could only ever carry one role in the token, and the active business was always the first membership — never the one the user actually selected. Role checks were therefore business-independent and wrong for multi-business users.

**Options considered**:

- Keep flat claims and sync `Usuario.rol` on business switch: requires a write on every switch and keeps the global column authoritative, leaking one business's role into another.
- Put the full memberships list in the JWT and resolve the active role from the `x-negocio-id` header at request time: no writes on switch, role is always derived from the membership of the requested business.

**Decision**: `UsuarioNegocio.rol` is the single source of truth for a user's role per business. The JWT payload now carries the list of active memberships (`negocios: Array<{ negocioId, rol }>`) and no flat `rol`/`negocioId` claims. `TenantGuard` resolves the active business from the `x-negocio-id` header, rejects businesses not in the memberships (403), and sets the effective role on the request user. `Usuario.rol` remains in the model for compatibility and stays synchronized with the primary membership, but it no longer authorizes and is not signed into the JWT.

**Consequences**:

- Roles are enforced per business: the same user can be OWNER in one business and STAFF in another, and each request is authorized against the role of the requested business.
- The frontend must always send `x-negocio-id`; the backend derives the effective role from that header. Socket connections verify the negocio against `negocios[]` instead of a flat claim.
- `GET /auth/me` now returns `usuario.rol` = role of the active membership and `negocios[].rol` per membership.
- All consumers of `request.usuario` inside a guarded handler see `rol`/`negocioId` already resolved by `TenantGuard` (typed as `TenantUser`).
