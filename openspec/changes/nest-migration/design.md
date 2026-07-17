# Design: Express 5 → NestJS Migration

## Technical Approach

Migrate the Wavio backend from Express 5 to NestJS by wrapping the existing layered architecture (routes → controllers → services → repositories) into NestJS modules with DI. The current code already separates concerns cleanly — services are pure business logic, repositories wrap Prisma, and controllers are thin. NestJS formalizes this with `@Injectable()`, constructor injection, and decorators. The existing Zod validation, Prisma schema, domain types, and service logic stay unchanged. We replace manual wiring (middleware chains, singleton imports, request augmentation) with NestJS Guards, Pipes, custom decorators, and DI providers.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| **HTTP Adapter** | `@nestjs/platform-express` | Fastify (`@nestjs/platform-fastify`) | Default NestJS adapter. Zero migration risk — same Express underneath. Fastify can be a drop-in swap later if perf requires it. |
| **DI Strategy** | Constructor injection + barrel `index.ts` per module | `@Module({ providers })` without barrels | Barrel exports keep imports clean (`import { CitasService } from '../citas'`). Constructor injection matches existing service layer — services already accept dependencies as function args. |
| **Validation** | Keep Zod v4 + custom `ZodValidationPipe` | Switch to `class-validator` | Project already uses Zod v4 throughout. Switching validation libraries doubles risk for zero benefit. ZodValidationPipe wraps `schema.parse()` in a `PipeTransform`. |
| **Request Context** | Custom decorators: `@CurrentUser()`, `@TenantId()`, `@Pagination()` | Request augmentation (`req.usuario`) | Current app has 65 `req.usuario`/`req.negocioId` augmentations via Express `declare global`. Decorators eliminate type-safety holes and are the NestJS-idiomatic pattern. |
| **WebSocket** | `@nestjs/platform-socket.io` + `EventsGateway` | Reuse singleton `lib/socket.ts` | Gateway replaces the manual `initSocket`/`getSocket` singleton. 3 services emit events — clean migration. |
| **Prisma Integration** | Global `PrismaModule` with `PrismaService extends PrismaClient` | Per-module Prisma imports | One instance, lifecycle-managed (`onModuleInit`/`onModuleDestroy`). Global means zero import boilerplate in feature modules. |
| **Cron** | `@nestjs/schedule` with `@Cron()` decorators | Keep `node-cron` | NestJS-native. Lifecycle-managed (auto-start/stop). 3 cron jobs currently — clean conversion. |
| **Rate Limiting** | `@nestjs/throttler` (global + per-route) | Keep `express-rate-limit` | NestJS-native. Global guard covers all routes. Per-route override for auth endpoints (20 req/15min). |
| **Error Handling** | Global `AllExceptionsFilter` extending `BaseExceptionFilter` | Keep `middleware/errorHandler.ts` | Catches all unhandled exceptions. Maps `AppError` instances to their `statusCode`/`code`. Unknown errors → 500. No stack traces to client. |
| **Config** | Wrap existing `config/env.ts` in NestJS `ConfigModule` | Rewrite to `@nestjs/config` `.env` parsing | Existing Zod schema is more robust than `.env` file parsing. NestJS ConfigModule provides DI token `ENV_CONFIG` wrapping the same validated object. |

## Data Flow

```
Request
  │
  ▼
[Global Guards] JwtAuthGuard, TenantGuard, ThrottlerGuard
  │
  ▼
[Global Pipes] ZodValidationPipe (if @UsePipes on controller)
  │
  ▼
[Controller] @Controller('/api/v1/citas')
  │  @CurrentUser() user
  │  @TenantId() negocioId
  │  @Pagination() pagination
  │
  ▼
[Service] @Injectable() CitasService
  │  constructor(
  │    private citasRepo: CitasRepository,
  │    private configuracionRepo: ConfiguracionRepository,
  │    private chatRepo: ChatRepository,
  │    private socketGateway: EventsGateway,
  │  )
  │
  ▼
[Repository] @Injectable() CitasRepository
  │  constructor(private prisma: PrismaService)
  │
  ▼
[Prisma] PrismaService extends PrismaClient (global)
```

