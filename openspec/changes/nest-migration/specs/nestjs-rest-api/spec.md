# nestjs-rest-api Specification

## Purpose

All REST API controllers and their supporting services/repositories, migrated from Express route+controller pairs to NestJS module controllers. Includes pagination, tenant scoping, and Zod validation. API contract (endpoints, request/response shapes) MUST remain identical.

## Phase 2 Requirements

### Requirement: CitasModule

The system SHALL provide a `CitasModule` with `CitasController` exposing all current appointment endpoints. The controller SHALL use `@UseGuards(JwtAuthGuard)` on all routes. The module SHALL include `CitasService` (business logic), `AvailabilityService` (slot computation), and `CitasRepository` (Prisma access).

#### Scenario: List appointments with tenant scoping

- GIVEN an authenticated user with `negocioId: 42`
- WHEN GET /api/citas is called
- THEN only appointments for negocio 42 are returned
- AND the response shape matches the current Express endpoint exactly

#### Scenario: Create appointment with validation

- GIVEN a valid appointment body (Zod schema)
- WHEN POST /api/citas is called
- THEN the appointment is created
- AND the response includes the new appointment with generated ID

#### Scenario: Invalid appointment body rejected

- GIVEN a body missing required fields
- WHEN POST /api/citas is called
- THEN the ZodValidationPipe returns 400 with structured error

### Requirement: ServiciosModule

The system SHALL provide a `ServiciosModule` with controllers for services and schedules (`HorariosController`). All CRUD operations for services and their time slots SHALL be preserved with identical request/response shapes.

#### Scenario: Create service with horarios

- GIVEN a valid service body with nested horarios
- WHEN POST /api/servicios is called
- THEN the service and its schedules are created
- AND the response matches current shape

### Requirement: ClientesModule

The system SHALL provide a `ClientesModule` with `ClientesController` for client CRUD. Tenant scoping MUST be enforced — clients belong to a negocio.

#### Scenario: List clients scoped to tenant

- GIVEN authenticated user with `negocioId: 42`
- WHEN GET /api/clientes is called
- THEN only clients for negocio 42 are returned

### Requirement: UsuariosModule

The system SHALL provide a `UsuariosModule` with `UsuariosController` for user CRUD. Admin-only routes SHALL be protected with `@Roles('ADMIN')`.

#### Scenario: Admin creates user

- GIVEN authenticated ADMIN user
- WHEN POST /api/usuarios is called
- THEN the user is created

#### Scenario: Non-admin cannot create user

- GIVEN authenticated EMPLOYEE user
- WHEN POST /api/usuarios is called
- THEN it returns 403

### Requirement: NegocioModule

The system SHALL provide a `NegocioModule` with controllers for business configuration, WhatsApp credentials, and general settings. All sub-routes SHALL preserve the current URL structure.

#### Scenario: Update business configuration

- GIVEN an authenticated admin
- WHEN PUT /api/negocio/configuracion is called with valid body
- THEN the configuration is updated
- AND the response matches current shape

### Requirement: PaginationInterceptor

The system SHALL provide a `PaginationInterceptor` that extracts `page`, `limit`, and `search` query parameters and injects a `PaginationDto` into the request. This replaces the current Express pagination middleware. Default page size SHALL be 20, max 100.

#### Scenario: Paginated list

- GIVEN 50 items exist for a tenant
- WHEN GET /api/citas?page=2&limit=20 is called
- THEN items 21-40 are returned
- AND response includes `{ data: [...], pagination: { page: 2, limit: 20, total: 50, totalPages: 3 } }`

#### Scenario: Default pagination

- GIVEN items exist for a tenant
- WHEN GET /api/citas is called without pagination params
- THEN the first 20 items are returned

### Requirement: TenantGuard

The system SHALL provide a `TenantGuard` that extracts `negocioId` from the authenticated user and attaches it to the request context. Controllers SHALL NOT need to manually extract the tenant ID from the JWT — the guard handles it.

#### Scenario: Guard attaches tenant context

- GIVEN an authenticated user with `negocioId: 42`
- WHEN a guarded route is accessed
- THEN `TenantContext.negocioId` is `42`
- AND the service receives the tenant ID without manual extraction

### Requirement: API Contract Preservation

Every endpoint SHALL return identical HTTP status codes, response bodies, and headers as the current Express app. The migration MUST NOT change the frontend-visible API contract. Response shapes SHALL be validated against current test fixtures.

#### Scenario: Contract match for any endpoint

- GIVEN the current Express app returns `{ data: [...], pagination: {...} }` for GET /api/citas
- WHEN the NestJS app serves the same request
- THEN the response body, status code, and content-type are identical

## What Changes vs What Stays

| Changes | Stays |
|---------|-------|
| Route files → deleted | All 15 repository files (zero logic changes) |
| Express controllers → NestJS `@Controller` classes | Service business logic (wrapped in `@Injectable`) |
| Manual middleware → `@UseGuards`, `@UseInterceptors` | Zod schemas for validation |
| `req.query` manual parsing → PaginationInterceptor | API endpoint URLs and response shapes |
| `req.usuario` / `req.negocioId` → `@CurrentUser()` / `@TenantId()` | Date parsing logic |

## Risk Areas

| Risk | Mitigation |
|------|------------|
| Response shape drift during migration | Run contract tests: same requests → same JSON responses |
| PaginationInterceptor edge cases (negative page, huge limit) | Validate: page >= 1, limit clamped to [1, 100] |
| TenantGuard bypass on public routes | Guard applied per-controller; public routes explicitly excluded |
| 78 files to migrate — scope creep | Strict phase boundaries; no logic changes, only framework wrapping |
