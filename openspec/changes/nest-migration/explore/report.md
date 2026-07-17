# Express 5 → NestJS Migration — Exploration Report

## Summary

Wavio backend has 78 source files across 8 directories. The existing layered architecture (routes → controllers → services → repositories → Prisma) maps cleanly to NestJS modules. 23% of files port with zero logic changes.

## File Inventory

| Layer | Count | Migration Impact |
|---|---|---|
| routes/ | 13 | DELETE — replaced by NestJS controllers + decorators |
| controllers/ | 13 | MAJOR — convert to @Controller classes |
| services/ | 18 | MINOR — wrap in @Injectable(), add DI |
| repositories/ | 15 | ZERO — only import path for prisma changes |
| middleware/ | 6 | DELETE — replaced by Guards, Pipes, Interceptors |
| lib/ | 3 | MINOR — wrap in @Injectable() providers |
| config/ | 3 | MINOR — NestJS ConfigModule or keep as-is |
| domain/ | 2 | ZERO — pure TypeScript, no framework dependency |
| tests | 2 | MINOR — Vitest → Jest or keep Vitest |

## NestJS Module Structure

| Module | Controllers | Services | Risk |
|---|---|---|---|
| AuthModule | AuthController | AuthService, AuthRepository | LOW |
| CitasModule | CitasController | CitasService, AvailabilityService | MEDIUM (Socket.IO) |
| ChatModule | ChatController | ChatService, AiService | LOW |
| WebhookModule | WebhookController | WebhookService | HIGH (raw body HMAC) |
| NegocioModule | NegocioController, ConfiguracionController, WhatsAppController | NegocioService, ConfiguracionService, WhatsAppService | LOW |
| UsuariosModule | UsuariosController | UsuariosService | LOW |
| ServiciosModule | ServiciosController, HorariosController | ServiciosService, HorariosService | LOW |
| ClientesModule | ClientesController | ClientesService | LOW |
| StatisticsModule | StatisticsController | StatisticsService | LOW |
| HealthModule | HealthController | HealthService | LOW |
| PrismaModule (global) | — | PrismaService | LOW |
| EventsModule | — | EventsGateway, EventsService | MEDIUM |

## Risk Areas

### HIGH: Webhook HMAC Signature
- Express `verify` callback attaches raw buffer to `req.rawBody`
- NestJS handles raw body differently (`rawBody: true` in app config)
- If lost, ALL Meta webhook signature verification breaks silently
- Mitigation: Test with real Meta webhook payloads before deploying

### MEDIUM: Socket.IO
- Currently: singleton `getSocket()` from `lib/socket.ts`
- NestJS: `@WebSocketGateway` with JWT auth, room management
- Only 3 services emit events — clean migration path

### MEDIUM: Request Augmentation
- 65 occurrences of `req.usuario`, `req.negocioId`, `req.negocioRole`
- NestJS: custom decorators (`@CurrentUser()`, `@TenantId()`) + Guards

## Effort Estimate

| Phase | Scope | Duration |
|---|---|---|
| Phase 1: Foundation | Scaffold, Prisma, Auth, Health | 1 week |
| Phase 2: Core CRUD | All REST endpoints | 2 weeks |
| Phase 3: Real-time + Webhooks | Socket.IO, Meta webhooks, chat | 1 week |
| Phase 4: Polish | Statistics, cron, tests, rate limiting | 1 week |
| **Total** | | **~4 weeks** |

## Files That Stay Identical (18 files)

- All 15 repositories/*.repository.ts
- domain/types.ts, domain/errors.ts
- config/index.ts, services/dateParser.ts, repositories/negocio-select.ts