## Module Architecture

```
AppModule (root)
├── PrismaModule (global)          — PrismaService
├── ConfigModule                   — ENV_CONFIG token
├── HealthModule                   — HealthController
├── AuthModule                     — AuthController, JwtStrategy, AuthService
├── CitaModule                     — CitaController, CitaService, CitaRepository
├── ChatModule                     — ChatController, ChatService, ChatRepository
├── NegocioModule                  — NegocioController, ConfiguracionController,
│                                    WhatsAppController + services + repos
├── UsuarioModule                  — UsuariosController, UsuariosService
├── ServicioModule                 — ServiciosController, HorariosController,
│                                    ServiciosService, HorariosService
├── ClienteModule                  — ClientesController, ClientesService
├── StatisticsModule               — StatisticsController, StatisticsService
├── WebhookModule                  — WebhookController (raw body HMAC)
├── EventsModule                   — EventsGateway (WebSocket)
├── SchedulingModule               — CleanupCron, ReminderCron (if re-enabled)
└── ThrottlerModule (global)       — Rate limiting
```

### Module Dependency Map

| Module | Imports | Exports |
|--------|---------|---------|
| `PrismaModule` | — | `PrismaService` (global) |
| `ConfigModule` | — | `ENV_CONFIG` |
| `AuthModule` | `PrismaModule`, `ConfigModule` | `AuthService`, `JwtStrategy` |
| `CitaModule` | `PrismaModule`, `ConfigModule`, `EventsModule` | `CitaService` |
| `ChatModule` | `PrismaModule`, `ConfigModule`, `EventsModule` | `ChatService` |
| `NegocioModule` | `PrismaModule`, `ConfigModule` | `NegocioService` |
| `UsuarioModule` | `PrismaModule`, `ConfigModule` | `UsuariosService` |
| `ServicioModule` | `PrismaModule`, `ConfigModule` | `ServiciosService`, `HorariosService` |
| `ClienteModule` | `PrismaModule`, `ConfigModule` | `ClientesService` |
| `StatisticsModule` | `PrismaModule`, `ConfigModule` | `StatisticsService` |
| `WebhookModule` | `PrismaModule`, `ConfigModule`, `ChatModule`, `NegocioModule` | `WebhookService` |
| `EventsModule` | `ConfigModule` | `EventsGateway` |
| `HealthModule` | `PrismaModule` | `HealthService` |
| `SchedulingModule` | `PrismaModule`, `ConfigModule` | — |

## File Changes

### New Files (NestJS scaffold)

