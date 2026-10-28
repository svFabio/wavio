# Cypress E2E — Wavio frontend

Suite end-to-end con **Cypress 14** (ver **ADR-011**, **ADR-012** y **ADR-013**
en `docs/decisions.md`). Hay dos suites que corren aparte:

- **Normal** (`pnpm e2e`, `cypress.config.mjs`): specs con `cy.intercept`, sin
  backend. Rápida y siempre disponible.
- **Real** (`pnpm e2e:real`, `cypress.config.real.mjs`): specs en
  `cypress/e2e/real/` contra backend vivo + Postgres, sin intercepts. Ver
  sección «Suite real» más abajo.

## Filosofía (suite normal)

- **Red interceptada, sin backend real.** Todos los specs usan `cy.intercept`
  sobre `**/api/v1/*` y corren contra `vite dev` (`:5173`) o `vite preview`.
  No hay Postgres, ni backend, ni secretos en la suite.
- **Specs independientes.** Cada test registra sus propios intercepts en
  `beforeEach`; nada depende del orden de ejecución.
- **Cero secretos reales.** El único token es `cypress-e2e-fake-token`
  (ficticio) y todos los fixtures usan datos inventados (`@wavio.test`).

## Mapa de archivos

```
cypress.config.mjs        ← config única (.mjs: el loader TS de Cypress no
                            resuelve el tsconfig solution-style con "type": "module");
                            incluye TODOS los specs (cy:open los lista todos) y
                            la selección por suite la hacen los scripts (--spec)
cypress.config.real.mjs   ← config suite real (specPattern solo e2e/real/,
                            env.apiUrl → backend en :3000)
cypress/
├── e2e/
│   ├── real/             ← SUITE REAL (backend vivo, ver ADR-013)
│   │   ├── crear-cita.cy.ts        ← crear cita → persistencia en Postgres → UI
│   │   ├── conflicto-horario.cy.ts ← slot ocupado ausente + carrera → 400 real
│   │   ├── editar-cita.cy.ts        ← no-asistió y reprogramar con verificación API
│   │   └── portal-publico.cy.ts    ← link mágico sin sesión → agenda → PENDIENTE
│   ├── auth.cy.ts        ← login: formulario, éxito → /dashboard, 401
│   ├── calendario.cy.ts  ← calendario + botón Nueva Cita + axe
│   ├── citas.cy.ts       ← crear cita (éxito + conflicto 409 → error visible)
│   ├── chat.cy.ts        ← historial con respuesta IA, envío, fallo conserva texto
│   ├── pagos.cy.ts       ← pendientes, aprobar, rechazar, error backend
│   ├── portal.cy.ts      ← enlace válido / inválido + axe
│   └── whatsapp.cy.ts    ← estado conectado/desconectado + desvincular
├── fixtures/             ← un JSON por dominio (auth-session, servicios,
│                           usuarios, configuracion, horarios-disponibles,
│                           conversaciones, mensajes, pagos-pendientes,
│                           portal-valid, portal-services)
├── support/
│   ├── commands.ts       ← stubAuthMe, visitAsAdmin, loginAsAdmin (cy.session),
│   │                       clearAuth, logA11yViolations
│   ├── realCommands.ts   ← seedE2ETenant, loginReal (suite real)
│   └── e2e.ts            ← carga comandos + cypress-axe; ignora errores GIS
├── tsconfig.json         ← referenciado desde el tsconfig raíz (tsc -b lo cubre)
└── README.md             ← este archivo
```

## Comandos custom (`support/commands.ts`)

| Comando          | Qué hace                                                     |
| ---------------- | ------------------------------------------------------------ |
| `stubAuthMe()`   | Intercepta `GET /auth/me` con sesión ADMIN. Antes del visit. |
| `visitAsAdmin()` | Visita sembrando `localStorage` en `onBeforeLoad`.           |
| `loginAsAdmin()` | Sesión ADMIN cacheada con `cy.session` (un setup por spec).  |
| `clearAuth()`    | Limpia el `localStorage` de la app.                          |

Replican el contrato de `src/lib/auth.ts` (claves `token` +
`activeNegocioId`). `AuthContext` lee `localStorage` **solo al montar**, por
eso la siembra ocurre siempre antes del load (nunca después).

### Comandos de la suite real (`support/realCommands.ts`)

