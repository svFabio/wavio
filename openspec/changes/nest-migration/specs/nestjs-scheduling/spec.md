# nestjs-scheduling Specification

## Purpose

Cron-based background jobs and scheduled tasks using `@nestjs/schedule`, rate limiting via `@nestjs/throttler`, statistics queries, and comprehensive test coverage. This is the polish phase — hardening the migration for production.

## Phase 4 Requirements

### Requirement: ScheduleModule

The system SHALL register `@nestjs/schedule` `ScheduleModule.forRoot()` in the app module. Existing cron jobs (cleanup, reminders, surveys) SHALL be rewritten as `@Cron()` decorated methods on injectable services. Cron expressions SHALL match current job schedules exactly.

#### Scenario: Cleanup job runs on schedule

- GIVEN a cleanup job configured with `@Cron('0 2 * * *')` (2 AM daily)
- WHEN the cron trigger fires
- THEN the cleanup service method executes
- AND it performs the same logic as the current Express cron job

#### Scenario: Reminder job runs on schedule

- GIVEN a reminder job configured with `@Cron('*/15 * * * *')` (every 15 min)
- WHEN the cron trigger fires
- THEN pending reminders are sent

### Requirement: ThrottlerModule

The system SHALL register `@nestjs/throttler` `ThrottlerModule.forRoot()` with global throttling. Default: 100 requests per 60 seconds per IP. Auth endpoints SHALL have stricter limits (10 requests per 60 seconds). Rate limit headers (`X-RateLimit-*`) SHALL be included in responses.

#### Scenario: Normal request within limit

- GIVEN a client has made fewer than 100 requests in the last 60 seconds
- WHEN a new request arrives
- THEN it proceeds normally
- AND response includes rate limit headers

#### Scenario: Rate limit exceeded

- GIVEN a client has made 100 requests in the last 60 seconds
- WHEN a new request arrives
- THEN it returns 429 Too Many Requests

#### Scenario: Auth endpoint stricter limit

- GIVEN a client has made 10 login attempts in 60 seconds
- WHEN an 11th login attempt arrives
- THEN it returns 429

### Requirement: StatisticsModule

The system SHALL provide a `StatisticsModule` with `StatisticsController` and `StatisticsService` for read-only aggregation queries. All queries SHALL be SELECT-only (no writes). Endpoints SHALL be protected with `JwtAuthGuard`.

#### Scenario: Get appointment statistics

- GIVEN authenticated user with `negocioId: 42`
- WHEN GET /api/statistics/citas is called
- THEN aggregated appointment data for negocio 42 is returned
- AND the response shape matches the current Express endpoint

### Requirement: Controller Integration Tests

Every controller SHALL have integration tests using `@nestjs/testing` `TestingModule` with `supertest`. Tests SHALL verify: correct HTTP status, response shape, auth enforcement, tenant scoping, and validation. Minimum: one happy path + one error path per endpoint.

#### Scenario: Controller test passes for any endpoint

- GIVEN a TestingModule is configured with the controller, service, and mocked dependencies
- WHEN supertest sends a valid request
- THEN the response matches expected status and body

### Requirement: Service Unit Tests

Every service SHALL have unit tests using `@nestjs/testing` `TestingModule`. Tests SHALL mock repository dependencies via `TestingModule` providers. Tests SHALL cover: business logic branches, error handling, and edge cases.

#### Scenario: Service unit test for any method

- GIVEN a TestingModule with the service and mocked repository
- WHEN the service method is called
- THEN business logic is exercised correctly
- AND repository mock is called with expected arguments

### Requirement: Vitest Compatibility

The system SHOULD retain Vitest as the test runner if compatible with NestJS `TestingModule`. If Vitest is incompatible, the system SHALL migrate to Jest. The choice SHALL be documented in `docs/decisions.md`.

#### Scenario: Tests execute successfully

- GIVEN the NestJS app is configured with TestingModule
- WHEN `vitest run` (or `jest`) is executed
- THEN all tests pass
- AND test coverage meets or exceeds current baseline

## What Changes vs What Stays

| Changes | Stays |
|---------|-------|
| Cron jobs in `config/bootstrap.ts` → `@Cron()` decorated methods | Cron job business logic |
| Manual rate limiting middleware → `@nestjs/throttler` | Statistics query logic |
| Express `app.listen` lifecycle → NestJS module lifecycle | Prisma queries in statistics |
| Vitest → Jest (if needed) | Existing test assertions and fixtures |

## Risk Areas

| Risk | Mitigation |
|------|------------|
| Vitest incompatibility with NestJS TestingModule | Test Vitest early in Phase 1; document decision |
| Cron timing differences between libraries | Verify cron expressions match exactly; run timing tests |
| Rate limiter too aggressive for production traffic | Configure conservative defaults; tune after load testing |
