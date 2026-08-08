# Wavio — Architecture

## Overview

Wavio is an **AI-powered appointment management platform** for service businesses. It lets business owners manage clients, appointments, and communications through WhatsApp Cloud API, with an AI assistant (Google Gemini) handling natural-language scheduling.

Two deployable units:

- **Backend** (`ai-appointment-platform-backend/`) — NestJS + TypeScript + Prisma + Socket.IO
- **Frontend** (`ai-appointment-platform-frontend/`) — React 19 + Vite + TypeScript + TailwindCSS

The guiding principle: **each piece of code has exactly one reason to exist and exactly one place to live.** A developer (or AI agent) reading a filename must be able to predict what it contains and what it is allowed to do.

---

## Backend Architecture

### NestJS Module System

The backend uses **NestJS module architecture** with strict layer separation. Each module is a self-contained unit following the `Controller → Service → Repository → Prisma` dependency chain.

```
┌─────────────────────────────────────────────────────┐
│                  HTTP / WebSocket                    │  ← NestJS controllers, EventsGateway
├─────────────────────────────────────────────────────┤
│                    Controllers                       │  ← Request/response orchestration
├─────────────────────────────────────────────────────┤
│                     Services                         │  ← Business logic (pure TS)
├─────────────────────────────────────────────────────┤
│                   Repositories                       │  ← Data access (Prisma)
├─────────────────────────────────────────────────────┤
│                     Domain                           │  ← Types, entities, errors (no deps)
└─────────────────────────────────────────────────────┘
     Infrastructure: lib/, config/, prisma/
     Cross-cutting: common/ (guards, decorators, pipes, interceptors, filters)
```

### Layer Communication Rules

**Each layer talks ONLY to the layer directly below it.**

- **Controller → Service → Repository → Prisma**
- A controller **never** imports from a repository directly.
- A repository **never** contains business logic.
- A service **never** imports from a controller or guard.
- Guards and decorators access request data via `ExecutionContext`.

### Layer Contracts

#### Controllers

- Decorated with `@Controller()` and route-level guards.
- Receives request data via `@CurrentUser()`, `@TenantId()`, `@Body()`, `@Query()`, etc.
- Calls exactly one service method per action.
- Maps service result to HTTP response.
- **Never** contains business logic — it orchestrates only.
- **Never** imports from `repositories/` or `prisma`.

```typescript
// Example: citas.controller.ts
@Controller("citas")
@UseGuards(JwtAuthGuard, TenantGuard)
export class CitasController {
  constructor(private readonly citasService: CitasService) {}

  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @TenantId() negocioId: number,
    @Body() dto: CreateCitaDto,
  ) {
    return this.citasService.create(dto, negocioId);
  }
}
```

#### Services

- Contains all business rules and domain decisions.
- Calls repositories for data. Never calls Prisma directly.
- May call `lib/` adapters (Gemini, WhatsApp, etc.) via injected dependencies.
- Returns domain types, never raw Prisma model types directly.
- Throws typed `AppError` instances for business violations.

```typescript
// Example: citas.service.ts
async create(data: CreateCitaDto, negocioId: number): Promise<Cita> {
  const conflict = await this.citasRepository.findConflict(data.fecha, data.horario, negocioId);
  if (conflict) throw new ConflictError('Time slot already taken');
  return this.citasRepository.create({ ...data, negocioId });
}
```

#### Repositories

- The **only** files that import `@prisma/client` or use `PrismaService`.
- Wraps Prisma queries in typed methods.
- No business logic — only data shaping and query construction.
- Returns typed domain entities, not raw Prisma output where possible.

```typescript
// Example: citas.repository.ts
@Injectable()
export class CitasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findConflict(fecha: string, horario: string, negocioId: number) {
    return this.prisma.cita.findFirst({ where: { fecha, horario, negocioId } });
  }
}
```

#### Domain

- Zero dependencies on NestJS, Prisma, or any external library.
- Contains: TypeScript types/interfaces, value objects, typed error classes.
- `errors.ts` — `AppError` base class and all domain-specific error subclasses.
- `types.ts` — Core domain entity interfaces (`Cita`, `Cliente`, `Servicio`, `Negocio`, etc.).