| Comando                           | Qué hace                                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `seedE2ETenant()`                 | Registra un tenant único (email con `Date.now()`), crea horarios 08:00–18:00 los 7 días y un servicio de 60 min. En `before()`. |
| `loginReal(email, password)`      | Login real por formulario con `cy.session` (un setup por spec). En `beforeEach()`.                                              |
| `apiUrl()` / `apiHeaders(tenant)` | Helpers: URL del backend (`env.apiUrl`) y headers `Authorization` + `x-negocio-id` para `cy.request`.                           |

## Política de selectores (anti "clic fantasma")

Lección aprendida (2026-09-22): `cy.contains('button', 'Iniciar sesion')`
matcheaba el **tab** y no el **submit** — click no-op sin error. Reglas:

1. `contains` siempre con tag: `cy.contains('button', ...)`, `cy.contains('h1', ...)`.
2. Preferir atributos estables: `form button[type="submit"]`,
   `input[placeholder="..."]`, `[aria-label="..."]`, `[role="dialog"]`.
3. **Sin `data-testid` en producción (decisión documentada):** los
   selectores accesibles (placeholder, aria-label, roles, type) son
   estables y además fuerzan UI accesible. Añadir testids tocaría 4+
   features del dominio de AGY por ganancia marginal. Si un selector se
   vuelve frágil, se revisa caso por caso antes de pedir testids.

## Decisiones de alcance (lo que NO se hace y por qué)

- **Sin `cy.request` para setup en la suite normal:** sin backend real,
  `cy.request` no aporta nada sobre el seed vía `onBeforeLoad`/`cy.session`,
  que ya evita navegar por UI para autenticar. En la suite real sí se usa,
  y solo con dos papeles: "otro admin" que compite por un horario y
  verificación de persistencia (ambos imposibles de lograr con la UI sola).
- **Sin Stripe real:** el frontend no tiene Stripe.js ni checkout; los pagos
  se validan contra el backend (`POST /citas/:id/validar`). El spec cubre
  los estados que la UI sí refleja: pendiente, aprobado, rechazado, error.
- **Sin riesgo de orden:** `cy.session` cachea por spec (aislado entre
  specs); los fixtures mutables (`existentes`, `pendientes`, `conectado`)
  se resetean en `beforeEach`.

## Accesibilidad

`cypress-axe` corre en login, calendario y portal como parte de los specs
existentes (sin specs nuevos). `logA11yViolations` imprime regla, impacto y
selectores en el log. Exclusiones con razón:

- `page-has-heading-one` desactivada **solo en calendario**: las páginas del
  dashboard usan `h2` de sección por diseño.
- Landmarks: el layout Dashboard ya trae `<main>`; las páginas huérfanas
  (`Login`, `Portal`) envuelven su contenido en `<main>` a nivel de página.

## Suite real (ADR-013)

Corre Cypress contra el stack completo, **sin `cy.intercept`**: lo que la UI
envía llega a Nest y a Postgres, y las verificaciones de persistencia se hacen
contra la API real.

**Requisitos locales** (CI lo levanta solo):

```bash
# 1. Base E2E dedicada (no toca tu DB de desarrollo ni el .env)
docker run -d --name wavio-e2e-db \
  -e POSTGRES_USER=wavio -e POSTGRES_PASSWORD=wavio_dev -e POSTGRES_DB=wavio_e2e \
  -p 127.0.0.1:5433:5432 postgres:15-alpine
cd ai-appointment-platform-backend
DATABASE_URL="postgresql://wavio:wavio_dev@127.0.0.1:5433/wavio_e2e" \
  npx prisma db push --skip-generate   # db push, no migrate deploy (ADR-013)
pnpm build && DATABASE_URL="postgresql://wavio:wavio_dev@127.0.0.1:5433/wavio_e2e" \
  node dist/src/main.js                # backend en :3000
# 2. Frontend
cd ../ai-appointment-platform-frontend && pnpm dev   # :5173
# 3. La suite
pnpm e2e:real
```

**Qué se prueba:**

- `crear-cita.cy.ts`: alta de cita desde el calendario → verificación en
  Postgres vía `GET /citas` → resumen "1 cita" en la UI.
