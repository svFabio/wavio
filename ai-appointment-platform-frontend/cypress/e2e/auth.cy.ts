import { logA11yViolations } from '../support/commands';

describe('Auth — login con email', (): void => {
  beforeEach((): void => {
    cy.visit('/login');
  });

  it('muestra el formulario de acceso', (): void => {
    cy.get('#login-email').should('be.visible');
    cy.get('#login-password').should('be.visible');
    // Hay dos botones "Iniciar sesion" (tab + submit): el submit es el único
    // type="submit" dentro del formulario.
    cy.get('form button[type="submit"]').should('be.visible');
    cy.injectAxe();
    cy.checkA11y(undefined, undefined, logA11yViolations);
  });

  it('inicia sesion y navega al dashboard', (): void => {
    cy.intercept('POST', '**/api/v1/auth/login', { fixture: 'auth-session.json' }).as('login');
    cy.intercept('GET', '**/api/v1/auth/me', { fixture: 'auth-session.json' }).as('authMe');

    cy.get('#login-email').type('admin-e2e@wavio.test');
    cy.get('#login-password').type('password-e2e-seguro');
    cy.get('form button[type="submit"]').click();

    cy.wait('@login');
    cy.url().should('include', '/dashboard');
  });

  it('muestra error con credenciales invalidas y no navega', (): void => {
    cy.intercept('POST', '**/api/v1/auth/login', {
      statusCode: 401,
      body: { error: 'Credenciales incorrectas' },
    }).as('loginFail');

    cy.get('#login-email').type('nadie@wavio.test');
    cy.get('#login-password').type('incorrecta');
    cy.get('form button[type="submit"]').click();

    cy.wait('@loginFail');
    cy.contains('Credenciales incorrectas').should('be.visible');
    cy.url().should('include', '/login');
  });
});
