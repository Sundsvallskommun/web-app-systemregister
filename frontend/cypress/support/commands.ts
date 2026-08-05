/// <reference types="cypress" />
// ***********************************************
// Custom commands for the systemregister frontend.
// See https://on.cypress.io/custom-commands
// ***********************************************

export type Role = "admin" | "editor" | "viewer";

const GROUP_PREFIX = "systemregister_";

/**
 * Inloggning sker med SSO mot BFF:en och sessionen läses via GET /api/me.
 * I testerna stubbar vi det svaret istället för att köra ett riktigt SAML-flöde.
 */
Cypress.Commands.add(
  "visitAs",
  (path: string, role: Role = "admin", username = "testuser") => {
    cy.intercept("GET", "**/api/me", {
      statusCode: 200,
      body: {
        data: {
          username,
          name: "Test Testsson",
          givenName: "Test",
          surname: "Testsson",
          email: `${username}@example.com`,
          groups: [`${GROUP_PREFIX}${role}`],
          role,
        },
      },
    }).as("getMe");

    cy.visit(path);
  },
);

/** Simulerar en utloggad besökare — /api/me svarar 401. */
Cypress.Commands.add("visitAnonymous", (path: string) => {
  cy.intercept("GET", "**/api/me", {
    statusCode: 401,
    body: { message: "NOT_AUTHENTICATED" },
  }).as("getMe");

  cy.visit(path);
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      visitAs(path: string, role?: Role, username?: string): Chainable<void>;
      visitAnonymous(path: string): Chainable<void>;
    }
  }
}

export {};