- `conflicto-horario.cy.ts`: el horario ocupado desaparece de la grilla
  (engine real), y la carrera (otro admin toma el slot mientras el modal está
  abierto) responde el 400 real "no está disponible" sin duplicar la cita.
- `editar-cita.cy.ts`: marcar una cita pasada como no asistió (estado en API +
  botón que cambia al reabrir) y reprogramarla a otro horario con persistencia
  verificada vía API.
- `portal-publico.cy.ts`: desde el link mágico (sin sesión de admin) elige
  fecha + servicio → carga de horarios con `servicioId` (regresión del bug
  `available-slots` 500) → agenda → la cita queda `PENDIENTE` en Postgres;
  también cubre token inválido → "Enlace invalido". 7 tests en total.

**Reglas de la suite real:**

- Fecha siempre **mañana** (el engine filtra slots pasados solo si es hoy).
- Tenant único por corrida → cero datos residuales entre corridas.
- Rate limits reales: register/login 5/min por IP; iterar muy seguido
  localmente puede devolver 429 (esperar 1 min).
- Flakiness por lentitud, no por test: si la máquina está con swap lleno
  (backend watch + vite + Chrome), los specs fallan por timeout de forma
  aleatoria. Señal: respuestas >1s en el log del backend. Solución: reiniciar
  `pnpm dev` del backend (el watch de tsc acumula heap) y re-correr.

## Cómo correr

```bash
pnpm dev        # terminal 1 (:5173)
pnpm cy:open    # interactivo: lista TODOS los specs (stubs + real/)
pnpm e2e        # headless solo stubs (glob cypress/e2e/*.cy.ts, no cruza subcarpetas)
pnpm e2e:real   # suite real (requiere backend + Postgres, ver arriba)
# contra preview (como CI):
pnpm run build && pnpm exec vite preview --port 4173 --strictPort
pnpm exec cypress run --config baseUrl=http://localhost:4173
```

## CI (`e2e-frontend` y `e2e-real`)

- `e2e-frontend`: matriz `[chrome, firefox]` con
  `cypress-io/github-action@v6` (build + preview `:4173`). Solo la suite
  normal (el script `pnpm e2e` pasa `--spec cypress/e2e/*.cy.ts`, que no
  cruza a `real/`).
- `e2e-real`: misma matriz contra el stack vivo — service de Postgres 16,
  `db push`, backend compilado en background (health-wait en `/api/v1/health`)
  y `vite preview`. Valores dummy para los secretos que exige `config/env.ts`
  (ningún flujo E2E los usa).

En ambos: video activado solo en CI; screenshots (en fallo) y videos se suben
como artifacts por navegador.

## Evidencia

- 2026-09-22: 6/6 verde (auth 3, calendario 1, portal 2).
- 2026-09-26: **17/17 verde en Chrome headless** — auth 3, calendario 1,
  citas 2, chat 3, pagos 4, portal 2, whatsapp 2. Duración total ~30s.
- 2026-09-26: **3/3 verde suite real** (crear-cita 1, conflicto-horario 2)
  contra backend vivo + Postgres E2E; suite normal siguió en 17/17 tras el
  `excludeSpecPattern`.
- 2026-09-26: **5/5 verde suite real** tras añadir marcar no asistió +
  reprogramar: crear-cita 1, conflicto-horario 2, editar-cita 2. Suite normal
  17/17 intacta.
- 2026-09-27: **17/17 stub + 7/7 real** tras unificar la lista de specs en
  `cy:open` (fin de `excludeSpecPattern`; selección por `--spec`) y eliminar
  el boilerplate de ejemplos que generó la GUI de Cypress (`commands.js`
  pisaba a `commands.ts` → `cy.stubAuthMe is not a function`).
- Vitest existente intacto: 127 archivos / 723 tests en verde.
- `tsc -b`, `eslint`, `prettier --check`, `vite build`: limpios.

## Límites honestos (fase 2)

- La suite real cubre creación, conflicto de horario, no-asistió y
  reprogramar; todavía no valida pagos (`/citas/:id/validar`) ni flujos de
  chat/WhatsApp contra backend vivo.
- Sin cobertura de login con Google, sockets en vivo ni push.
- `useNotifications().notifications` no lo renderiza ningún componente
  (el feedback de pagos/chat va por `sonner`; ver ADR-012).
- Firefox solo corre en CI (matriz), no verificado en local en esta sesión.
