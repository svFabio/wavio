describe('WhatsApp — vinculación de cuenta', (): void => {
  // El estado se sirve con reply dinámico para que desvincular cambie la UI
  // tras el refetch, igual que en producción.
  let conectado = false;

  beforeEach((): void => {
    conectado = false;
    cy.stubAuthMe();
    cy.intercept('GET', '**/api/v1/whatsapp/status', (req): void => {
      req.reply({
        body: conectado ? { connected: true, phone: '+59161234567' } : { connected: false },
      });
    }).as('status');
    cy.loginAsAdmin();
    cy.visit('/dashboard/vincular');
    cy.wait('@authMe');
    cy.wait('@status');
  });

  it('muestra la opción de conectar cuando no hay cuenta vinculada', (): void => {
    cy.contains('h2', 'Conexion WhatsApp').should('be.visible');
    cy.contains('button', 'Conectar con Facebook').should('be.visible');
  });

  it('muestra el estado conectado y permite desvincular', (): void => {
    conectado = true;
    cy.intercept('POST', '**/api/v1/whatsapp/disconnect', (req): void => {
      conectado = false;
      req.reply({ body: { success: true } });
    }).as('disconnect');

    // Re-monta el estado cambiando el stub y recargando: cada test es independiente.
    cy.reload();
    cy.wait('@status');

    cy.contains('Conectado a Meta Oficial').should('be.visible');
    cy.contains('+59161234567').should('be.visible');

    cy.on('window:confirm', (): boolean => true);
    cy.contains('button', 'Desvincular').click();

    cy.wait('@disconnect');
    cy.contains('button', 'Conectar con Facebook').should('be.visible');
  });
});
