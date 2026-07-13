# Wavio — Architecture

## Overview

Wavio follows a **Layered Clean Architecture** on the backend and a
**Feature-based Container/Presentational** pattern on the frontend.

The guiding principle is: **each piece of code has exactly one reason to exist and exactly one place to live.**
A developer (or AI agent) reading a filename must be able to predict what it contains and what it is allowed to do.

---

## Backend Architecture

### Layer Map

```
┌────────────────────────────────────────────┐
│               HTTP / WebSocket             │  ← Express routes, Socket.IO events
├────────────────────────────────────────────┤
│                Controllers                 │  ← Request/response orchestration
├────────────────────────────────────────────┤
│                 Services                   │  ← Business logic (pure TS)
├────────────────────────────────────────────┤
│               Repositories                 │  ← Data access (Prisma)
├────────────────────────────────────────────┤
│                  Domain                    │  ← Types, entities, errors (no deps)
└────────────────────────────────────────────┘
         External adapters: lib/
         Cross-cutting: middleware/, config/
```

### Layer Contracts

#### `routes/`
- Registers HTTP method + path.
- Applies middleware (auth, validation).
- Calls exactly one controller method.
- Contains zero business logic.

```typescript
// citas.route.ts
router.post('/', authenticate, validateBody(CreateCitaSchema), citasController.create);
```

#### `controllers/`
- Receives `req`, `res`, `next`.
- Calls one or more service methods.
- Maps service result to HTTP response.
- Never throws directly — uses `next(error)`.
- Never imports from `repositories/` or `prisma`.

```typescript
// citas.controller.ts
async create(req: Request, res: Response, next: NextFunction) {
  try {
    const cita = await citasService.create(req.body, req.user.negocioId);
    res.status(201).json(cita);
  } catch (err) {
    next(err);
  }
}
```

#### `services/`
- Contains all business rules and domain decisions.
- Calls repositories for data. Never calls Prisma directly.
- May call `lib/` adapters (Gemini, WhatsApp, etc.).
- Returns domain types, never Prisma model types directly.
- Throws typed `AppError` instances for business violations.

```typescript
// citas.service.ts
async create(data: CreateCitaDto, negocioId: string): Promise<Cita> {
  const conflict = await citasRepository.findConflict(data.fecha, data.horario, negocioId);
  if (conflict) throw new AppError('Time slot already taken', 409, 'CITA_CONFLICT');
  return citasRepository.create({ ...data, negocioId });
}
```

#### `repositories/`
- The ONLY files that import `@prisma/client`.
- Wraps Prisma queries in typed methods.
- No business logic — only data shaping.
- Returns typed domain entities, not raw Prisma output where possible.

```typescript
// citas.repository.ts
import { prisma } from '../lib/prisma';

async findConflict(fecha: string, horario: string, negocioId: string) {
  return prisma.cita.findFirst({ where: { fecha, horario, negocioId } });
}
```

#### `domain/`
- Zero dependencies on Express, Prisma, or any external library.
- Contains: TypeScript types/interfaces, value objects, typed error classes.
- `errors.ts` — `AppError` base class and all domain-specific error subclasses.

#### `lib/`
- External service wrappers: one file per external system.
- `prisma.ts` — Prisma client singleton.
- `socket.ts` — Socket.IO server singleton (accessed here, not via `req.app`).
- `gemini.ts` — Google Generative AI client.
- `whatsapp.ts` — Meta Graph API client.
- `cloudinary.ts` — Cloudinary client.

#### `middleware/`
- `auth.ts` — JWT verification. Single source of truth for authentication.
- `validate.ts` — Zod schema validation factory.
- `errorHandler.ts` — Global error handler. Maps `AppError` to HTTP responses.

#### `config/`
- `env.ts` — Parses and validates all environment variables with Zod. Throws on startup if required vars are missing.
- `bootstrap.ts` — Initializes cron jobs and scheduled services. Called once from `server.ts`.

---

## Frontend Architecture

### Feature Slice Structure

Each bounded context of the domain lives in `src/features/<domain>/`:

```
src/features/citas/
├── api/
│   ├── useCitasQuery.ts       ← React Query hooks for reading
│   └── useCitasMutation.ts    ← React Query hooks for writing
├── components/
│   ├── CitaCard.tsx            ← Presentational: renders one appointment card
│   └── CitaList.tsx            ← Presentational: renders a list of CitaCards
├── containers/
│   └── CalendarioView.container.tsx  ← Smart: owns state, composes components
└── types.ts                    ← Cita, CreateCitaDto, etc.
```

### Component Hierarchy

```
Page (route)
  └── Container (logic + state)
        └── Presentational Component (pure UI)
              └── Shared Component (no domain)
```

**Presentational components**: receive all data via props, emit events via callbacks, contain no `useQuery`, no `useEffect` for remote data, no auth reads.

**Containers**: own the `useQuery`/`useMutation` calls, local UI state (`useState`), and pass everything down to presentational components.

**Pages**: route-level components that compose containers and set page layout. No business logic lives here.

### Shared vs Feature

```
shared/components/  ← Button, Input, Modal, Spinner, ErrorBoundary — no domain
shared/hooks/       ← useNotifications, useDebounce, useMediaQuery
features/           ← Everything domain-specific
```

A component is `shared` only if it can be extracted to a different project without changes.

---

## Data Flow

### Read (server data)

```
Page → Container → useXxxQuery (React Query) → apiClient → Backend API → Repository → Prisma
```

### Write (mutation)

```
Container → useXxxMutation → apiClient → Backend API → Controller → Service → Repository → Prisma
                                                                   ↓
                                                        Socket.IO broadcast → all connected clients
```

### Auth flow

```
Login form → POST /api/auth/login → JWT issued
                                       ↓
                              lib/auth.ts stores token
                                       ↓
                   apiClient reads token on every request
                                       ↓
                     middleware/auth.ts verifies on backend
```

---

## Key Decisions

See [`decisions.md`](./decisions.md) for the full ADR log.

| Decision | Choice | Reason |
|----------|--------|--------|
| Backend architecture | Layered Clean | Right level of rigor without over-engineering |
| ORM | Prisma | Type-safe queries, good migration tooling |
| Frontend state | React Query | Server cache + local UI state is sufficient |
| Validation | Zod | End-to-end type inference, consistent on both layers |
| Auth | JWT in localStorage via `lib/auth.ts` | SPA constraint; access centralized to one module |
| Real-time | Socket.IO | Already integrated; WhatsApp events need push |
| AI | Google Gemini | Already integrated for appointment parsing |
| Styling | TailwindCSS | Already established; consistent utility-first |

---

## Constraints

1. **No direct Prisma imports outside `repositories/`** — enforced by convention, will be enforced by ESLint rule.
2. **No direct `localStorage` access for auth outside `lib/auth.ts`**.
3. **No raw `fetch()` calls in components** — use `apiClient`.
4. **No mixed state patterns** — server data is React Query only.
5. **No business logic in controllers** — they orchestrate, services decide.
