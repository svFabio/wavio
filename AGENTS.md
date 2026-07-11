# Wavio — Agent Contract

This file is the **authoritative source of truth** for every AI agent working on this codebase.
Read this file completely before writing, refactoring, or reviewing any code.
If a decision is not covered here, check `docs/architecture.md` before improvising.

---

## What This Project Is

**Wavio** is an AI-powered appointment management platform for service businesses.
It lets business owners manage clients, appointments, and communications through WhatsApp Cloud API,
with an AI assistant (Google Gemini) handling natural-language scheduling.

Two deployable units:
- `ai-appointment-platform-backend/` — Express 5 + TypeScript + Prisma + Socket.IO API
- `ai-appointment-platform-frontend/` — React 19 + Vite + TypeScript + TailwindCSS SPA

---

## Architecture

> Full detail in [`docs/architecture.md`](./docs/architecture.md). This section is the contract summary.

### Backend — Layered Clean Architecture

```
routes/       ← HTTP boundary only. No logic. Registers middleware + calls controller.
controllers/  ← Orchestration layer. Reads request, calls service, writes response.
services/     ← Business logic. The "what the system does". No Prisma here.
repositories/ ← Data access. The ONLY place Prisma is imported and used.
domain/       ← Entities, value types, domain errors. Zero framework dependencies.
lib/          ← External client wrappers: Gemini, WhatsApp, Cloudinary, Socket.IO.
config/       ← Env parsing, constants.
middleware/   ← Auth, validation, error handling.
```

**Layer communication rule**: each layer talks ONLY to the layer directly below it.
- Controller → Service → Repository → Prisma
- A controller NEVER imports from a repository directly.
- A repository NEVER contains business logic.
- A service NEVER imports from `routes/` or `middleware/`.

### Frontend — Feature-based + Container/Presentational

```
src/
├── features/        ← Domain slices. One folder per bounded context.
│   └── <domain>/
│       ├── api/         ← React Query hooks and fetch functions for this domain.
│       ├── components/  ← Presentational: pure UI, receives props, emits events.
│       ├── containers/  ← Smart: owns state and logic, composes components.
│       └── types.ts     ← Domain types for this feature.
├── shared/          ← Components and hooks with no domain dependency.
│   ├── components/
│   └── hooks/
├── lib/             ← singletons: queryClient, socket instance, auth token helpers.
├── config/          ← Route constants, env vars.
└── pages/           ← Route-level composition only. Renders containers.
```

**Component rule**: a presentational component must not know where its data comes from.
**Container rule**: a container does not render raw HTML — it composes presentational components.
**Page rule**: a page does not contain business logic. It only composes containers and sets layout.

---

## Naming Conventions

### Files

| Context | Convention | Example |
|---------|-----------|---------|
| Backend service | `camelCase.service.ts` | `citas.service.ts` |
| Backend repository | `camelCase.repository.ts` | `citas.repository.ts` |
| Backend controller | `camelCase.controller.ts` | `citas.controller.ts` |
| Backend route | `camelCase.route.ts` | `citas.route.ts` |
| Frontend component | `PascalCase.tsx` | `CitaCard.tsx` |
| Frontend container | `PascalCase.container.tsx` | `CalendarioView.container.tsx` |
| Frontend hook | `useNoun.ts` | `useCitas.ts` |
| Frontend api hook | `useNounQuery/Mutation.ts` | `useCitasQuery.ts` |
| Types file | `types.ts` or `domain.ts` | `citas/types.ts` |

### Identifiers

- Functions and variables: `camelCase`
- Classes and types: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Zod schemas: `NounSchema` (e.g., `CitaSchema`)
- Prisma model references always use the model name as-is

---

## Code Rules

### General

- No hardcoded secrets or API keys. Use `process.env` on the backend, `import.meta.env` on the frontend.
- No `console.log` in production paths. Use `pino` on the backend for structured logging.
- No swallowed errors. Every `catch` block must either re-throw, log, or return a typed error.
- No dead files in root directories (`old_logic_reference.ts`, `update_role.ts`, etc.). Scripts go in `scripts/`.
- Prefer `async/await` over callbacks. No `.then()` chains unless unavoidable.
- All public functions must have explicit TypeScript return types.

