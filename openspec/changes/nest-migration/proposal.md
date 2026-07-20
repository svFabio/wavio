# Proposal: Express 5 → NestJS Migration

## Intent

Migrate the Wavio backend from Express 5 to NestJS to gain structured dependency injection, module boundaries, native WebSocket gateways, and decorator-driven middleware. The current Express architecture is well-layered but relies on manual wiring, singletons, and 65 ad-hoc request augmentations. NestJS formalizes these patterns, improving testability, onboarding, and scalability as the platform grows.

## Scope

### In Scope
- Backend framework migration: Express 5 → NestJS (78 source files)
- Socket.IO → NestJS `@WebSocketGateway` via `@nestjs/platform-socket.io`
- Express middleware → NestJS Guards, Pipes, Interceptors
- Prisma integration via global `PrismaModule` with DI
- Cron jobs → `@nestjs/schedule` (`@Cron` decorators)
- Rate limiting → `@nestjs/throttler`
- Request augmentation → custom decorators (`@CurrentUser()`, `@TenantId()`)

### Out of Scope
- Frontend (React 19 + Vite) — zero changes
- Database schema (Prisma) — zero changes
- API contract (endpoints, request/response shapes) — zero changes
- External integration logic (Gemini, WhatsApp, Cloudinary) — logic stays, becomes injectable providers
- New features during migration

## Capabilities

### New Capabilities
- `nestjs-foundation`: App scaffold, PrismaModule, ConfigModule, validation pipes
- `nestjs-auth`: AuthModule with JWT guards, custom request decorators, role guards
- `nestjs-rest-api`: All REST controllers (Citas, Chat, Negocio, Usuarios, Servicios, Clientes, Statistics, Health)
- `nestjs-websocket`: WebSocket Gateway replacing Socket.IO singleton, room management
- `nestjs-webhooks`: Meta webhook handler with raw body HMAC verification
- `nestjs-scheduling`: Cron jobs via `@nestjs/schedule`

### Modified Capabilities
None — no existing specs to modify.

## Approach

**Phased migration, 4 phases, ~4 weeks single developer.**

| Phase | Scope | Duration |
|---|---|---|
| 1 — Foundation | NestJS scaffold, PrismaModule, AuthModule, HealthModule | 1 week |
| 2 — Core CRUD | All REST endpoints (Citas, Chat, Negocio, Usuarios, Servicios, Clientes) | 2 weeks |
| 3 — Real-time + Webhooks | WebSocket Gateway, Meta webhooks, chat events | 1 week |
| 4 — Polish | Statistics, cron, rate limiting, test coverage, error handling | 1 week |

**First slice**: Phase 1 — scaffold + PrismaModule + AuthModule + HealthModule.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `ai-appointment-platform-backend/src/` | Rewritten | All 78 source files restructured into NestJS modules |
| `ai-appointment-platform-backend/package.json` | Modified | NestJS deps replace Express deps |
| `ai-appointment-platform-backend/tsconfig.json` | Modified | NestJS-compatible TS config |
| `ai-appointment-platform-backend/prisma/` | Unchanged | Schema and migrations stay identical |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Webhook HMAC raw body lost in NestJS config | HIGH | Test with real Meta payloads; use `rawBody: true` in app config |
| Socket.IO singleton → Gateway migration breaks events | MEDIUM | Use `@nestjs/platform-socket.io`; test all 3 emission points |
| Request augmentation (65 occurrences) breaks auth flow | MEDIUM | Custom decorators + dedicated AuthGuard; test every protected route |
| Vitest → Jest friction | LOW | Keep Vitest if compatible, or migrate test runner separately |

## Rollback Plan

Maintain Express app on a `legacy/express` branch. NestJS app runs on `feat/nestjs-migration`. If critical issues arise post-deploy, point infrastructure back to Express branch. No data migration needed — same Prisma schema, same database.

## Dependencies

- `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`, `@nestjs/platform-socket.io`
- `@nestjs/config`, `@nestjs/jwt`, `@nestjs/passport`, `@nestjs/throttler`, `@nestjs/schedule`
- `@nestjs/swagger` (optional, for future API docs)

## Success Criteria

- [ ] All existing API endpoints return identical responses (contract test)
- [ ] WebSocket events fire correctly (appointment updates, chat messages)
- [ ] Meta webhook HMAC verification passes with real payloads
- [ ] Auth flow works: JWT validation, role guards, tenant scoping
- [ ] All 15 repositories function unchanged via PrismaModule DI
- [ ] Health endpoint returns 200 with database connectivity check
- [ ] No frontend changes required — API contract preserved
- [ ] Test coverage ≥ current baseline
