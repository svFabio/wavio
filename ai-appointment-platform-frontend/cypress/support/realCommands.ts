// Comandos para la suite E2E con backend real (ver ADR-013).
//
// A diferencia de commands.ts (specs con cy.intercept), estos commands hablan
// con el backend en vivo: registran un tenant real (usuario + negocio + horarios
// + servicio) y hacen login por el formulario. Sin stubs, sin fixtures.

export interface E2ETenant {
  email: string;
  password: string;
  token: string;
  negocioId: number;
  servicioId: number;
  servicioNombre: string;
}

const SERVICIO_NOMBRE = 'Corte E2E Real';

/** URL base del backend. Se configura vía `env.apiUrl` en cypress.config.real.mjs. */
export function apiUrl(): string {
  return (Cypress.env('apiUrl') as string | undefined) ?? 'http://localhost:3000/api/v1';
}

/**
 * Headers para llamadas directas al API (cy.request no hereda los headers que
 * la app agrega vía apiClient: Authorization y x-negocio-id).
 */
export function apiHeaders(tenant: Pick<E2ETenant, 'token' | 'negocioId'>): Record<string, string> {
  return {
    Authorization: `Bearer ${tenant.token}`,
    'x-negocio-id': String(tenant.negocioId),
  };
}

/**
 * Registra un tenant único (email con timestamp) y deja el entorno listo para
 * crear citas: horarios 08:00–18:00 los 7 días y un servicio de 60 min.
 * Debe llamarse en `before()`; el email único por corrida evita datos residuales.
 */
export function seedE2ETenant(): Cypress.Chainable<E2ETenant> {
  // Falla temprano y con mensaje claro si el backend no está corriendo.
  cy.request({ method: 'GET', url: `${apiUrl()}/health` });

  const email = `e2e-${Date.now()}-${Cypress._.random(0, 999999)}@wavio.test`;
  const password = 'E2e-password-1';

  return cy
    .request({
      method: 'POST',
      url: `${apiUrl()}/auth/register`,
      failOnStatusCode: false,
      body: { email, password },
    })
    .then((res) => {
      if (res.status !== 201) {
        throw new Error(
          `No se pudo registrar el tenant E2E (HTTP ${res.status}): ` +
            `${JSON.stringify(res.body)}. /auth/register tiene rate limit de 5/min por IP.`,
        );
      }
      const { token, negocios } = res.body as {
        token: string;
        negocios: Array<{ id: number }>;
      };
      const negocioId = negocios[0].id;
      const headers = apiHeaders({ token, negocioId });

      const horarios = Array.from({ length: 7 }, (_, diaSemana) => ({
        diaSemana,
        horaInicio: '08:00',
        horaFin: '18:00',
      }));

      return cy
        .request({
          method: 'PUT',
          url: `${apiUrl()}/horarios`,
          headers,
          body: { horarios },
        })
        .then(() =>
          cy.request({
            method: 'POST',
            url: `${apiUrl()}/servicios`,
            headers,
            body: { nombre: SERVICIO_NOMBRE, duracionMinutos: 60, precio: 50 },
          }),
        )
        .then((servicioRes) => {
          const tenant: E2ETenant = {
            email,
            password,
            token,
            negocioId,
            servicioId: (servicioRes.body as { id: number }).id,
            servicioNombre: SERVICIO_NOMBRE,
          };
          return cy.wrap(tenant);
        });
    });
}

/**
 * Login real por formulario, cacheado con cy.session entre tests del mismo spec.
 * Debe llamarse en `beforeEach()`: Cypress limpia localStorage entre tests y la
 * sesión restaurada reaplica token + activeNegocioId antes de que monte la app.
 */
export function loginReal(email: string, password: string): Cypress.Chainable<null> {
  cy.session(`real-${email}`, (): void => {
    cy.visit('/login');
    cy.get('#login-email').type(email);
    cy.get('#login-password').type(password);
    cy.get('form button[type="submit"]').click();
    // El login real redirige a /dashboard: valida credenciales contra el backend.
    cy.url().should('include', '/dashboard');
  });
  return cy.wrap(null);
}

/**
 * Crea una cita vía API contra el backend real. Papel: "otro admin" que compite
 * por un horario o seed de partida — acciones que la propia UI bajo test no
 * debe disparar (cy.request no pasa por cy.intercept, así que la UI no se
 * entera hasta su siguiente refetch).
 */
export function crearCitaViaApi(
  tenant: Pick<E2ETenant, 'token' | 'negocioId' | 'servicioId'>,
  params: { fecha: string; horario: string; clienteNombre: string },
): void {
  cy.request({
    method: 'POST',
    url: `${apiUrl()}/citas/admin`,
    headers: apiHeaders(tenant),
    body: {
      clienteNombre: params.clienteNombre,
      clienteTelefono: '70000000',
      fecha: params.fecha,
      horario: params.horario,
      servicioId: tenant.servicioId,
    },
  })
    .its('status')
    .should('eq', 201);
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Registra un tenant real + horarios + servicio. Llamar en `before()`. */
      seedE2ETenant(): Chainable<E2ETenant>;
      /** Login real por formulario con cy.session. Llamar en `beforeEach()`. */
      loginReal(email: string, password: string): Chainable<null>;
    }
  }
}

Cypress.Commands.add('seedE2ETenant', seedE2ETenant);
Cypress.Commands.add('loginReal', loginReal);
