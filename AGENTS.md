# Wavio — Agent Contract

This file is the **authoritative source of truth** for every AI agent working on this codebase.
Read this file completely before writing, refactoring, or reviewing any code.
If a decision is not covered here, check `docs/architecture.md` before improvising.

---

## What This Project Is

**Wavio** is an AI-powered appointment management platform for service businesses.
It lets business owners manage clients, appointments, and communications through WhatsApp Cloud API,
with an AI assistant (Google Gemini) handling natural-language scheduling.

Two deployable units:

- `ai-appointment-platform-backend/` — Express 5 + TypeScript + Prisma + Socket.IO API
- `ai-appointment-platform-frontend/` — React 19 + Vite + TypeScript + TailwindCSS SPA

---

## Security — Hard Rules (GGA enforces these on every commit)

These rules are not guidelines. GGA runs this file against every staged diff before a commit is allowed.
A violation in any of these rules MUST cause a review failure.

### Secrets and Credentials

**BLOCK the commit if any staged file contains:**

- An API key, token, or secret assigned to a variable or constant:
  ```typescript
  // VIOLATION — any of these patterns
  const API_KEY = "sk-abc123...";
  const token = "eyJhbGci...";
  const secret = "whsec_...";
  GEMINI_API_KEY = "AIzaSy...";
  META_WHATSAPP_TOKEN = "EAABs...";
  ```
- A connection string with credentials embedded:
  ```typescript
  // VIOLATION
  const db = "postgresql://user:password@host/db";
  DATABASE_URL = "postgres://...";
  ```
- A JWT secret or signing key hardcoded:
  ```typescript
  // VIOLATION
  jwt.sign(payload, "my-super-secret");
  jwt.verify(token, "hardcoded-secret");
  ```
- A private key or certificate content inline (PEM blocks, `-----BEGIN ...-----`).
- Any Google, AWS, Stripe, Cloudinary, or Meta credential pattern hardcoded.

**The correct pattern — always read from environment:**

```typescript
// Backend: read from config/env.ts only
import { env } from "../config/env";
jwt.sign(payload, env.JWT_SECRET);

// Frontend: read from import.meta.env only
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
```

### Logging and Output

**BLOCK the commit if any staged file:**

- Logs a token, password, JWT, or API key with `console.log`, `pino`, or any logger:
  ```typescript
  // VIOLATION
  console.log("token:", token);
  logger.info({ jwt, user });
  ```
- Passes auth headers or full request objects to a logger without sanitization.
- Returns a raw error object (which may contain stack traces or internal paths) directly in an HTTP response to the client.

**Correct pattern:**

```typescript
// Log only safe fields
logger.info({ userId: user.id, action: "login" });

// Sanitize errors before returning
res.status(500).json({ error: "Internal server error", code: "INTERNAL" });
```

### Environment Files

**BLOCK the commit if:**

- A `.env` file is staged (`.env`, `.env.local`, `.env.production`, etc.).
- A file named `*.pem`, `*.key`, `*.p12`, `*.pfx` is staged.
- A `serviceAccountKey.json` or similar credential file is staged.

`.env.example` files are allowed and encouraged — they must contain only placeholder values, never real credentials.

### What GGA Should Flag as WARNING (not block, but annotate):

- `process.env.SOME_VAR` called outside `config/env.ts` — direct env access bypasses centralized validation.
- `localStorage.getItem('token')` or `localStorage.setItem('token', ...)` outside `lib/auth.ts`.
- Raw `fetch()` calls in React components (should go through `lib/apiClient.ts`).
- Prisma imported outside `repositories/` directory.
- `req.app.get('io')` used instead of the `lib/socket.ts` singleton.

---

## Architecture

> Full detail in [`docs/architecture.md`](./docs/architecture.md). This section is the contract summary.

### Backend — Layered Clean Architecture

```
routes/       ← HTTP boundary only. No logic. Registers middleware + calls controller.
controllers/  ← Orchestration layer. Reads request, calls service, writes response.
services/     ← Business logic. The "what the system does". No Prisma here.
repositories/ ← Data access. The ONLY place Prisma is imported and used.
domain/       ← Entities, value types, domain errors. Zero framework dependencies.
lib/          ← External client wrappers: Gemini, WhatsApp, Cloudinary, Socket.IO.
config/       ← Env parsing, constants.
middleware/   ← Auth, validation, error handling.
```

