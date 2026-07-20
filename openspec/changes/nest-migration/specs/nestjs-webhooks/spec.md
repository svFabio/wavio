# nestjs-webhooks Specification

## Purpose

Meta (WhatsApp) webhook handler with raw body capture for HMAC signature verification. This is the highest-risk module — if raw body is lost in the NestJS migration, all webhook verification fails silently.

## Phase 3 Requirements

### Requirement: WebhookModule

The system SHALL provide a `WebhookModule` with `WebhookController` handling `GET /webhook` (verification) and `POST /webhook` (incoming messages). The module SHALL include `WebhookService` for business logic. The controller MUST be outside the JWT auth guard — webhooks are unauthenticated (verified via HMAC).

#### Scenario: Webhook verification (GET)

- GIVEN Meta sends a GET request with `hub.mode`, `hub.verify_token`, `hub.challenge`
- WHEN the controller processes it
- THEN it returns the challenge if verify token matches
- AND returns 403 if verify token does not match

### Requirement: HMAC Signature Verification

The system SHALL verify the `X-Hub-Signature-256` header on every incoming POST webhook. Verification SHALL use the raw request body (Buffer, not parsed JSON) and the app secret. Verification failure SHALL return 401 and the payload SHALL NOT be processed.

#### Scenario: Valid HMAC signature

- GIVEN a POST webhook with a valid `X-Hub-Signature-256` header
- WHEN the controller processes it
- THEN the signature is verified against `rawBody`
- AND the payload is processed

#### Scenario: Invalid HMAC signature

- GIVEN a POST webhook with an invalid signature
- WHEN the controller processes it
- THEN it returns 401
- AND the payload is NOT processed

#### Scenario: Missing raw body

- GIVEN a POST webhook arrives but `req.rawBody` is undefined
- WHEN the controller processes it
- THEN it returns 500 with a descriptive server-side error
- AND the error is logged (not exposed to client)

### Requirement: Raw Body Capture

The system SHALL preserve the raw request body as a Buffer on `req.rawBody` for all webhook routes. This is configured in `main.ts` via the Express adapter's `json()` middleware with a custom `verify` callback. The `rawBody` option MUST be tested with real Meta webhook payloads before deployment.

#### Scenario: Real Meta payload processed

- GIVEN a real WhatsApp webhook payload from Meta
- WHEN it arrives at POST /webhook
- THEN `req.rawBody` contains the original JSON bytes
- AND HMAC verification succeeds
- AND the parsed body is available as `req.body`

## What Changes vs What Stays

| Changes | Stays |
|---------|-------|
| Express `verify` callback → NestJS `rawBody: true` + global middleware | HMAC verification algorithm (sha256) |
| `webhook.route.ts` → `WebhookController` | Webhook event processing logic in service |
| Manual body parsing → NestJS body parsing with raw body preservation | Meta webhook payload structure |

## Risk Areas

| Risk | Mitigation |
|------|------------|
| **HIGH**: Raw body lost in NestJS Express adapter | Configure `json({ verify: ... })` in `main.ts`; write integration test with real Meta payload |
| HMAC constant-time comparison | Use `crypto.timingSafeEqual` — verify it's used in the current code and preserved |
| Webhook route must bypass JWT guard | Controller explicitly outside auth-guarded routes; test unauthenticated access |
