// Editar una cita ya creada contra el backend real: marcar no asistió y
// reprogramar. La UI solo ofrece "Marcar No Asistio" para citas pasadas, por
// eso el seed usa la fecha de ayer. Sin intercepts (ver ADR-013).

import { apiHeaders, apiUrl, crearCitaViaApi, type E2ETenant } from '../../support/realCommands';

describe('Citas — marcar inasistencia y reprogramar (con servidor)', (): void => {
  const fmt = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const ayerDate = new Date();
  ayerDate.setDate(ayerDate.getDate() - 1);
  const mananaDate = new Date();
  mananaDate.setDate(mananaDate.getDate() + 1);
  const ayer = fmt(ayerDate);
  const manana = fmt(mananaDate);

  let tenant: E2ETenant;

  before((): void => {
    cy.seedE2ETenant().then((t): void => {
      tenant = t;
    });
  });

  beforeEach((): void => {
    cy.loginReal(tenant.email, tenant.password);
  });

  // Abre el detalle de una cita: vista de día (la vista de mes solo muestra
  // resúmenes por fecha), navega a la fecha y entra al evento.
  function abrirDetalle(clienteNombre: string, nav: 'Anterior' | 'Siguiente'): void {
    cy.visit('/dashboard/calendario');
    cy.get('.rbc-calendar').should('be.visible');
    cy.get('[aria-label="Vista de dia"]').click();
    cy.get(`[aria-label="${nav}"]`).click();
    cy.contains(clienteNombre).click();
    cy.get('[role="dialog"][aria-label="Detalles de la cita"]').should('be.visible');
  }

  // Pide un slot libre real al engine: el preferido si sigue disponible, si no
  // el primero libre. Con retries (runMode: 1) la cita del intento anterior
  // queda en la BD y ocupando su horario — reutilizarlo daría 400.
  function slotLibre(fecha: string, preferido: string): Cypress.Chainable<string> {
    return cy
      .request({
        method: 'GET',
        url: `${apiUrl()}/citas/horarios-disponibles?fecha=${fecha}&servicioId=${tenant.servicioId}`,
        headers: apiHeaders(tenant),
      })
      .then((res) => {
        const horarios = (res.body as { horarios: string[] }).horarios;
        expect(horarios.length, `sin slots libres para ${fecha}`).to.be.at.least(1);
        return horarios.includes(preferido) ? preferido : horarios[0];
      });
  }

  it('marca una cita pasada como no asistió y lo refleja en API y UI', (): void => {
    // Nombre único por intento: evita que el reintento encuentre la cita
    // vieja del intento anterior al navegar o verificar por nombre.
    const cliente = `Rosa NoShow ${Cypress.currentRetry}`;

    cy.log('Creamos una cita de AYER: solo así se puede marcar como no asistida');
    slotLibre(ayer, '10:00').then((horario): void => {
      crearCitaViaApi(tenant, { fecha: ayer, horario, clienteNombre: cliente });
    });

    cy.log('La buscamos en el calendario y abrimos su detalle');
    abrirDetalle(cliente, 'Anterior');

    cy.log('El administrador la marca como "No asistió"');
    cy.contains('button', 'Marcar No Asistio').click();
    // El handler cierra el detalle al confirmar.
    cy.get('[role="dialog"]').should('not.exist');

    // Verificación de verdad: el estado vive en Postgres.
    cy.log('La base de datos confirma que el cambio quedó guardado');
    cy.request({
      method: 'GET',
      url: `${apiUrl()}/citas?fecha=${ayer}`,
      headers: apiHeaders(tenant),
    }).then((res) => {
      const body = res.body as {
        data: Array<{ clienteNombre: string; estado: string }>;
      };
      const cita = body.data.find((c) => c.clienteNombre === cliente);
      expect(cita?.estado).to.eq('NO_ASISTIO');
    });

    // La UI lo relee del backend al reabrir el detalle.
    cy.log('Al reabrir, la pantalla ya muestra el estado nuevo ("Marcar como Asistió")');
    cy.get('[aria-label="Detalles de la cita"]').should('not.exist');
    cy.contains(cliente).click();
    cy.get('[role="dialog"][aria-label="Detalles de la cita"]').should('be.visible');
    cy.contains('button', 'Marcar como Asistio').should('be.visible');
  });

  it('reprograma una cita a otro horario y persiste el cambio', (): void => {
    const cliente = `Pedro Repro ${Cypress.currentRetry}`;

    cy.log('Creamos una cita de MAÑANA para moverla a otra hora');
    slotLibre(manana, '09:00').then((horario): void => {
      crearCitaViaApi(tenant, { fecha: manana, horario, clienteNombre: cliente });
    });

    cy.log('Abrimos su detalle en el calendario');
    abrirDetalle(cliente, 'Siguiente');

    cy.log('En "Reprogramar" solo aparecen las horas que siguen libres');
    cy.contains('button', 'Reprogramar').click();
    // El detalle se cierra y abre el modal de reprogramación.
    cy.get('[role="dialog"][aria-label="Reprogramar Cita"]').should('be.visible');

    // 14:00 queda libre (la propia cita ocupa su slot preferido o el primero
    // libre, siempre anterior a las 14:00 en la grilla 08:00–18:00).
    cy.contains('button', '14:00').click();
    cy.log('Elegimos las 14:00 y confirmamos el cambio');
    cy.contains('button', 'Confirmar Cambio').click();
    cy.get('[role="dialog"]').should('not.exist');

    cy.log('La base de datos confirma: la cita ahora es a las 14:00');
    cy.request({
      method: 'GET',
      url: `${apiUrl()}/citas?fecha=${manana}`,
      headers: apiHeaders(tenant),
    }).then((res) => {
      const body = res.body as {
        data: Array<{ clienteNombre: string; horario: string; fecha: string }>;
      };
      const cita = body.data.find((c) => c.clienteNombre === cliente);
      expect(cita?.horario).to.eq('14:00');
      expect(cita?.fecha).to.include(manana);
    });
  });
});
