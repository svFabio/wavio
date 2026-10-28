describe('Calendario — crear cita', (): void => {
  // Fecha de hoy en formato local (el modal la usa como valor por defecto).
  const today = ((): string => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  })();

  const nuevaCita = {
    id: 'cita-e2e-1',
    clienteNombre: 'Juan E2E',
    clienteTelefono: '61234567',
    fecha: today,
    horario: '09:00',
    servicio: 'Corte E2E',
    servicioId: 1,
    estado: 'PENDIENTE',
    estadoPago: 'PENDIENTE',
    origen: 'virtual',
    creadoEn: new Date().toISOString(),
  };

  // Las citas "existentes" del calendario. Cada test parte de [] y el POST
  // de creación agrega la cita, de modo que el refetch posterior la muestra.
  let existentes: Array<typeof nuevaCita> = [];

  beforeEach((): void => {
    existentes = [];
    cy.stubAuthMe();
    cy.intercept('GET', '**/api/v1/citas/horarios-disponibles*', {
      fixture: 'horarios-disponibles.json',
    }).as('horarios');
    cy.intercept('GET', '**/api/v1/citas*', (req): void => {
      req.reply({ body: { data: existentes, pagination: {} } });
    }).as('citas');
    cy.intercept('GET', '**/api/v1/servicios', { fixture: 'servicios.json' }).as('servicios');
    cy.intercept('GET', '**/api/v1/users', { fixture: 'usuarios.json' }).as('usuarios');
    cy.intercept('GET', '**/api/v1/configuracion', { fixture: 'configuracion.json' }).as(
      'configuracion',
    );
    cy.loginAsAdmin();
    cy.visit('/dashboard/calendario');
    cy.wait('@authMe');
  });

  function abrirModalYCompletar(): void {
    // El botón del toolbar es el único <button> con ese texto (el título del
    // modal es un heading, no un botón).
    cy.contains('button', 'Nueva Cita').click();
    cy.get('[role="dialog"]').should('be.visible');
    cy.wait('@servicios');
    cy.wait('@horarios');

    cy.get('input[placeholder="Ej: Juan Perez"]').type('Juan E2E');
    cy.get('input[placeholder="Ej: 591 70000000"]').type('61234567');
    // El primer <select> del modal es el de servicio (el segundo es staff).
    cy.get('[role="dialog"] select').eq(0).select('1');
    cy.contains('button', '09:00').click();
  }

  it('crea una cita y aparece en el calendario', (): void => {
    cy.intercept('POST', '**/api/v1/citas/admin', (req): void => {
      existentes = [nuevaCita];
      req.reply({ body: { success: true } });
    }).as('crear');

    abrirModalYCompletar();
    cy.contains('button', 'Crear Cita').click();

    cy.wait('@crear');
    // El modal se cierra y el refetch muestra el resumen del mes.
    cy.get('[role="dialog"]').should('not.exist');
    cy.contains('1 cita').should('be.visible');
  });

  it('muestra el error del backend ante conflicto de horario', (): void => {
    cy.intercept('POST', '**/api/v1/citas/admin', {
      statusCode: 409,
      body: { error: 'El horario ya esta ocupado' },
    }).as('crearConflicto');

    abrirModalYCompletar();
    cy.contains('button', 'Crear Cita').click();

    cy.wait('@crearConflicto');
    // El modal sigue abierto con el mensaje de error visible.
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('[role="dialog"]').contains('El horario ya esta ocupado').should('be.visible');
    cy.contains('1 cita').should('not.exist');
  });
});
