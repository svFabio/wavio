# nestjs-foundation Specification

## Purpose

NestJS application scaffold providing DI container, Prisma integration, config management, validation, exception handling, and HTTP middleware. This is the base layer all other modules depend on.

## Phase 1 Requirements

### Requirement: Application Bootstrap

The system SHALL bootstrap as a NestJS application using `@nestjs/platform-express`. The `main.ts` file SHALL configure CORS, Helmet, and Morgan in the same order as the current Express app. The app SHALL listen on the same `PORT` env variable.

#### Scenario: App starts successfully

- GIVEN the database is reachable and env vars are valid
- WHEN the NestJS app bootstraps
- THEN it listens on the configured PORT
- AND CORS headers match current Express config
- AND Helmet security headers are applied to every response
- AND Morgan logs requests in the same format as current Express app

#### Scenario: App fails to start on invalid config

- GIVEN a required env var is missing
- WHEN the NestJS app bootstraps
- THEN it throws a descriptive error and exits with code 1
- AND no partial server starts listening

### Requirement: PrismaModule

The system SHALL expose a global `PrismaModule` that provides `PrismaService` (extending `PrismaClient`) via DI. The service SHALL connect on app init and disconnect on app shutdown via `onModuleInit` and `onModuleDestroy` lifecycle hooks. The module MUST NOT be imported per-feature — it SHALL be globally available.

#### Scenario: Service resolves PrismaService via DI

- GIVEN a NestJS service constructor requests `PrismaService`
- WHEN dependency injection resolves
- THEN the service receives a connected PrismaClient instance
- AND all 15 existing repositories function without import path changes to Prisma

#### Scenario: Graceful shutdown

- GIVEN the app is running with active DB connections
- WHEN `SIGTERM` is received
- THEN `PrismaService.onModuleDestroy` disconnects cleanly
- AND no orphaned connections remain

### Requirement: ConfigModule

The system SHALL integrate the existing `config/env.ts` (Zod-based env parsing) into a NestJS `ConfigModule`. Env vars SHALL be validated once at startup using the same Zod schemas. The parsed config SHALL be injectable via DI token `ENV_CONFIG`.

#### Scenario: Env validation passes

- GIVEN all required env vars are set
- WHEN ConfigModule initializes
- THEN it returns the parsed config object matching current `env.ts` output
- AND no other file accesses `process.env` directly

#### Scenario: Env validation fails

- GIVEN `DATABASE_URL` is missing
- WHEN ConfigModule initializes
- THEN it throws a Zod error listing the missing variable
- AND the app does not start

### Requirement: ZodValidationPipe

The system SHALL provide a global `ZodValidationPipe` that validates DTOs using Zod schemas at the controller parameter level. The pipe SHALL throw `400 Bad Request` with a structured error body on validation failure. The system MUST NOT adopt `class-validator` — Zod remains the validation library.

#### Scenario: Valid request passes validation

- GIVEN a controller endpoint expects a Zod-validated body
- WHEN a request arrives with a valid body
- THEN the controller receives the validated and typed data

#### Scenario: Invalid request fails validation

- GIVEN a controller endpoint expects a Zod-validated body
- WHEN a request arrives with an invalid body (missing required field)
- THEN the pipe rejects with HTTP 400
- AND the response body contains `{ statusCode: 400, message: [...], error: "Validation" }`

### Requirement: Global Exception Filter

The system SHALL provide a global `AllExceptionsFilter` that catches all unhandled exceptions and formats HTTP responses. Known `AppError` instances SHALL return their `statusCode` and `code`. Unknown errors SHALL return 500 with `"Internal server error"`. The filter MUST NOT leak stack traces or internal paths to the client.

#### Scenario: Known domain error

- GIVEN a service throws `new AppError("Not found", 404, "CITA_NOT_FOUND")`
- WHEN the exception filter catches it
- THEN the response is `{ statusCode: 404, message: "Not found", code: "CITA_NOT_FOUND" }`

#### Scenario: Unknown error

- GIVEN an unexpected exception is thrown
- WHEN the exception filter catches it
- THEN the response is `{ statusCode: 500, message: "Internal server error", code: "INTERNAL" }`
- AND the stack trace is logged server-side only

### Requirement: Middleware Configuration

The system SHALL configure CORS, Helmet, and Morgan as NestJS middleware in the same order and with the same options as the current Express app. The `rawBody` option MUST be enabled on the underlying Express adapter to support webhook HMAC verification in Phase 3.

#### Scenario: CORS allows configured origins

- GIVEN the frontend origin is in the allowed list
- WHEN a cross-origin request arrives
- THEN the response includes the appropriate `Access-Control-Allow-*` headers

#### Scenario: Raw body preserved for webhooks

- GIVEN a POST request with `Content-Type: application/json`
- WHEN the request reaches a controller
- THEN `req.rawBody` is available as a Buffer (not parsed away)

## What Changes vs What Stays

| Changes | Stays |
|---------|-------|
| `server.ts` → `main.ts` with NestJS bootstrap | All 15 repository files (zero changes) |
| `config/env.ts` wrapped in ConfigModule | `domain/errors.ts` (pure TypeScript) |
| `middleware/errorHandler.ts` → Exception Filter | `domain/types.ts` (pure TypeScript) |
| `middleware/` directory → Guards/Pipes/Interceptors | Prisma schema and migrations |
| Manual middleware registration → Decorators | Business logic in services |

## Risk Areas

| Risk | Mitigation |
|------|------------|
| `rawBody` lost in NestJS Express adapter config | Use `app.use(json({ verify: (req, _res, buf) => { req.rawBody = buf } }))` in `main.ts`; test with real Meta payload early |
| ZodValidationPipe edge cases (nested objects, arrays) | Port existing Zod schemas as-is; add integration tests for complex shapes |
| ConfigModule replaces direct `process.env` access | Grep for `process.env` after Phase 1 — zero occurrences outside config |