| File | Description |
|------|-------------|
| `src/main.ts` | NestJS bootstrap — CORS, Helmet, Morgan, rawBody, Swagger, port |
| `src/app.module.ts` | Root module importing all feature modules |
| `src/prisma/prisma.module.ts` | Global PrismaModule |
| `src/prisma/prisma.service.ts` | PrismaService extends PrismaClient |
| `src/config/config.module.ts` | ConfigModule wrapping existing env.ts |
| `src/config/env.config.ts` | Provider factory for ENV_CONFIG token |
| `src/common/filters/all-exceptions.filter.ts` | Global exception filter for AppError |
| `src/common/pipes/zod-validation.pipe.ts` | ZodValidationPipe wrapping ZodSchema.parse |
| `src/common/decorators/current-user.decorator.ts` | `@CurrentUser()` parameter decorator |
| `src/common/decorators/tenant-id.decorator.ts` | `@TenantId()` parameter decorator |
| `src/common/decorators/roles.decorator.ts` | `@Roles()` metadata decorator |
| `src/common/decorators/pagination.decorator.ts` | `@Pagination()` parameter decorator |
| `src/common/guards/jwt-auth.guard.ts` | JwtAuthGuard using passport-jwt strategy |
| `src/common/guards/roles.guard.ts` | RolesGuard checking @Roles metadata |
| `src/common/guards/tenant.guard.ts` | TenantGuard validating x-negocio-id membership |
| `src/auth/auth.module.ts` | AuthModule |
| `src/auth/auth.controller.ts` | AuthController — login, register, me, avatar, google OAuth |
| `src/auth/auth.service.ts` | AuthService with DI |
| `src/auth/dto/auth.dto.ts` | Zod schemas for login, register, google |
| `src/auth/strategies/jwt.strategy.ts` | Passport JWT strategy |
| `src/auth/strategies/google.strategy.ts` | Passport Google OAuth strategy |
| `src/citas/citas.module.ts` | CitaModule |
| `src/citas/citas.controller.ts` | CitaController with route decorators |
| `src/citas/citas.service.ts` | CitaService with constructor-injected repos |
| `src/citas/dto/citas.dto.ts` | Zod schemas (move from route files) |
| `src/chat/chat.module.ts` | ChatModule |
| `src/chat/chat.controller.ts` | ChatController |
| `src/chat/chat.service.ts` | ChatService |
| `src/chat/dto/chat.dto.ts` | Zod schemas |
| `src/negocio/negocio.module.ts` | NegocioModule (includes ConfiguracionController, WhatsAppController) |
| `src/negocio/negocio.controller.ts` | NegocioController |
| `src/negocio/configuracion.controller.ts` | ConfiguracionController |
| `src/negocio/whatsapp.controller.ts` | WhatsAppController |
| `src/negocio/negocio.service.ts` | NegocioService |
| `src/negocio/configuracion.service.ts` | ConfiguracionService |
| `src/negocio/whatsapp.service.ts` | WhatsAppService |
| `src/negocio/dto/negocio.dto.ts` | Zod schemas |
| `src/usuarios/usuarios.module.ts` | UsuarioModule |
| `src/usuarios/usuarios.controller.ts` | UsuariosController |
| `src/usuarios/usuarios.service.ts` | UsuariosService |
| `src/usuarios/dto/usuarios.dto.ts` | Zod schemas |
| `src/servicios/servicios.module.ts` | ServicioModule |
| `src/servicios/servicios.controller.ts` | ServiciosController |
| `src/servicios/horarios.controller.ts` | HorariosController |
| `src/servicios/servicios.service.ts` | ServiciosService |
| `src/servicios/horarios.service.ts` | HorariosService |
| `src/servicios/dto/servicios.dto.ts` | Zod schemas |
| `src/clientes/clientes.module.ts` | ClienteModule |
| `src/clientes/clientes.controller.ts` | ClientesController |
| `src/clientes/clientes.service.ts` | ClientesService |
| `src/clientes/dto/clientes.dto.ts` | Zod schemas |
| `src/statistics/statistics.module.ts` | StatisticsModule |
| `src/statistics/statistics.controller.ts` | StatisticsController |
| `src/statistics/statistics.service.ts` | StatisticsService |
| `src/webhooks/webhooks.module.ts` | WebhookModule |
| `src/webhooks/webhooks.controller.ts` | WebhookController with raw body HMAC |
| `src/webhooks/webhooks.service.ts` | WebhookService |
| `src/events/events.module.ts` | EventsModule |
| `src/events/events.gateway.ts` | EventsGateway with handleConnection JWT auth + room join |
| `src/events/events.service.ts` | EventsService wrapping gateway emissions |
| `src/health/health.module.ts` | HealthModule |
| `src/health/health.controller.ts` | HealthController |
| `src/health/health.service.ts` | HealthService |
| `src/scheduling/scheduling.module.ts` | SchedulingModule |
| `src/scheduling/cleanup.cron.ts` | CleanupCron with @Cron decorators |

### Modified Files

| File | Change |
|------|--------|
| `package.json` | Add NestJS deps, remove Express-specific deps (express, express-rate-limit, node-cron) |
| `tsconfig.json` | Add `"experimentalDecorators": true`, `"emitDecoratorMetadata": true` |

### Deleted Files (after full migration)