```typescript
// domain/errors.ts
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) { ... }
}

export class NotFoundError extends AppError { ... }
export class ConflictError extends AppError { ... }
export class UnauthorizedError extends AppError { ... }
export class ForbiddenError extends AppError { ... }
export class ValidationError extends AppError { ... }
export class WhatsAppError extends AppError { ... }
export class ExternalServiceError extends AppError { ... }
```

---

## Registered Modules

All modules are registered in `app.module.ts`. Here is the complete list:

| Module             | Controllers                                                          | Services                                             | Repositories                                                                                                  | Purpose                                       |
| ------------------ | -------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `AuthModule`       | `AuthController`                                                     | `AuthService`                                        | `AuthRepository`                                                                                              | JWT auth, login, Google OAuth, registration   |
| `UsuariosModule`   | `UsuariosController`, `UsersAliasController`                         | `UsuariosService`                                    | `UsuariosRepository`                                                                                          | User/staff CRUD, role management              |
| `ServiciosModule`  | `ServiciosController`, `HorariosController`                          | `ServiciosService`, `HorariosService`                | `ServiciosRepository`, `HorariosNegocioRepository`, `HorariosEspecialesRepository`, `HorariosStaffRepository` | Services and schedule/hours management        |
| `ClientesModule`   | `ClientesController`                                                 | `ClientesService`                                    | `ClientesRepository`                                                                                          | Client management                             |
| `NegocioModule`    | `NegocioController`, `ConfiguracionController`                       | `NegocioService`, `ConfiguracionService`             | `NegocioRepository`, `ConfiguracionRepository`                                                                | Business settings, WhatsApp config, chat flow |
| `CitasModule`      | `CitasController`                                                    | `CitasService`                                       | `CitasRepository`, `AvailabilityRepository`                                                                   | Appointments CRUD, availability checks        |
| `ChatModule`       | `ChatController`                                                     | `ChatService`                                        | `ChatRepository`, `SesionChatRepository`                                                                      | WhatsApp chat messages, AI engine integration |
| `EventsModule`     | —                                                                    | `EventsService`                                      | —                                                                                                             | WebSocket gateway, real-time broadcasts       |
| `WebhookModule`    | `WhatsAppController`, `WhatsAppStatusController`, `StripeController` | `WebhookService`                                     | —                                                                                                             | External webhooks (WhatsApp, Stripe)          |
| `StatisticsModule` | `StatisticsController`                                               | `StatisticsService`                                  | `StatisticsRepository`                                                                                        | Dashboard stats, analytics                    |
| `SchedulingModule` | —                                                                    | `CleanupService`, `ReminderService`, `SurveyService` | `CleanupRepository`, `AppointmentRepository`                                                                  | Cron jobs: cleanup, reminders, surveys        |
| `WaitlistModule`   | `WaitlistController`                                                 | `WaitlistService`                                    | `WaitlistRepository`                                                                                          | Waitlist management                           |
| `CalendarModule`   | `CalendarController`                                                 | `GoogleCalendarService`                              | `CalendarRepository`                                                                                          | Google Calendar integration                   |
| `PortalModule`     | `PortalController`                                                   | `PortalService`                                      | `PortalRepository`                                                                                            | Public booking portal                         |
| `PushModule`       | `PushController`                                                     | `PushService`                                        | `PushRepository`                                                                                              | Web push notifications                        |
| `HealthModule`     | `HealthController`                                                   | `HealthService`                                      | —                                                                                                             | Health check endpoint                         |

### Infrastructure Modules

| Module            | Purpose                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| `PrismaModule`    | **Global** module providing `PrismaService` to all repositories. Registered once, available everywhere. |
| `AppConfigModule` | Provides validated `env` config via dependency injection token `ENV_CONFIG`.                            |
| `LibModule`       | External service wrappers: `WhatsAppService`, Cloudinary, logger.                                       |

---

## Common Layer (`common/`)

Cross-cutting concerns that apply across all modules:

### Guards

