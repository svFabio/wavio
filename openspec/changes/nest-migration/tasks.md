# Tasks: Express 5 → NestJS Migration — Phase 4 (Polish)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 350–450 (8 new files + 3 modified) |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (StatisticsModule) → PR 2 (SchedulingModule) → PR 3 (Throttler + Swagger) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | StatisticsModule: repo + service + controller + tests | PR 1 | Unit: `StatisticsService.getOverview(42)` calls repo methods with correct date ranges. Integration: `GET /api/v1/statistics/overview` with valid JWT+tenant → 200 + correct shape | curl `localhost:3001/api/v1/statistics/overview` with Bearer token + `x-negocio-id` header | Delete `src/statistics/`, remove import from `app.module.ts` |
| 2 | SchedulingModule: cron jobs with @nestjs/schedule | PR 2 | Unit: `CleanupService` methods called by cron trigger. Verify `@Cron('*/5 * * * *')` decorator present on cleanup methods | `npm run build` + verify ScheduleModule.forRoot() registered. Manual: trigger cron method directly in test | Delete `src/scheduling/`, remove imports from `app.module.ts` |
| 3 | ThrottlerModule (global) + Swagger + cleanup | PR 3 | Integration: send 101 requests to any endpoint → 429. Send 11 requests to `/api/v1/auth/*` → 429. Swagger: `GET /api/docs` returns OpenAPI JSON | `curl localhost:3001/api/docs-json` returns spec. `for i in $(seq 1 101); do curl -s -o /dev/null -w "%{http_code}" localhost:3001/api/v1/health; done` — last should be 429 | Remove ThrottlerModule from app.module.ts imports, remove Swagger setup from main.ts |

---

## Phase 4.1: StatisticsModule (PR 1)

- [ ] T4.1.1 Create `src/statistics/statistics.repository.ts` — `@Injectable()` class wrapping `PrismaService`. Port all 7 methods from Express `repositories/statistics.repository.ts`: `countCitasMes`, `getCitasConfirmadasMonto`, `getTopClientes`, `getHorariosPopulares`, `getRatingPromedio`, `getUltimosComentarios`, `countCitasPorOrigen`, `getCitasIngresos`. Replace `import { prisma }` with `constructor(private readonly prisma: PrismaService)`. Keep all Prisma queries identical. **Files:** `src/statistics/statistics.repository.ts`. **~120 lines.**

- [ ] T4.1.2 Create `src/statistics/statistics.service.ts` — `@Injectable()` class. Constructor-inject `StatisticsRepository`. Port `getOverview(negocioId)` and `getRevenue(negocioId, months)` from Express `services/statistics.service.ts`. Same business logic: date range calculation, `Promise.all` for overview queries, revenue month validation. **Files:** `src/statistics/statistics.service.ts`. **~80 lines.**

- [ ] T4.1.3 Create `src/statistics/dto/statistics.dto.ts` — Zod schema for `revenueQuerySchema` (months: number, 1–120). **Files:** `src/statistics/dto/statistics.dto.ts`. **~10 lines.**

- [ ] T4.1.4 Create `src/statistics/statistics.controller.ts` — `@Controller('api/v1/statistics')`. `@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)` at class level. `@Roles('ADMIN')`. Routes: `GET /overview` → `service.getOverview(@TenantId())`, `GET /revenue` → `service.getRevenue(@TenantId(), @Query('months'))` with `ZodValidationPipe(revenueQuerySchema)`. **Files:** `src/statistics/statistics.controller.ts`. **~35 lines.**

- [ ] T4.1.5 Create `src/statistics/statistics.module.ts` — `@Module({ imports: [PrismaModule], controllers: [StatisticsController], providers: [StatisticsService, StatisticsRepository] })`. **Files:** `src/statistics/statistics.module.ts`. **~12 lines.**

- [ ] T4.1.6 Update `src/app.module.ts` — add `StatisticsModule` to imports array. **Files:** `src/app.module.ts`. **~1 line change.**

- [ ] T4.1.7 Unit test `src/statistics/statistics.service.spec.ts` — mock `StatisticsRepository`, verify `getOverview(42)` calls all 8 repo methods with correct date ranges, verify `getRevenue(42, 6)` calls `getCitasIngresos` with correct startDate. Verify `getRevenue(42, 0)` throws `ValidationError`. **~60 lines.**

- [ ] T4.1.8 Verify: `npm run build` compiles. `GET /api/v1/statistics/overview` with JWT + `x-negocio-id` → 200 + overview shape. Without JWT → 401. Without ADMIN role → 403.

## Phase 4.2: SchedulingModule (PR 2)

- [ ] T4.2.1 Create `src/scheduling/cleanup.cron.ts` — `@Injectable()` class. Constructor-inject `SesionChatRepository`, `CitasRepository`. Port 2 cron jobs from Express `services/cleanup.service.ts`: `@Cron('*/5 * * * *') cleanExpiredSessions()` — deletes sessions older than 30 min via `sesionChatRepository.deleteInactiveSessions()`. `@Cron('*/5 * * * *') cancelExpiredInProgressCitas()` — cancels EN_PROCESO citas older than 30 min via `citasRepository.cancelExpiredInProgress()`. Both methods: try/catch with pino logging, same error handling as Express version. **Files:** `src/scheduling/cleanup.cron.ts`. **~50 lines.**

