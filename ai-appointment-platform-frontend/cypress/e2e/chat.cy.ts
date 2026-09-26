describe('Chat — conversación con el asistente', (): void => {
  const jid = '59161234567@s.whatsapp.net';

  beforeEach((): void => {
    cy.stubAuthMe();
    cy.intercept('GET', '**/api/v1/chat/conversaciones', {
      fixture: 'conversaciones.json',
    }).as('conversaciones');
    cy.intercept('GET', `**/api/v1/chat/mensajes/*`, { fixture: 'mensajes.json' }).as('mensajes');
    cy.loginAsAdmin();
    cy.visit('/dashboard/chat');
    cy.wait('@authMe');
    cy.wait('@conversaciones');
  });

  function abrirConversacion(): void {
    // El botón de la conversación es el único <button> con el nombre del cliente
    // (el botón interno de eliminar solo tiene aria-label, sin texto).
    cy.contains('button', 'Cliente E2E').click();
    cy.wait('@mensajes');
  }

  it('muestra el historial con la respuesta del asistente', (): void => {
    abrirConversacion();
    cy.contains('Hola, quiero agendar una cita').should('be.visible');
    cy.contains('¿Qué día tienes disponible?').should('be.visible');
    cy.get('#chat-message').should('be.visible');
  });

  it('envía un mensaje y limpia el input', (): void => {
    cy.intercept('POST', `**/api/v1/chat/enviar/*`, { body: { success: true } }).as('enviar');
    abrirConversacion();

    cy.get('#chat-message').type('Quiero el viernes a las 10');
    cy.get('[aria-label="Enviar mensaje"]').click();

    cy.wait('@enviar').its('request.body').should('deep.equal', {
      texto: 'Quiero el viernes a las 10',
    });
    cy.get('#chat-message').should('have.value', '');
  });

  it('conserva el texto si el envío falla', (): void => {
    cy.intercept('POST', `**/api/v1/chat/enviar/*`, {
      statusCode: 500,
      body: { error: 'Error interno' },
    }).as('enviarFalla');
    abrirConversacion();

    cy.get('#chat-message').type('Mensaje que fallara');
    cy.get('[aria-label="Enviar mensaje"]').click();

    cy.wait('@enviarFalla');
    // Comportamiento real de la app: sin éxito no limpia el input y no rompe la vista.
    cy.get('#chat-message').should('have.value', 'Mensaje que fallara');
    cy.contains('Hola, quiero agendar una cita').should('be.visible');
  });
});
