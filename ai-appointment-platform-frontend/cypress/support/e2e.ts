import './commands';
import 'cypress-axe';

// Los scripts de Google Identity Services pueden fallar en CI (bloqueados
// por `blockHosts` en cypress.config.ts). Solo se ignoran esos errores;
// cualquier otro uncaught exception sigue fallando el spec.
Cypress.on('uncaught:exception', (err: Error): boolean => {
  if (/google|gapi|GSI/i.test(err.message)) {
    return false;
  }
  return true;
});
