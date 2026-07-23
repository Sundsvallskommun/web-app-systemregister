/// <reference types="cypress" />
// ***********************************************
// Custom commands for the systemregister frontend.
// See https://on.cypress.io/custom-commands
// ***********************************************

export type Role = "admin" | "editor" | "viewer";

Cypress.Commands.add(
  "visitAs",
  (path: string, role: Role = "admin", username = "testuser") => {
    cy.visit(path, {
      onBeforeLoad(win) {
        win.sessionStorage.setItem(
          "auth",
          JSON.stringify({ token: "test-token", role, username }),
        );
      },
    });
  },
);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      visitAs(path: string, role?: Role, username?: string): Chainable<void>;
    }
  }
}

export {};
