import { logA11yViolations } from '../support/commands';

describe('Calendario — citas del negocio', (): void => {
  beforeEach((): void => {
    cy.stubAuthMe();
    cy.intercept('GET', '**/api/v1/citas*', {
      body: { data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 1 } },
    }).as('citas');
    cy.loginAsAdmin();
    cy.visit('/dashboard/calendario');
  });

  it('muestra el calendario y el botón Nueva Cita', (): void => {
    cy.wait('@authMe');
    cy.contains('button', 'Nueva Cita').should('be.visible');
    cy.get('.rbc-calendar').should('be.visible');
    cy.injectAxe();
    // Las páginas del dashboard usan h2 de sección por diseño (sin h1):
    // se excluye solo esa regla, el resto del chequeo sigue completo.
    cy.checkA11y(
      undefined,
      { rules: { 'page-has-heading-one': { enabled: false } } },
      logA11yViolations,
    );
  });
});
