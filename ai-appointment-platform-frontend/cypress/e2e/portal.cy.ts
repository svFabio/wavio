import { logA11yViolations } from '../support/commands';

describe('Portal público de reservas', (): void => {
  const token = 'e2e-portal-token';

  it('muestra error con enlace inválido', (): void => {
    cy.intercept('GET', `**/api/v1/portal/${token}`, {
      statusCode: 404,
      body: { error: 'Enlace inválido' },
    }).as('validateFail');

    cy.visit(`/portal/${token}`);

    cy.wait('@validateFail');
    cy.contains('Enlace invalido').should('be.visible');
  });

  it('muestra el negocio y el formulario con enlace válido', (): void => {
    cy.intercept('GET', `**/api/v1/portal/${token}`, { fixture: 'portal-valid.json' }).as(
      'validate',
    );
    cy.intercept('GET', `**/api/v1/portal/${token}/appointments`, []).as('citas');
    cy.intercept('GET', `**/api/v1/portal/${token}/services`, {
      fixture: 'portal-services.json',
    }).as('servicios');

    cy.visit(`/portal/${token}`);

    cy.wait('@validate');
    cy.contains('h1', 'Negocio E2E').should('be.visible');
    cy.contains('Agendar Nueva Cita').should('be.visible');
    cy.injectAxe();
    cy.checkA11y(undefined, undefined, logA11yViolations);
  });
});
