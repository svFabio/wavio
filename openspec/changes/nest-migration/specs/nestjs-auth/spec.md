# nestjs-auth Specification

## Purpose

Authentication and authorization module providing JWT guards, Google OAuth, email/password auth, custom request decorators, and role-based access control. Replaces Express middleware-based auth with NestJS Guards and decorators.

## Phase 1 Requirements

### Requirement: JwtAuthGuard

The system SHALL provide a `JwtAuthGuard` (extending `AuthGuard('jwt')`) that validates the `Authorization: Bearer <token>` header. On success, it SHALL attach the decoded user to the request. On failure, it SHALL throw 401. The guard SHALL be usable as `@UseGuards(JwtAuthGuard)` on controllers or methods.

#### Scenario: Valid JWT attaches user

- GIVEN a request with a valid Bearer token
- WHEN JwtAuthGuard processes the request
- THEN `request.user` contains `{ id, email, negocioId, role }`
- AND the request proceeds to the controller

#### Scenario: Missing token rejects

- GIVEN a request without an Authorization header
- WHEN JwtAuthGuard processes the request
- THEN it throws 401 with `{ statusCode: 401, message: "Unauthorized" }`

#### Scenario: Expired token rejects

- GIVEN a request with an expired Bearer token
- WHEN JwtAuthGuard processes the request
- THEN it throws 401 with `{ statusCode: 401, message: "Unauthorized" }`

### Requirement: Custom Request Decorators

The system SHALL provide `@CurrentUser()` parameter decorator that extracts the authenticated user from `request.user`. It SHALL also provide `@TenantId()` that extracts `request.user.negocioId`. These replace the 65 `req.usuario` / `req.negocioId` augmentations.

#### Scenario: Controller receives user via decorator

- GIVEN a controller method with `@CurrentUser() user` parameter
- WHEN a request with a valid JWT arrives
- THEN `user` is the decoded JWT payload

#### Scenario: Controller receives tenant ID via decorator

- GIVEN a controller method with `@TenantId() negocioId` parameter
- WHEN a request with a valid JWT arrives
- THEN `negocioId` equals `user.negocioId` from the token

### Requirement: RolesGuard

The system SHALL provide a `RolesGuard` that checks user roles against required roles set via a `@Roles(...)` custom decorator. Unprivileged users SHALL receive 403.

#### Scenario: Authorized role passes

- GIVEN a controller method decorated with `@Roles('ADMIN')`
- WHEN a request arrives from a user with role `ADMIN`
- THEN the request proceeds to the controller

#### Scenario: Unauthorized role rejected

- GIVEN a controller method decorated with `@Roles('ADMIN')`
- WHEN a request arrives from a user with role `EMPLOYEE`
- THEN it throws 403 with `{ statusCode: 403, message: "Forbidden" }`

### Requirement: Google OAuth Integration

The system SHALL provide a Google OAuth flow via `@nestjs/passport` (`google` strategy). The `/auth/google` endpoint SHALL redirect to Google. The `/auth/google/callback` endpoint SHALL exchange the code for tokens, find-or-create the user, and return a JWT. Behavior MUST match the current Express Google OAuth flow exactly.

#### Scenario: New user via Google

- GIVEN a Google user not yet in the database
- WHEN they complete the OAuth callback
- THEN a new user and negocio are created
- AND a JWT is returned

#### Scenario: Existing user via Google

- GIVEN a Google user already in the database
- WHEN they complete the OAuth callback
- THEN no duplicate is created
- AND a JWT is returned

### Requirement: Email/Password Auth

The system SHALL provide `/auth/register` and `/auth/login` endpoints. Registration SHALL hash the password with bcrypt and return a JWT. Login SHALL verify credentials and return a JWT. Behavior MUST match current Express auth flow.

#### Scenario: Successful registration

- GIVEN valid email and password
- WHEN POST /auth/register is called
- THEN a user is created with hashed password
- AND a JWT is returned

#### Scenario: Duplicate email rejected

- GIVEN an email already registered
- WHEN POST /auth/register is called with that email
- THEN it returns 409 Conflict

#### Scenario: Successful login

- GIVEN correct email and password
- WHEN POST /auth/login is called
- AND a JWT is returned

#### Scenario: Wrong password rejected

- GIVEN an incorrect password
- WHEN POST /auth/login is called
- THEN it returns 401 Unauthorized

## What Changes vs What Stays

| Changes | Stays |
|---------|-------|
| `middleware/auth.ts` → `JwtAuthGuard` + `@CurrentUser()` decorator | Password hashing logic (bcrypt) |
| `middleware/roleCheck.ts` → `RolesGuard` + `@Roles()` decorator | JWT signing/verification logic (same secret, same expiry) |
| `req.usuario` / `req.negocioId` augmentation → decorators | Google OAuth strategy logic |
| Manual passport init → `@nestjs/passport` ConfigurableStrategyModule | User/negocio creation logic in service |

## Risk Areas

| Risk | Mitigation |
|------|------------|
| 65 `req.usuario`/`req.negocioId` sites break during migration | Phase 1: only guard AuthModule routes; Phase 2: migrate per-module with grep verification |
| Google OAuth callback URL changes | Ensure callback route matches exactly; test with real Google flow |
| JWT secret extraction | Same env var, same ConfigModule token — no change in secret handling |
