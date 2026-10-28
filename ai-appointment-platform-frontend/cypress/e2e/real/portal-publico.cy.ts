// Portal público con backend real: link mágico, sin sesión de admin.
// Cubre la regresión del bug available-slots 500 (servicioId llegaba como
// string a Prisma) y el ciclo completo de solicitud desde el enlace.
// Requiere el stack levantado (ver ADR-013). Correr con `pnpm e2e:real`.

import { apiHeaders, apiUrl, type E2ETenant } from '../../support/realCommands';

describe('Portal público — agendar con servidor', (): void => {
  const hoy = new Date();
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);
  const fmt = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const fecha = fmt(manana);

  let tenant: E2ETenant;
  let token: string;

  before((): void => {
    cy.seedE2ETenant().then((t): void => {
      tenant = t;
      // Hoy la generación del enlace no tiene UI (GenerateLinkButton es código
      // muerto): se crea el cliente y el link por la API pública autenticada.
      cy.request({
        method: 'POST',
        url: `${apiUrl()}/clientes`,
        headers: apiHeaders(tenant),
        body: { nombre: 'Ana Portal', telefono: '70000002' },
      }).then((clienteRes): void => {
        const clienteId = (clienteRes.body as { id: number }).id;
        cy.request({
          method: 'POST',
          url: `${apiUrl()}/portal/generate/${clienteId}`,
          headers: apiHeaders(tenant),
        }).then((linkRes): void => {
          token = (linkRes.body as { token: string }).token;
        });
      });
    });
  });

  it('agenda desde el enlace y la solicitud queda PENDIENTE en el negocio', (): void => {
    cy.log('El cliente abre su enlace privado, sin iniciar sesión en ninguna cuenta');
    cy.visit(`/portal/${token}`);

    // El backend valida el token: sin sesión de admin, solo con el enlace.
    cy.contains('Hola Ana Portal, bienvenido a tu portal de citas.').should('be.visible');
    cy.contains('Agendar Nueva Cita').should('be.visible');

    cy.log('El portal carga la información real de su negocio');
    cy.get('#fecha').type(fecha);
    // El value de cada <option> es el id real del servicio sembrado.
    cy.get('#servicio').select(String(tenant.servicioId));

    // Regresión del bug: available-slots se pide CON servicioId. Antes del fix
    // el endpoint respondía 500 y jamás aparecería ningún horario.
    cy.log('Aquí se cargan las horas disponibles — este paso tenía un bug ya corregido');
    cy.contains('button', '10:00').should('be.visible').click();
    cy.log('Elige hora y confirma: la cita queda PENDIENTE de aprobación');
    cy.contains('button', 'Confirmar Cita').click();

    cy.contains('Cita agendada exitosamente. Espera confirmación del negocio.').should(
      'be.visible',
    );

    // Verificación de verdad: la solicitud vive en Postgres como PENDIENTE.
    cy.log('La base de datos la registró como pendiente de confirmación');
    cy.request({
      method: 'GET',
      url: `${apiUrl()}/citas?fecha=${fecha}`,
      headers: apiHeaders(tenant),
    }).then((res): void => {
      const body = res.body as {
        data: Array<{ clienteNombre: string; horario: string; estado: string }>;
      };
      expect(body.data).to.have.lengthOf(1);
      expect(body.data[0]).to.include({
        clienteNombre: 'Ana Portal',
        horario: '10:00',
        estado: 'PENDIENTE',
      });
    });

    // La mutación de booking no invalida ['portal','citas']: recargar es la
    // única forma de ver "Mis Citas" al día (bug conocido, ver ADR-013).
    cy.log('Recargamos la página para ver la sección "Mis Citas"');
    cy.reload();
    cy.contains('Mis Citas').should('be.visible');
    cy.contains('PENDIENTE').should('be.visible');
  });

  it('muestra enlace inválido con un token inexistente', (): void => {
    cy.log('Un enlace inventado no da acceso: el servidor lo rechaza');
    cy.visit('/portal/token-inexistente-123');
    cy.contains('h1', 'Enlace invalido').should('be.visible');
    cy.contains('Este enlace no es valido o ha expirado.').should('be.visible');
  });
});