**Layer communication rule**: each layer talks ONLY to the layer directly below it.

- Controller → Service → Repository → Prisma
- A controller NEVER imports from a repository directly.
- A repository NEVER contains business logic.
- A service NEVER imports from `routes/` or `middleware/`.

### Frontend — Feature-based + Container/Presentational

```
src/
├── features/        ← Domain slices. One folder per bounded context.
│   └── <domain>/
│       ├── api/         ← React Query hooks and fetch functions for this domain.
│       ├── components/  ← Presentational: pure UI, receives props, emits events.
│       ├── containers/  ← Smart: owns state and logic, composes components.
│       └── types.ts     ← Domain types for this feature.
├── shared/          ← Components and hooks with no domain dependency.
│   ├── components/
│   └── hooks/
├── lib/             ← singletons: queryClient, socket instance, auth token helpers.
├── config/          ← Route constants, env vars.
└── pages/           ← Route-level composition only. Renders containers.
```

**Component rule**: a presentational component must not know where its data comes from.
**Container rule**: a container does not render raw HTML — it composes presentational components.
**Page rule**: a page does not contain business logic. It only composes containers and sets layout.

---

## Naming Conventions

### Files

| Context            | Convention                 | Example                        |
| ------------------ | -------------------------- | ------------------------------ |
| Backend service    | `camelCase.service.ts`     | `citas.service.ts`             |
| Backend repository | `camelCase.repository.ts`  | `citas.repository.ts`          |
| Backend controller | `camelCase.controller.ts`  | `citas.controller.ts`          |
| Backend route      | `camelCase.route.ts`       | `citas.route.ts`               |
| Frontend component | `PascalCase.tsx`           | `CitaCard.tsx`                 |
| Frontend container | `PascalCase.container.tsx` | `CalendarioView.container.tsx` |
| Frontend hook      | `useNoun.ts`               | `useCitas.ts`                  |
| Frontend api hook  | `useNounQuery/Mutation.ts` | `useCitasQuery.ts`             |
| Types file         | `types.ts` or `domain.ts`  | `citas/types.ts`               |

### Identifiers

- Functions and variables: `camelCase`
- Classes and types: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Zod schemas: `NounSchema` (e.g., `CitaSchema`)
- Prisma model references always use the model name as-is

---

## Code Rules

### General

- No hardcoded secrets or API keys. Use `process.env` on the backend, `import.meta.env` on the frontend.
- No `console.log` in production paths. Use `pino` on the backend for structured logging.
- No swallowed errors. Every `catch` block must either re-throw, log, or return a typed error.
- No dead files in root directories (`old_logic_reference.ts`, `update_role.ts`, etc.). Scripts go in `scripts/`.
- Prefer `async/await` over callbacks. No `.then()` chains unless unavoidable.
- All public functions must have explicit TypeScript return types.

### Backend-specific

- All request validation is done with **Zod** in middleware, before reaching the controller.
- JWT verification happens exclusively in `middleware/auth.ts`. No other file checks tokens.
- Prisma is imported ONLY inside `repositories/`. Not in services, not in controllers.
- `socket.io` instance is accessed via `lib/socket.ts` singleton, not via `req.app.get('io')`.
- Environment variables are read exclusively from `config/env.ts`. No direct `process.env` calls outside config.
- Cron jobs and scheduled services are bootstrapped in `config/bootstrap.ts`, not in `server.ts`.
- Domain errors are typed classes extending `AppError` from `domain/errors.ts`.

### Frontend-specific

- Auth token is read and written ONLY through `lib/auth.ts`. No direct `localStorage` access for JWT.
- All API calls use the centralized `lib/apiClient.ts` (fetch wrapper with auth headers). No raw `fetch()` calls in components.
- `axios` is not used. If an axios-based implementation is found, replace it with `apiClient`.
- React Query is the single state-management solution for server data. No mixed `useState+useEffect` patterns for remote data.
- Every route subtree that can fail must be wrapped in an `ErrorBoundary`.
- Socket events are subscribed in `lib/socket.ts` and exposed via hooks. No direct `socket.on` calls in components.

---

## State Management (Frontend)

