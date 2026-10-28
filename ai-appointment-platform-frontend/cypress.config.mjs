import { defineConfig } from 'cypress';

// E2E suite — ver ADR-011. Los specs usan cy.intercept contra **/api/v1/*,
// por lo que no requieren backend real: basta con `vite dev` o `vite preview`.
// Los specs con backend real viven en cypress/e2e/real/ y se seleccionan por
// script: `pnpm e2e` corre solo los stubs (glob cypress/e2e/*.cy.ts, que no
// cruza subcarpetas) y `pnpm e2e:real` los reales (ver ADR-013). Sin
// excludeSpecPattern para que `pnpm cy:open` muestre TODOS los specs.
//
// Nota: el archivo es .mjs y no .ts porque el loader TS de Cypress no resuelve
// el tsconfig solution-style del proyecto y compila la config como CJS,
// lo que rompe con `"type": "module"`. Los specs y support siguen en TS.
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    fixturesFolder: 'cypress/fixtures',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 8000,
    requestTimeout: 8000,
    responseTimeout: 20000,
    pageLoadTimeout: 30000,
    retries: {
      runMode: 1,
      openMode: 0,
    },
    // El login con Google carga scripts de GIS que no aportan a los flujos
    // cubiertos (email + portal + calendario) y meten flakiness en CI.
    // El SDK de Facebook (Vincular) se bloquea por la misma razón.
    blockHosts: ['accounts.google.com', 'www.google.com', 'connect.facebook.net'],
  },
});