### Backend-specific

- All request validation is done with **Zod** in middleware, before reaching the controller.
- JWT verification happens exclusively in `middleware/auth.ts`. No other file checks tokens.
- Prisma is imported ONLY inside `repositories/`. Not in services, not in controllers.
- `socket.io` instance is accessed via `lib/socket.ts` singleton, not via `req.app.get('io')`.
- Environment variables are read exclusively from `config/env.ts`. No direct `process.env` calls outside config.
- Cron jobs and scheduled services are bootstrapped in `config/bootstrap.ts`, not in `server.ts`.
- Domain errors are typed classes extending `AppError` from `domain/errors.ts`.

### Frontend-specific

- Auth token is read and written ONLY through `lib/auth.ts`. No direct `localStorage` access for JWT.
- All API calls use the centralized `lib/apiClient.ts` (fetch wrapper with auth headers). No raw `fetch()` calls in components.
- `axios` is not used. If an axios-based implementation is found, replace it with `apiClient`.
- React Query is the single state-management solution for server data. No mixed `useState+useEffect` patterns for remote data.
- Every route subtree that can fail must be wrapped in an `ErrorBoundary`.
- Socket events are subscribed in `lib/socket.ts` and exposed via hooks. No direct `socket.on` calls in components.

---

## State Management (Frontend)

| Data type | Solution |
|-----------|----------|
| Server data (API responses) | React Query (`@tanstack/react-query`) |
| Auth state | `AuthContext` (backed by `lib/auth.ts`) |
| UI-local state (modals, forms) | `useState` in the container |
| Cross-feature UI state | React Context — create a dedicated context |
| Notifications | `useNotifications` hook (existing, in `shared/hooks/`) |

No Redux, no Zustand unless a measurable performance problem requires it and is documented in `docs/decisions.md`.

---

## Error Handling

### Backend

```typescript
// domain/errors.ts
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code: string
  ) { super(message); }
}

// Usage in service
throw new AppError('Appointment not found', 404, 'CITA_NOT_FOUND');
```

All unhandled errors bubble up to `middleware/errorHandler.ts`, which formats and returns the response.
Never call `res.status().json()` inside a catch block in a controller — throw instead.

### Frontend

```typescript
// Every feature's container wraps its view in an ErrorBoundary
<ErrorBoundary fallback={<ErrorFallback />}>
  <CalendarioView />
</ErrorBoundary>
```

React Query errors are caught at the query level and surfaced via the `isError` flag, not try/catch.

---

## Testing

- Backend unit tests: `*.test.ts` co-located with the file under test.
- Services and repositories are the primary test targets.
- Controllers are tested via integration tests against the actual HTTP layer.
- Frontend: component tests with React Testing Library. Containers are tested, not pages.
- No test should import from Prisma directly — use repository mocks.

---

## Git and Commits

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`
- Commits are **work units**: one logical change per commit. Tests and related docs ship with the code change.
- No "WIP", "fix stuff", or "changes" commit messages.
- No AI attribution in commits.
- Branch naming: `feat/<slug>`, `fix/<slug>`, `refactor/<slug>`

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `docs/architecture.md` | Full architecture rationale and diagrams |
| `docs/decisions.md` | Architecture Decision Records (ADRs) |
| `docs/api.md` | REST API contract and endpoint reference |
| `docs/onboarding.md` | Setup guide for new contributors |
| `backend/src/domain/errors.ts` | Typed domain error classes |
| `backend/src/config/env.ts` | Env variable parsing and validation |
| `backend/src/lib/socket.ts` | Socket.IO singleton |
| `frontend/src/lib/auth.ts` | Token read/write — single source of truth |
| `frontend/src/lib/apiClient.ts` | Centralized fetch wrapper |

---

## Before You Write Any Code

1. Read this file.
2. Read `docs/architecture.md`.
3. Identify which layer your change belongs to.
4. Follow the naming convention for that layer.
5. If your change crosses 2+ layers, check `docs/decisions.md` for precedent.
6. If you are adding a new pattern not covered here, document it in `docs/decisions.md` first.
