// ***********************************************************
// This support file is processed and loaded automatically
// before your test files.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import "./commands";

beforeEach(() => {
  cy.intercept("GET", "**/api/systems*", { fixture: "systems.json" }).as(
    "getSystems",
  );
  cy.intercept("GET", "**/api/organizations*", {
    fixture: "organizations.json",
  }).as("getOrganizations");
  cy.intercept("GET", "**/api/suppliers*", { fixture: "suppliers.json" }).as(
    "getSuppliers",
  );
  cy.intercept("GET", "**/api/persons*", { fixture: "persons.json" }).as(
    "getPersons",
  );
  cy.intercept("GET", "**/api/gdpr*", { fixture: "gdpr.json" }).as("getGdpr");
  cy.intercept("GET", "**/api/ai*", { fixture: "ai.json" }).as("getAi");

  cy.viewport("macbook-16");
});