| Guard          | Purpose                                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `JwtAuthGuard` | Extends Passport `AuthGuard('jwt')`. Verifies JWT on protected routes. Attaches decoded user to `request.usuario`.                      |
| `TenantGuard`  | Validates `x-negocio-id` header matches the JWT's `negocioId`. Prevents cross-tenant access. Attaches parsed ID to `request.negocioId`. |
| `RolesGuard`   | Checks `@Roles()` decorator metadata against user's `rol` field. Supports `ADMIN` / `STAFF`.                                            |

### Decorators

| Decorator        | Purpose                                                               |
| ---------------- | --------------------------------------------------------------------- |
| `@CurrentUser()` | Extracts `JwtPayload` from `request.usuario` (set by `JwtAuthGuard`). |
| `@TenantId()`    | Extracts `number` from `request.negocioId` (set by `TenantGuard`).    |
| `@Roles(...)`    | Sets required roles metadata for `RolesGuard`.                        |
| `@Pagination()`  | Extracts `page`, `limit`, `skip` from query params.                   |

### Pipes

| Pipe                | Purpose                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| `ZodValidationPipe` | Validates request body/query against a Zod schema. Throws `400` with field-level errors on failure. |

### Interceptors

| Interceptor             | Purpose                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `PaginationInterceptor` | Wraps response in `{ data: T[], pagination: { page, limit, total, totalPages } }` shape. |

### Filters

| Filter                | Purpose                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AllExceptionsFilter` | Global exception handler. Maps `AppError` → structured error response, `HttpException` → NestJS default, unknown → `500`. Registered globally in `app.module.ts` and `main.ts`. |

### Errors

| Error Class            | HTTP Status  | Code                     |
| ---------------------- | ------------ | ------------------------ |
| `AppError`             | (base class) | —                        |
| `NotFoundError`        | 404          | `{RESOURCE}_NOT_FOUND`   |
| `ValidationError`      | 400          | `VALIDATION_ERROR`       |
| `UnauthorizedError`    | 401          | `UNAUTHORIZED`           |
| `ForbiddenError`       | 403          | `FORBIDDEN`              |
| `ConflictError`        | 409          | `CONFLICT`               |
| `WhatsAppError`        | 502          | `WHATSAPP_ERROR`         |
| `ExternalServiceError` | 502          | `EXTERNAL_SERVICE_ERROR` |

---

## Config Layer (`config/`)

| File               | Purpose                                                                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `env.ts`           | Parses and validates all environment variables with Zod. Exits with error on startup if required vars are missing. Single source of truth for config. |
| `config.module.ts` | `AppConfigModule` provides the validated `env` object via DI token `ENV_CONFIG`.                                                                      |
| `index.ts`         | Re-exports for convenience.                                                                                                                           |

**Usage**: Services inject `ENV_CONFIG` token or import `env` directly from `config/env.ts` (preferred for non-DI contexts).

```typescript
// env.ts validates required vars at startup
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  // ... more vars
});
```

---

## Prisma Layer (`prisma/`)

| File                | Purpose                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `prisma.module.ts`  | **`@Global()` module** — provides `PrismaService` to every module without explicit imports. |
| `prisma.service.ts` | Extends `PrismaClient` with lifecycle hooks (`$on`, `$connect`, `$disconnect`).             |

**Key point**: Because `PrismaModule` is `@Global()`, repositories can inject `PrismaService` without importing `PrismaModule` in their own module. This is the ONLY way Prisma should be accessed.

---

## Lib Layer (`lib/`)

External service wrappers and shared utilities:

| File                  | Purpose                                                                           |
| --------------------- | --------------------------------------------------------------------------------- |
| `whatsapp.service.ts` | `WhatsAppService` — Meta Cloud API client for sending messages, templates, media. |
| `whatsapp.ts`         | Lower-level WhatsApp API helper functions.                                        |
| `cloudinary.ts`       | Cloudinary client wrapper for image/file uploads.                                 |
| `logger.ts`           | `createLogger(name)` factory — Pino-based structured logging.                     |
| `lib.module.ts`       | `LibModule` provides `WhatsAppService` for injection.                             |

---

## WebSocket Layer (`events/`)

| File                | Purpose                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `events.gateway.ts` | `EventsGateway` — NestJS WebSocket gateway using Socket.IO. Authenticates connections via JWT, joins clients to `negocio:{id}` rooms. |
| `events.service.ts` | `EventsService` — typed methods for emitting events to negocio rooms (e.g., `citaCreada`, `chatMensaje`).                             |

**Connection flow**: Client connects with `{ token, negocioId }` → Gateway verifies JWT → joins `negocio:{id}` room → broadcasts go to all connected clients of that business.

---

## Testing

- **Framework**: Vitest (configured in `vitest.config.ts`)
- **Test location**: `*.test.ts` co-located with the file under test
- **Coverage**: V8 provider, text + JSON + HTML reporters
- **Commands**:
  - `pnpm test` — run all tests
  - `pnpm test:watch` — watch mode
  - `pnpm test:coverage` — with coverage
- **Targets**: Services and repositories are the primary test targets. Controllers are tested via integration tests.

---

## Frontend Architecture

### Feature Slice Structure

Each bounded context lives in `src/features/<domain>/`:

```
src/features/calendario/
├── api/
│   ├── citas.api.ts                    ← Raw fetch functions for citas endpoints
│   ├── useCitasQuery.ts                ← React Query hooks for reading
│   ├── useCrearCitaMutation.ts         ← React Query hooks for writing
│   ├── useReprogramarCitaMutation.ts
│   └── useMarcarAsistenciaMutation.ts
├── components/
│   ├── CalendarioView.tsx              ← Presentational: renders calendar UI
│   ├── ModalDetalle.tsx                ← Presentational: appointment detail modal
│   └── ModalNuevaCita.tsx              ← Presentational: new appointment form
├── containers/
│   ├── CalendarioContainer.container.tsx  ← Smart: owns state, composes components
│   └── ModalNuevaCita.container.tsx
├── hooks/
│   ├── useCalendarEvents.ts
│   └── useCalendarHandlers.ts
└── types.ts                            ← Cita, CreateCitaDto, etc.
```

### Component Hierarchy

```
Page (route-level)
  └── Container (logic + state)
        └── Presentational Component (pure UI)
              └── Shared Component (no domain)
