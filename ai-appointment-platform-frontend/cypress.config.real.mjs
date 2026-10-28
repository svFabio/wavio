import { defineConfig } from 'cypress';

// E2E suite con backend real — ver ADR-013.
//
// Specs en cypress/e2e/real/: sin cy.intercept, hablan con Postgres vía Nest.
// Requiere el stack levantado:
//   backend  → http://localhost:3000 (ver ADR-013 para la base E2E)
//   frontend → http://localhost:5173 (vite dev) o 4173 (preview en CI)
// Correr con `pnpm e2e:real`. La suite normal (cypress.config.mjs) excluye
// estos specs para seguir siendo independiente del backend.
//
// Mismo motivo que cypress.config.mjs para usar .mjs en vez de .ts.
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/real/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    fixturesFolder: 'cypress/fixtures',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    video: false,
    screenshotOnRunFailure: true,
    // Los timeouts son más holgados que en la suite con stubs: los requests
    // reales (register, engine de disponibilidad, Prisma) tardan más.
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    pageLoadTimeout: 30000,
    retries: {
      runMode: 1,
      openMode: 0,
    },
    blockHosts: ['accounts.google.com', 'www.google.com', 'connect.facebook.net'],
    env: {
      apiUrl: 'http://localhost:3000/api/v1',
    },
  },
});