- [ ] T4.2.2 Create `src/scheduling/reminder.cron.ts` — `@Injectable()` class. Placeholder for appointment reminders (disabled in Express). Log that reminder system is disabled. Add `@Cron('0 8 * * *')` decorator (8 AM daily) with `enabled: false` option. **Files:** `src/scheduling/reminder.cron.ts`. **~15 lines.**

- [ ] T4.2.3 Create `src/scheduling/survey.cron.ts` — `@Injectable()` class. Placeholder for post-appointment surveys (disabled in Express). Log that survey system is disabled. Add `@Cron('0 9 * * *')` decorator (9 AM daily) with `enabled: false` option. **Files:** `src/scheduling/survey.cron.ts`. **~15 lines.**

- [ ] T4.2.4 Create `src/scheduling/scheduling.module.ts` — `@Module({ imports: [ScheduleModule.forRoot()], providers: [CleanupCron, ReminderCron, SurveyCron] })`. **Files:** `src/scheduling/scheduling.module.ts`. **~15 lines.**

- [ ] T4.2.5 Update `src/app.module.ts` — add `SchedulingModule` to imports array. **Files:** `src/app.module.ts`. **~1 line change.**

- [ ] T4.2.6 Unit test `src/scheduling/cleanup.cron.spec.ts` — verify `cleanExpiredSessions()` calls `sesionChatRepository.deleteInactiveSessions()` with a Date within 30 min of now. Verify `cancelExpiredInProgressCitas()` calls `citasRepository.cancelExpiredInProgress()`. Verify both handle errors gracefully (no throw). **~40 lines.**

- [ ] T4.2.7 Verify: `npm run build` compiles. `ScheduleModule.forRoot()` registered. Cron jobs fire on schedule (test by calling methods directly in unit test). Reminder/survey stubs log disabled message.

## Phase 4.3: ThrottlerModule + Swagger (PR 3)

- [ ] T4.3.1 Update `src/app.module.ts` — add `ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])` to imports. Add `APP_GUARD` provider with `ThrottlerGuard` for global rate limiting. **Files:** `src/app.module.ts`. **~8 line changes.**

- [ ] T4.3.2 Update `src/auth/auth.controller.ts` — add `@UseGuards(ThrottlerGuard)` with `@Throttle({ default: { limit: 10, ttl: 60000 } })` on class level (overrides global 100/60s for all auth routes: login, register, google). **Files:** `src/auth/auth.controller.ts`. **~3 line changes.**

- [ ] T4.3.3 Update `src/webhooks/webhooks.controller.ts` — add `@Throttle({ default: { limit: 100, ttl: 60000 } })` decorator to match spec (webhook endpoint keeps generous limit). Verify webhook routes are NOT under global auth guard but ARE under throttler. **Files:** `src/webhooks/webhooks.controller.ts`. **~2 line changes.**

- [ ] T4.3.4 Update `src/main.ts` — add Swagger setup: `const config = new DocumentBuilder().setTitle('Wavio API').setVersion('1.0').addBearerAuth().build(); const document = SwaggerModule.createDocument(app, config); SwaggerModule.setup('api/docs', app, document);`. Import `DocumentBuilder`, `SwaggerModule` from `@nestjs/swagger`. **Files:** `src/main.ts`. **~10 line changes.**

- [ ] T4.3.5 Update `src/common/guards/jwt-auth.guard.ts` — exclude health and swagger routes from JWT guard. Add `@Public()` decorator or exclude paths in guard logic: `/health`, `/ping`, `/`, `/api/docs`, `/api/docs-json`. **Files:** `src/common/guards/jwt-auth.guard.ts`. **~5 line changes.**

- [ ] T4.3.6 Integration test: send 101 rapid requests to `GET /api/v1/health` → last returns 429. Send 11 rapid requests to `POST /api/v1/auth/google` → last returns 429. Verify `X-RateLimit-*` headers present in 200 responses. **~40 lines.**

- [ ] T4.3.7 Verify: `npm run build` compiles. `GET /api/docs` returns Swagger UI. `GET /api/docs-json` returns OpenAPI spec. Global throttler: 101 requests → 429. Auth throttler: 11 requests → 429. Health endpoint bypasses JWT guard.

## Phase 4: Final Cleanup

- [ ] T4.C1 Remove `node-cron` from `package.json` dependencies (replaced by `@nestjs/schedule`). Verify no remaining `import cron from 'node-cron'` in NestJS source.
- [ ] T4.C2 Remove `express-rate-limit` from `package.json` (replaced by `@nestjs/throttler`). Verify no `rateLimit()` usage in NestJS source.
- [ ] T4.C3 Full build + test: `npm run build && npm run test` passes. All 3 new modules (Statistics, Scheduling, Throttler) register without errors.
