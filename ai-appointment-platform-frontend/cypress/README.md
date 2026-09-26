# Cypress E2E — Wavio frontend

Suite end-to-end con **Cypress 14** (ver **ADR-011** y **ADR-012** en `docs/decisions.md`).

## Filosofía

- **Red interceptada, sin backend real.** Todos los specs usan `cy.intercept`
  sobre `**/api/v1/*` y corren contra `vite dev` (`:5173`) o `vite preview`.
  No hay Postgres, ni backend, ni secretos en la suite.
- **Specs independientes.** Cada test registra sus propios intercepts en
  `beforeEach`; nada depende del orden de ejecución.
- **Cero secretos reales.** El único token es `cypress-e2e-fake-token`
  (ficticio) y todos los fixtures usan datos inventados (`@wavio.test`).

## Mapa de archivos

```
cypress.config.mjs        ← config (.mjs: el loader TS de Cypress no resuelve
                            el tsconfig solution-style con "type": "module")
cypress/
├── e2e/
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

- **Sin `cy.request` para setup:** sin backend real, `cy.request` no aporta
  nada sobre el seed vía `onBeforeLoad`/`cy.session`, que ya evita navegar
  por UI para autenticar. Se omite explícitamente.
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

## Cómo correr

```bash
pnpm dev        # terminal 1 (:5173)
pnpm cy:open    # interactivo
pnpm e2e        # headless contra :5173
# contra preview (como CI):
pnpm run build && pnpm exec vite preview --port 4173 --strictPort
pnpm exec cypress run --config baseUrl=http://localhost:4173
```

## CI (`e2e-frontend`)

Matriz `[chrome, firefox]` con `cypress-io/github-action@v6` (build +
preview `:4173`). Video activado solo en CI; screenshots (en fallo) y videos
se suben como artifacts por navegador.

## Evidencia

- 2026-09-22: 6/6 verde (auth 3, calendario 1, portal 2).
- 2026-09-26: **17/17 verde en Chrome headless** — auth 3, calendario 1,
  citas 2, chat 3, pagos 4, portal 2, whatsapp 2. Duración total ~30s.
- Vitest existente intacto: 127 archivos / 723 tests en verde.
- `tsc -b`, `eslint`, `prettier --check`, `vite build`: limpios.

## Límites honestos (fase 2)

- Specs con API interceptada, no E2E real contra backend/DB.
- Sin cobertura de login con Google, sockets en vivo ni push.
- `useNotifications().notifications` no lo renderiza ningún componente
  (el feedback de pagos/chat va por `sonner`; ver ADR-012).
- Firefox solo corre en CI (matriz), no verificado en local en esta sesión.