| File | Reason |
|------|--------|
| `src/server.ts` | Replaced by `src/main.ts` |
| `src/routes/*.route.ts` (13 files) | Replaced by NestJS controller decorators |
| `src/controllers/*.controller.ts` (13 files) | Replaced by NestJS controller classes |
| `src/middleware/auth.middleware.ts` | Replaced by JwtAuthGuard + decorators |
| `src/middleware/tenant.middleware.ts` | Replaced by TenantGuard |
| `src/middleware/permissions.middleware.ts` | Replaced by RolesGuard |
| `src/middleware/pagination.ts` | Replaced by @Pagination() decorator |
| `src/middleware/validate.ts` | Replaced by ZodValidationPipe |
| `src/middleware/errorHandler.ts` | Replaced by AllExceptionsFilter |
| `src/lib/socket.ts` | Replaced by EventsGateway |
| `src/config/bootstrap.ts` | Cron jobs move to @Cron() decorators in SchedulingModule |

### Unchanged Files (18 files — zero changes)

| File | Reason |
|------|--------|
| `src/domain/errors.ts` | Pure TypeScript, no framework deps |
| `src/domain/types.ts` | Pure TypeScript, no framework deps |
| `src/config/index.ts` | Constants — no framework deps |
| `src/config/env.ts` | Wrapped by ConfigModule, logic stays |
| `src/repositories/*.repository.ts` (15 files) | Only import path for `prisma` changes to DI |
| `src/services/dateParser.ts` | Pure function, no framework deps |
| `src/repositories/negocio-select.ts` | Prisma select constants, no framework deps |

## Interfaces / Contracts

### Custom Decorators

```typescript
// @CurrentUser() — extracts request.user from ExecutionContext
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    return data ? user?.[data] : user;
  },
);

// @TenantId() — extracts x-negocio-id (validated by TenantGuard)
export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId as number;
  },
);

// @Pagination() — extracts page/limit/skip from query params
export const Pagination = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const query = ctx.switchToHttp().getRequest().query;
    const page = Math.max(1, parseInt(String(query.page)) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit)) || 20));
    return { page, limit, skip: (page - 1) * limit } satisfies PaginationParams;
  },
);
```

### ZodValidationPipe

```typescript
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}
  transform(value: unknown) {
    return this.schema.parse(value);
  }
}
```

### PrismaService

```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}
```

### EventsGateway

```typescript
@WebSocketGateway({ cors: { origin: ... } })
export class EventsGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  handleConnection(socket: Socket) {
    const token = socket.handshake.auth?.token;
    const negocioId = Number(socket.handshake.auth?.negocioId);
    const decoded = verifyJwt(token);
    socket.data.userId = decoded.id;
    socket.data.negocioId = negocioId;
    socket.join(negocioId.toString());
  }

  emitToNegocio(negocioId: number, event: string, data?: unknown) {
    this.server.to(negocioId.toString()).emit(event, data);
  }
}
```