```

**Presentational components**: receive all data via props, emit events via callbacks, contain no `useQuery`, no `useEffect` for remote data, no auth reads.

**Containers**: own the `useQuery`/`useMutation` calls, local UI state (`useState`), and pass everything down to presentational components.

**Pages**: route-level components that compose containers and set page layout. No business logic lives here.

### Frontend Features

| Feature         | Purpose                                                                   |
| --------------- | ------------------------------------------------------------------------- |
| `auth`          | Login, Google OAuth, registration                                         |
| `calendario`    | Appointment calendar, create/reprogram/detail modals                      |
| `chat`          | WhatsApp conversation view, message history                               |
| `configuracion` | Business settings, services, schedules, chat flow editor, WhatsApp config |
| `home`          | Dashboard overview, stats, agenda summary                                 |
| `onboarding`    | New business setup flow                                                   |
| `pagos`         | Payment validation, pending payments                                      |
| `portal`        | Public booking portal link generation                                     |
| `statistics`    | Analytics charts, client stats, origin tracking                           |
| `users`         | Staff/user management                                                     |
| `waitlist`      | Waitlist management                                                       |

### Shared vs Feature

```
src/shared/
├── api/           ← Cross-feature API utilities
├── components/    ← Button, Input, Modal, Spinner, ErrorBoundary — no domain
└── hooks/         ← useNotifications, useDebounce, useMediaQuery

src/lib/
├── apiClient.ts   ← Centralized fetch wrapper with auth headers (single source of truth)
├── auth.ts        ← Token read/write — single source of truth for JWT
├── socket.ts      ← Socket.IO client instance
├── push.ts        ← Web push subscription helpers
└── api.ts         ← Additional API utilities
```

A component is `shared` only if it can be extracted to a different project without changes.

---

## Data Flow

### Read (server data)

```
Page → Container → useXxxQuery (React Query) → apiClient → Backend API
                                                              ↓
                                            Controller → Service → Repository → Prisma
