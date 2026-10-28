// Comandos custom de la suite E2E (ver ADR-011).
//
// El auth de la app vive en `src/lib/auth.ts`: token bajo la clave `token`
// y negocio activo bajo `activeNegocioId`. Estos helpers replican ese
// contrato para sembrar sesión en los specs. Si esas claves cambian,
// hay que actualizar este archivo.

import type { Result as AxeResult } from 'axe-core';

const TOKEN_KEY = 'token';
const ACTIVE_NEGOCIO_KEY = 'activeNegocioId';

function seedAuth(win: Window): void {
  // AuthContext lee localStorage solo al montar: hay que sembrarlo
  // antes de que arranque la app, no después.
  win.localStorage.setItem(TOKEN_KEY, E2E_FAKE_TOKEN);
  win.localStorage.setItem(ACTIVE_NEGOCIO_KEY, String(E2E_NEGOCIO_ID));
}

// Token ficticio solo para E2E. No es una credencial real: los specs
// interceptan `/auth/me` y nunca llegan al backend.
export const E2E_FAKE_TOKEN = 'cypress-e2e-fake-token';
export const E2E_NEGOCIO_ID = 1;

/**
 * Callback para cy.checkA11y(): convierte las violaciones en un error con
 * detalle (regla, impacto y selectores) en vez del conteo pelado.
 */
export function logA11yViolations(violations: AxeResult[]): void {
  const summary = violations
    .map(
      (v): string =>
        `${v.id}[${v.impact ?? '?'}]: ${v.description} @ ${v.nodes
          .map((n): string => n.target.join(' '))
          .join(' | ')}`,
    )
    .join('\n');
  throw new Error(`Violaciones de accesibilidad:\n${summary}`);
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Intercepta GET /auth/me con una sesión ADMIN. Llamar antes de `visit`. */
      stubAuthMe(): Chainable<null>;
      /** Visita una ruta protegida con sesión ADMIN ya sembrada en localStorage. */
      visitAsAdmin(path: string): Chainable<AUTWindow>;
      /**
       * Sesión ADMIN cacheada entre tests del mismo spec (cy.session).
       * Llamar después de stubAuthMe() y antes de cy.visit().
       */
      loginAsAdmin(): Chainable<null>;
      /** Limpia la sesión sembrada en la ventana de la app. */
      clearAuth(): Chainable<Window>;
    }
  }
}

export function stubAuthMe(): Cypress.Chainable<null> {
  return cy.intercept('GET', '**/api/v1/auth/me', { fixture: 'auth-session.json' }).as('authMe');
}

export function visitAsAdmin(path: string): Cypress.Chainable<Cypress.AUTWindow> {
  return cy.visit(path, {
    onBeforeLoad(win: Window): void {
      seedAuth(win);
    },
  });
}

export function loginAsAdmin(): Cypress.Chainable<null> {
  cy.session('admin-e2e', (): void => {
    // El setup visita una sola vez por spec: Cypress restaura el
    // localStorage sembrado en los tests siguientes, siempre antes de que
    // la app monte (respeta el detalle de AuthContext). Requiere que el
    // intercept de GET /auth/me ya esté registrado (ver stubAuthMe).
    cy.visit('/login', {
      onBeforeLoad(win: Window): void {
        seedAuth(win);
      },
    });
    cy.window().its('localStorage').invoke('getItem', TOKEN_KEY).should('eq', E2E_FAKE_TOKEN);
  });
  return cy.wrap(null);
}

export function clearAuth(): Cypress.Chainable<Window> {
  return cy.window().then((win: Window): Window => {
    win.localStorage.clear();
    return win;
  });
}

Cypress.Commands.add('stubAuthMe', stubAuthMe);
Cypress.Commands.add('visitAsAdmin', visitAsAdmin);
Cypress.Commands.add('loginAsAdmin', loginAsAdmin);
Cypress.Commands.add('clearAuth', clearAuth);