### AllExceptionsFilter

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception instanceof AppError) {
      return response.status(exception.statusCode).json({
        statusCode: exception.statusCode,
        message: exception.message,
        code: exception.code,
      });
    }

    // Unknown — log + 500
    logger.error({ exception }, 'Unhandled exception');
    return response.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      code: 'INTERNAL',
    });
  }
}
```

## Migration Strategy

### Parallel Running (Phased)

```
Phase 1: NestJS on :3001, Express stays on :3000
  └── Both share same Prisma DB
  └── nginx routes /api/v1/* to Express (:3000)
  └── Test NestJS on :3001 directly

Phase 2-3: Route-by-route cutover
  └── Move one controller at a time to NestJS
  └── Test migrated routes against :3001
  └── When all routes migrated, switch nginx to :3001

Phase 4: Remove Express
  └── Delete server.ts, routes/, controllers/, middleware/
  └── NestJS becomes sole backend
```

### Route Migration Order (lowest risk first)

| Order | Module | Routes | Risk |
|-------|--------|--------|------|
| 1 | HealthModule | `GET /health`, `GET /`, `GET /ping` | LOW — no auth |
| 2 | AuthModule | `/api/v1/auth/*` | LOW — no tenant |
| 3 | UsuariosModule | `/api/v1/users/*` | LOW — admin only |
| 4 | NegocioModule | `/api/v1/negocio/*`, `/api/v1/configuracion/*`, `/api/v1/whatsapp/*` | LOW |
| 5 | ServicioModule | `/api/v1/servicios/*`, `/api/v1/horarios/*` | LOW |
| 6 | ClienteModule | `/api/v1/clientes/*` | LOW |
| 7 | StatisticsModule | `/api/v1/statistics/*` | LOW |
| 8 | CitaModule | `/api/v1/citas/*` | MEDIUM — Socket.IO emissions |
| 9 | ChatModule | `/api/v1/chat/*` | LOW |
| 10 | WebhookModule | `/api/webhooks/whatsapp/*` | HIGH — raw body HMAC |
| 11 | EventsModule | WebSocket | MEDIUM — replaces singleton |
| 12 | SchedulingModule | Cron jobs | LOW — disabled in prod anyway |

### Webhook Raw Body Handling

```typescript
// main.ts — preserve raw body for HMAC verification
const app = await NestFactory.create(AppModule, {
  rawBody: true,
});
```

This attaches `req.rawBody` as `Buffer` on every request. The webhook controller reads it for HMAC verification — identical to current Express `verify` callback behavior.

### Shared Database During Transition

- Both Express and NestJS use the same `DATABASE_URL`
- Both use the same Prisma schema (unchanged)
- No data migration needed
- Prisma schema is the contract — both apps respect it

### Cutover Checklist

1. All routes return identical responses (contract test)
2. WebSocket events fire correctly (manual test + log verification)
3. Webhook HMAC passes with real Meta payloads
4. Auth flow: JWT + role guards + tenant scoping all work
5. Rate limiting: global 500/15min, auth 20/15min
6. Cron jobs fire on schedule (or are disabled as in current state)
7. Health endpoint returns 200 with DB connectivity check
8. No frontend changes required

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Services (business logic) | Inject mock repositories via DI. Same logic, DI-wired instead of direct imports. |
| Unit | ZodValidationPipe | Test with valid/invalid Zod schemas, verify 400 response shape |
| Unit | Custom decorators | Test param decorator extraction from mock ExecutionContext |
| Unit | Guards | Test JwtAuthGuard, TenantGuard, RolesGuard with mock requests |
| Integration | Controllers | Supertest against NestJS HTTP app. Verify route → guard → controller → service chain. |
| Integration | Webhook HMAC | Feed real Meta payload with signature header, verify acceptance/rejection |
| E2E | Full API | Contract test: every endpoint returns same shape as Express version |
| E2E | WebSocket | Connect with valid token, verify room join + event emission |
| E2E | Auth flow | Google OAuth + email/password → JWT → protected route access |

## Threat Matrix

| Boundary | Applicability | Design Response | RED Tests |
|----------|--------------|----------------|-----------|
| Documentation-like paths | N/A — no routing to executable files | — | — |
| Git repository selection | N/A — no git operations in app code | — | — |
| Commit state | N/A — no VCS integration | — | — |
| Push state | N/A — no VCS integration | — | — |
| PR commands | N/A — no PR automation | — | — |

## Open Questions

- [ ] **Vitest vs Jest**: Current project uses Vitest. NestJS default is Jest. Keep Vitest if it works with NestJS `@nestjs/testing`, or migrate test runner? (Recommendation: keep Vitest — it's framework-agnostic.)
- [ ] **`strict: false` in tsconfig**: NestJS works with `strict: false` but benefits from `strict: true`. Should we enable strict mode during migration or keep current setting? (Recommendation: keep `strict: false` for migration, enable later as separate PR.)
- [ ] **Swagger/OpenAPI**: Proposal lists `@nestjs/swagger` as optional. Should Phase 4 include Swagger generation from decorators? (Recommendation: defer — add only if API documentation is explicitly requested.)