```

### Write (mutation)

```
Container → useXxxMutation → apiClient → Backend API
                                            ↓
                                  Controller → Service → Repository → Prisma
                                            ↓
                                  EventsService → Socket.IO broadcast → all connected clients
```

### Auth flow

```
Login form → POST /api/auth/login → JWT issued
                                      ↓
                             lib/auth.ts stores token
                                      ↓
                  apiClient reads token on every request
                                      ↓
                    JwtAuthGuard verifies on backend
                                      ↓
                    TenantGuard validates x-negocio-id
```

---

## Key Decisions

See [`decisions.md`](./decisions.md) for the full ADR log.

| Decision          | Choice                                | Reason                                                                       |
| ----------------- | ------------------------------------- | ---------------------------------------------------------------------------- |
| Backend framework | NestJS                                | Modular architecture, DI, decorators, WebSocket support, Swagger integration |
| ORM               | Prisma                                | Type-safe queries, good migration tooling, global module pattern             |
| Frontend state    | React Query                           | Server cache + local UI state is sufficient                                  |
| Validation        | Zod                                   | End-to-end type inference, consistent on both layers                         |
| Auth              | JWT via Passport strategy             | NestJS-native integration, guard-based authentication                        |
| Multi-tenancy     | `TenantGuard` + `x-negocio-id` header | Prevents cross-tenant access at the guard level                              |
| Real-time         | Socket.IO via NestJS WebSockets       | Already integrated; WhatsApp events need push                                |
| AI                | Google Gemini                         | Already integrated for appointment parsing                                   |
| Styling           | TailwindCSS                           | Already established; consistent utility-first                                |
| Testing           | Vitest                                | Fast, modern, good TypeScript support                                        |

---

## Key Files Reference

| File                                                | Purpose                                                      |
| --------------------------------------------------- | ------------------------------------------------------------ |
| `src/main.ts`                                       | NestJS entry point, Swagger setup, CORS, Helmet, Morgan      |
| `src/app.module.ts`                                 | Root module with all imports, global filter + throttle guard |
| `src/config/env.ts`                                 | Env variable parsing and Zod validation                      |
| `src/domain/errors.ts`                              | Typed domain error classes                                   |
| `src/domain/types.ts`                               | Core domain entity interfaces                                |
| `src/common/guards/jwt-auth.guard.ts`               | JWT authentication guard (Passport)                          |
| `src/common/guards/tenant.guard.ts`                 | Multi-tenant guard                                           |
| `src/common/guards/roles.guard.ts`                  | Role-based access control guard                              |
| `src/common/filters/all-exceptions.filter.ts`       | Global exception handler                                     |
| `src/common/pipes/zod-validation.pipe.ts`           | Zod validation pipe                                          |
| `src/common/interceptors/pagination.interceptor.ts` | Pagination response wrapper                                  |
| `src/prisma/prisma.module.ts`                       | Global Prisma module                                         |
| `src/events/events.gateway.ts`                      | WebSocket gateway with JWT auth                              |
| `src/scheduling/scheduling.module.ts`               | Cron jobs (cleanup, reminders, surveys)                      |
| `frontend/src/lib/auth.ts`                          | Token read/write — single source of truth                    |
| `frontend/src/lib/apiClient.ts`                     | Centralized fetch wrapper                                    |
| `frontend/src/lib/socket.ts`                        | Socket.IO client instance                                    |

---

## Constraints

1. **No direct Prisma imports outside `repositories/`** — enforced by convention, will be enforced by ESLint rule.
2. **No direct `localStorage` access for auth outside `lib/auth.ts`**.
3. **No raw `fetch()` calls in components** — use `apiClient`.
4. **No mixed state patterns** — server data is React Query only.
5. **No business logic in controllers** — they orchestrate, services decide.
6. **No controller imports from `repositories/`** — must go through service layer.
7. **All env vars read from `config/env.ts`** — never `process.env` directly in business code.
