describe('Pagos — validación de comprobantes', (): void => {
  // La app pide confirmación nativa antes de validar: se acepta siempre.
  // Los pagos con Stripe viven en el backend; el frontend solo refleja los
  // estados que devuelve la API (pendiente/aprobado/rechazado/error).
  let pendientes: Array<Record<string, unknown>> = [];

  beforeEach((): void => {
    cy.fixture('pagos-pendientes.json').then(
      (body: { data: Array<Record<string, unknown>> }): void => {
        pendientes = body.data;
      },
    );
    cy.stubAuthMe();
    cy.intercept('GET', '**/api/v1/citas/pendientes', (req): void => {
      req.reply({ body: { data: pendientes, pagination: {} } });
    }).as('pendientes');
    cy.on('window:confirm', (): boolean => true);
    cy.loginAsAdmin();
    cy.visit('/dashboard/pagos');
    cy.wait('@authMe');
    cy.wait('@pendientes');
  });

  it('muestra los pagos pendientes de revisión', (): void => {
    cy.contains('h2', 'Validacion de Comprobantes').should('be.visible');
    cy.contains('1 pendientes').should('be.visible');
    cy.contains('María E2E').should('be.visible');
  });

  it('aprueba un pago y la lista queda vacía', (): void => {
    cy.intercept('POST', '**/api/v1/citas/*/validar', (req): void => {
      pendientes = [];
      req.reply({ body: { success: true } });
    }).as('validar');

    cy.contains('button', 'Aprobar').click();

    cy.wait('@validar').its('request.body').should('deep.equal', { accion: 'APROBAR' });
    cy.contains('Acción realizada con éxito').should('be.visible');
    cy.contains('Todo al dia!').should('be.visible');
  });

  it('rechaza un pago y la lista queda vacía', (): void => {
    cy.intercept('POST', '**/api/v1/citas/*/validar', (req): void => {
      pendientes = [];
      req.reply({ body: { success: true } });
    }).as('validar');

    cy.contains('button', 'Rechazar').click();

    cy.wait('@validar').its('request.body').should('deep.equal', { accion: 'RECHAZAR' });
    cy.contains('Todo al dia!').should('be.visible');
  });

  it('muestra error si el backend falla al validar', (): void => {
    cy.intercept('POST', '**/api/v1/citas/*/validar', {
      statusCode: 500,
      body: { error: 'Error interno' },
    }).as('validarFalla');

    cy.contains('button', 'Aprobar').click();

    cy.wait('@validarFalla');
    cy.contains('Error de conexión').should('be.visible');
    cy.contains('María E2E').should('be.visible');
  });
});
