// Conflicto de horario contra el backend real: el engine de disponibilidad
// resta los slots ocupados y `crearCitaAdmin` rechaza duplicados. Sin intercepts
// (ver ADR-013). cy.request sí se usa aquí: es el "otro admin" que compite por
// el mismo horario y el cliente HTTP de verificación — la UI nunca lo intercepta.

import { apiHeaders, apiUrl, crearCitaViaApi, type E2ETenant } from '../../support/realCommands';

describe('Citas — conflicto de horario con servidor', (): void => {
  const hoy = new Date();
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);
  const fmt = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const fecha = fmt(manana);

  let tenant: E2ETenant;

  before((): void => {
    cy.seedE2ETenant().then((t): void => {
      tenant = t;
    });
  });

  beforeEach((): void => {
    cy.loginReal(tenant.email, tenant.password);
  });

  it('deja de ofrecer en la UI un horario ya ocupado', (): void => {
    cy.log('Otro administrador ya reservó las 13:00 desde su propio equipo');
    crearCitaViaApi(tenant, { fecha, horario: '13:00', clienteNombre: 'Ocupada 13' });

    cy.log('Este administrador abre "Nueva Cita" para ese mismo día');
    cy.visit('/dashboard/calendario');
    cy.contains('button', 'Nueva Cita').click();
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('[role="dialog"] input[type="date"]').clear().type(fecha);

    // La disponibilidad la calcula el engine real sobre los datos de Postgres:
    // 13:00 ya no se ofrece; el resto del día sigue libre.
    cy.log('La hora ocupada ya no se ofrece; las demás siguen libres');
    cy.contains('button', '14:00').should('be.visible');
    cy.contains('button', '13:00').should('not.exist');
  });

  it('rechaza con el error real del backend al enviar un horario tomado en paralelo', (): void => {
    cy.log('El administrador llena una cita para mañana: las 11:00 se ven libres');
    cy.visit('/dashboard/calendario');
    cy.contains('button', 'Nueva Cita').click();
    cy.get('[role="dialog"]').should('be.visible');

    cy.get('input[placeholder="Ej: Juan Perez"]').type('Carrera Real');
    cy.get('input[placeholder="Ej: 591 70000000"]').type('70000001');
    cy.get('[role="dialog"] input[type="date"]').clear().type(fecha);
    cy.get('[role="dialog"] select').eq(0).select(String(tenant.servicioId));

    // La UI pide la disponibilidad ANTES de que exista la cita rival: 11:00 libre.
    cy.contains('button', '11:00').should('be.visible');

    // Mientras el modal está abierto, "otro admin" toma el mismo horario.
    // cy.request no pasa por cy.intercept, así que la grilla queda stale.
    cy.log('Mientras el formulario está abierto, OTRO administrador reserva esas 11:00');
    crearCitaViaApi(tenant, { fecha, horario: '11:00', clienteNombre: 'Rival 11' });

    cy.log('Él intenta guardar de todas formas y el servidor lo rechaza (error 400)');
    cy.contains('button', '11:00').click();
    cy.contains('button', 'Crear Cita').click();

    // El backend real responde 400 y el formulario muestra el motivo.
    cy.get('[role="dialog"]').should('be.visible');
    cy.log('La pantalla explica el motivo: esa hora ya no está disponible');
    cy.get('[role="dialog"]').contains('no está disponible').should('be.visible');

    // Solo quedó la cita del rival: el horario no se duplicó.
    cy.log('En la base de datos solo existe la cita del otro: no se duplicó');
    cy.request({
      method: 'GET',
      url: `${apiUrl()}/citas?fecha=${fecha}`,
      headers: apiHeaders(tenant),
    }).then((res) => {
      const body = res.body as { data: Array<{ horario: string }> };
      const enOnce = body.data.filter((c) => c.horario === '11:00');
      expect(enOnce).to.have.lengthOf(1);
    });
  });
});