| Data type                      | Solution                                               |
| ------------------------------ | ------------------------------------------------------ |
| Server data (API responses)    | React Query (`@tanstack/react-query`)                  |
| Auth state                     | `AuthContext` (backed by `lib/auth.ts`)                |
| UI-local state (modals, forms) | `useState` in the container                            |
| Cross-feature UI state         | React Context — create a dedicated context             |
| Notifications                  | `useNotifications` hook (existing, in `shared/hooks/`) |

No Redux, no Zustand unless a measurable performance problem requires it and is documented in `docs/decisions.md`.

---

## Frontend Quality Rules (GGA enforces these on every commit)

### Design Tokens — No Hardcoded Values

**BLOCK the commit if any staged `.tsx` or `.css` file contains:**

- A hardcoded hex color outside of `tailwind.config.cjs`:
  ```tsx
  // VIOLATION
  style={{ color: '#3b82f6' }}
  className="text-[#3b82f6]"
  border: '1px solid #e5e7eb'
  ```
- A hardcoded pixel value for spacing, font-size, or border-radius outside of Tailwind utilities:
  ```tsx
  // VIOLATION
  style={{ marginTop: '24px', fontSize: '14px' }}
  ```
- A hardcoded z-index number anywhere outside of `tailwind.config.cjs`:
  ```tsx
  // VIOLATION
  style={{ zIndex: 9999 }}
  className="z-[9999]"
  ```

**Correct pattern — use Tailwind design tokens:**

```tsx
// Use semantic Tailwind classes
className = "text-blue-500 mt-6 text-sm z-modal";

// If a value is not in Tailwind defaults, add it to tailwind.config.cjs
// extend.zIndex: { modal: '100', overlay: '200' }
```

### Component Reuse — No Copy-Paste UI

**BLOCK the commit if any staged file:**

- Contains a JSX block of 5+ lines that is structurally identical or near-identical to an existing component already in `shared/components/` or the same feature's `components/` folder.
- Defines a button, input, badge, card, modal, or spinner inline in a page or container when a shared component for that pattern already exists.
- Duplicates loading state UI (spinners, skeletons) — these belong in `shared/components/`.
- Duplicates error state UI — use the shared `ErrorFallback` component.

**The rule**: if a UI pattern appears in 2+ places, it must be a component. If a component is domain-agnostic, it belongs in `shared/components/`.

### React Anti-Patterns

**BLOCK the commit if any staged `.tsx` file:**

- Uses `useEffect` to fetch data or sync server state:
  ```tsx
  // VIOLATION — use React Query instead
  useEffect(() => {
    fetch("/api/citas")
      .then((r) => r.json())
      .then(setCitas);
  }, []);
  ```
- Uses array index as React `key` in a list that can be reordered or filtered:
  ```tsx
  // VIOLATION
  {
    items.map((item, index) => <Card key={index} />);
  }
  // CORRECT
  {
    items.map((item) => <Card key={item.id} />);
  }
  ```
- Has a `useEffect` with a missing or incomplete dependency array (all referenced variables must be listed).
- Uses `any` type in props or state — use explicit types or `unknown` with a type guard.
- Renders raw user-provided strings with `dangerouslySetInnerHTML` without sanitization.
- Passes more than 4 props through intermediate components without context or composition (prop drilling signal).

**WARN if:**

- A component file exceeds 150 lines — it likely needs to be split into container + presentational.
- A `useState` manages more than 3 related fields — consider `useReducer` or a dedicated hook.
- A component renders conditional UI for 3+ roles or states inline — extract to named sub-components.

### Inline Styles

**BLOCK the commit if any staged `.tsx` file uses `style={{}}` for anything that can be expressed as a Tailwind class.**

The only acceptable uses of `style={{}}` are:

- Dynamic values that cannot be expressed statically (e.g., `style={{ width: `${progress}%` }}`).
- CSS custom property injection (e.g., `style={{ '--color': value }}`).

---

## Error Handling

### Backend

```typescript
// domain/errors.ts
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
  }
}

// Usage in service
throw new AppError("Appointment not found", 404, "CITA_NOT_FOUND");
```

All unhandled errors bubble up to `middleware/errorHandler.ts`, which formats and returns the response.
Never call `res.status().json()` inside a catch block in a controller — throw instead.

