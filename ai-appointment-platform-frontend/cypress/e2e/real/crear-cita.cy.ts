// Flujo real de principio a fin: backend vivo (Postgres + Nest), sin
// cy.intercept. Requiere el stack levantado (ver ADR-013): backend en :3000,
// frontend en :5173 y la base E2E. Correr con `pnpm e2e:real`.

import { apiHeaders, apiUrl, type E2ETenant } from '../../support/realCommands';

describe('Citas — crear cita con servidor', (): void => {
  // Mañana, no hoy: el engine de disponibilidad filtra los slots pasados
  // cuando la fecha es la de hoy, lo que haría flaky cualquier horario fijo.
  const hoy = new Date();
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);
  const fmt = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const fecha = fmt(manana);
  const mananaEnOtroMes =
    manana.getMonth() !== hoy.getMonth() || manana.getFullYear() !== hoy.getFullYear();

  let tenant: E2ETenant;

  before((): void => {
    cy.log('Preparación: creamos un negocio de prueba (usuario, horario y servicio)');
    cy.seedE2ETenant().then((t): void => {
      tenant = t;
    });
  });

  beforeEach((): void => {
    cy.loginReal(tenant.email, tenant.password);
  });

  it('crea una cita desde el calendario y queda persistida en el backend', (): void => {
    cy.log('Abrimos el calendario del negocio, igual que en la app real');
    cy.visit('/dashboard/calendario');
    cy.contains('button', 'Nueva Cita').click();
    cy.get('[role="dialog"]').should('be.visible');

    cy.log('Llenamos la cita: cliente, teléfono, fecha y tipo de servicio');
    cy.get('input[placeholder="Ej: Juan Perez"]').type('Ana Real');
    cy.get('input[placeholder="Ej: 591 70000000"]').type('70000000');
    cy.get('[role="dialog"] input[type="date"]').clear().type(fecha);
    // El value de cada <option> es el id real del servicio sembrado.
    cy.get('[role="dialog"] select').eq(0).select(String(tenant.servicioId));

    // Los horarios vienen del engine real: esperar a que carguen los de mañana.
    cy.log('El servidor calcula qué horas están libres para ese día');
    cy.contains('button', '09:00').should('be.visible').click();
    cy.log('Elegimos una hora y guardamos: el servidor la registra en la base de datos');
    cy.contains('button', 'Crear Cita').click();

    // El modal solo se cierra si el backend respondió éxito.
    cy.get('[role="dialog"]').should('not.exist');

    // Verificación de verdad: la cita vive en Postgres, no solo en la UI.
    cy.log('Comprobamos directo en la base de datos: la cita quedó guardada');
    cy.request({
      method: 'GET',
      url: `${apiUrl()}/citas?fecha=${fecha}`,
      headers: apiHeaders(tenant),
    }).then((res) => {
      const body = res.body as {
        data: Array<{ clienteNombre: string; horario: string }>;
      };
      expect(body.data).to.have.lengthOf(1);
      expect(body.data[0]).to.include({
        clienteNombre: 'Ana Real',
        horario: '09:00',
      });
    });

    // Resumen del mes en la UI: la mutación invalida ['citas'] y refetchea.
    cy.log('La pantalla se actualiza y muestra la nueva cita en el calendario');
    if (mananaEnOtroMes) {
      cy.get('[aria-label="Siguiente"]').click();
    }
    cy.contains('1 cita').should('be.visible');
  });
});