### Frontend

```typescript
// Every feature's container wraps its view in an ErrorBoundary
<ErrorBoundary fallback={<ErrorFallback />}>
  <CalendarioView />
</ErrorBoundary>
```

React Query errors are caught at the query level and surfaced via the `isError` flag, not try/catch.

---

## Testing

- Backend unit tests: `*.test.ts` co-located with the file under test.
- Services and repositories are the primary test targets.
- Controllers are tested via integration tests against the actual HTTP layer.
- Frontend: component tests with React Testing Library. Containers are tested, not pages.
- No test should import from Prisma directly — use repository mocks.

---

## Git and Commits

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`
- Commits are **work units**: one logical change per commit. Tests and related docs ship with the code change.
- No "WIP", "fix stuff", or "changes" commit messages.
- No AI attribution in commits.
- Branch naming: `feat/<slug>`, `fix/<slug>`, `refactor/<slug>`

---

## Key Files Reference

| File                            | Purpose                                   |
| ------------------------------- | ----------------------------------------- |
| `docs/architecture.md`          | Full architecture rationale and diagrams  |
| `docs/decisions.md`             | Architecture Decision Records (ADRs)      |
| `docs/api.md`                   | REST API contract and endpoint reference  |
| `docs/onboarding.md`            | Setup guide for new contributors          |
| `backend/src/domain/errors.ts`  | Typed domain error classes                |
| `backend/src/config/env.ts`     | Env variable parsing and validation       |
| `backend/src/lib/socket.ts`     | Socket.IO singleton                       |
| `frontend/src/lib/auth.ts`      | Token read/write — single source of truth |
| `frontend/src/lib/apiClient.ts` | Centralized fetch wrapper                 |

---

## AI Collaboration Protocol

When multiple AIs operate simultaneously on this codebase, they MUST follow this coordination protocol.
The goal: **semi-autonomous work with collision avoidance**, not synchronized串行 execution.

### Quick Start — Session Boot

**Trigger phrase**: `revisa engram wavio` (or any variation: "connect to wavio", "start wavio", "revisa engram")

When an AI hears this phrase, it MUST execute this boot sequence BEFORE doing anything else:

**Step 1 — Project Context:**

```
mem_search(query: "project wavio architecture")
mem_search(query: "session summary wavio")
```

**Step 2 — Current State:**

```
mem_search(query: "claim:")           // Active file claims
mem_search(query: "agy/task-board")   // AGY tasks
mem_search(query: "agy/completions")  // AGY completions
```

**Step 3 — Report Status:**
After loading context, the AI MUST report to the user:

- What Wavio is (1 sentence)
- What was done last session (key items)
- What's currently in progress (active claims, AGY tasks)
- What's blocked or needs attention

**Example output:**

```
Wavio: AI-powered appointment platform for WhatsApp.
Last session: Fixed CI, added AI Collaboration Protocol with Engram claims.
In progress: No active claims. AGY: no pending tasks.
Ready to work. What's next?
```

**For AGY specifically:**
After boot, also search:

```
mem_search(query: "agy/prompt-board")  // Detailed instructions
```

Then execute tasks from the prompt board.

### Identity and Ownership

Each AI has a **primary domain** — the area they own exclusively:

| AI       | Primary Domain                               | Exclusive Files                                                      |
| -------- | -------------------------------------------- | -------------------------------------------------------------------- |
| Opencode | Architecture, Backend, CI/CD, Infrastructure | `ai-appointment-platform-backend/src/**`, `.github/**`, root configs |
| AGY      | Frontend Features, UI                        | `ai-appointment-platform-frontend/src/**`                            |

**Rule**: Work freely within your exclusive domain. No coordination needed.

### Shared Files — Claim Before Modifying

Some files belong to both AIs' workflows. Before modifying these, you MUST:

1. **Search Engram** for active claims: `mem_search(query: "claim:<filepath>")`
2. **If unclaimed**: write your claim, then work freely
3. **If claimed by other AI**: check if claim is stale (expired). If stale → take over. If active → coordinate.

**Files that require claims:**

- `.github/workflows/*.yml` — CI/CD pipelines
- `ai-appointment-platform-backend/prisma/schema.prisma` — Database schema
- `AGENTS.md` — This contract
- `docs/*.md` — Documentation
- Root `package.json`, `pnpm-lock.yaml` — Dependencies
- `commitlint.config.js`, `eslint.config.js` — Root configs

### Claim Lifecycle (Critical — prevents ghost locks)

**Why this matters**: AIs can crash mid-task. Without timestamps, a dead AI leaves a ghost claim that blocks the other AI forever.

**Claim format in Engram:**

```
Title: claim:<filepath>
Type: architecture
Content:
  **What**: Claiming [file] for modification
  **Why**: [reason]
  **Where**: [filepath]
  **Status**: active | completed | abandoned
  **Claimed at**: [ISO timestamp]
  **Expires at**: [ISO timestamp] — default: 2 hours from claim time
  **AI**: opencode | agy
```

**Rules:**

1. **Every claim MUST include timestamps** — `Claimed at` and `Expires at`
2. **Default expiry: 2 hours** — enough for a focused task, short enough to not block
3. **Refresh if needed** — if work takes longer, update `Expires at` before it expires
4. **Release after push** — update `Status: completed` and set `Expires at` to now
5. **Stale claims are dead** — if current time > `Expires at`, the claim is abandoned

**Stale claim detection (when checking claims):**

```
1. Search: mem_search(query: "claim:<filepath>")
2. If no results → claim is free, write yours
3. If results found → check Expires at timestamp
4. If Expires at < now → STALE, treat as unclaimed, write yours
5. If Expires at > now → ACTIVE, coordinate with claiming AI
```

**AGY crash scenario:**

- AGY claims `.github/workflows/ci.yml` at 14:00, expires at 16:00
- AGY crashes at 14:30 (never releases claim)
- Opencode wants to modify the same file at 15:00
- Opencode checks: claim exists, but `Expires at` (16:00) > now (15:00) → still active
- Opencode waits or coordinates
- At 16:01: claim expires, Opencode takes over

**If the task is short (< 30 min):**

```
**Expires at**: after push
```

This means the claim auto-expires once changes are pushed. If the AI dies before pushing, the claim expires after 2 hours (default).

### Engram Coordination Topics

| Topic Key               | Purpose                       | Owner                      |
| ----------------------- | ----------------------------- | -------------------------- |
| `agy/task-board`        | Tasks delegated to AGY        | Opencode writes, AGY reads |
| `agy/prompt-board`      | Detailed instructions for AGY | Opencode writes, AGY reads |
| `agy/completions`       | AGY reports when done         | AGY writes, Opencode reads |
| `agy/claims/<filepath>` | Active claim on shared file   | Whoever claims first       |

### Branch Coordination

- **Only one AI pushes to `dev` at a time.**
- Before pushing: always `git pull --rebase origin dev`.
- If you see the other AI's fresh commits, rebase before pushing.
- For large features: use feature branches `feat/<slug>`, merge via PR.

### Pre-Change Checklist (Mandatory)

Before modifying ANY file outside your exclusive domain:

1. Search Engram for active claims on that file
2. **Check claim timestamps** — is it stale? If yes, treat as unclaimed
3. Check `git log --oneline -5` for recent changes by the other AI
4. If claimed and active → coordinate first
5. Write your claim with timestamps before starting work

### Conflict Resolution

When both AIs need the same file:

1. **First-come-first-served**: the AI that claimed first keeps the file
2. **Stale claims are ignored**: expired claims don't count
3. **The other AI rebases** onto the first AI's changes
4. **If conflicting**: ask the user to resolve

### What Went Wrong Without This Protocol

- Both AIs added commitlint to CI workflows → duplication (no claims)
- CI broke because both pushed to `dev` simultaneously (no branch coordination)
- No mechanism to know "who is working on what right now" (no Engram claims)
- A dead AI could leave ghost claims forever (no timestamps/expiry)
- These mistakes are preventable with timestamped claims + pre-change checklist

---

## Before You Write Any Code

1. Read this file.
2. Read `docs/architecture.md`.
3. Identify which layer your change belongs to.
4. Follow the naming convention for that layer.
5. If your change crosses 2+ layers, check `docs/decisions.md` for precedent.
6. If you are adding a new pattern not covered here, document it in `docs/decisions.md` first.
