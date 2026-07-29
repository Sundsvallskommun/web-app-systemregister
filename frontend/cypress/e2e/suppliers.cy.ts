describe("Suppliers page", () => {
  it("lists suppliers with info and status", () => {
    cy.visitAs("/suppliers", "admin");
    cy.wait("@getSuppliers");

    cy.contains("h1", "Leverantörer & Avtal").should("be.visible");
    cy.contains("TechSys AB").should("be.visible");
    cy.contains("Kommunbygg IT").should("be.visible");
    cy.contains("Aktiv").should("be.visible");
    cy.contains("Inaktiv").should("be.visible");
  });

  it("filters the table with the search field", () => {
    cy.visitAs("/suppliers", "admin");
    cy.wait("@getSuppliers");

    cy.get('input[placeholder="Sök leverantör..."]').type("Kommunbygg");
    cy.contains("Kommunbygg IT").should("be.visible");
    cy.contains("TechSys AB").should("not.exist");
  });

  it("shows an empty state when there are no suppliers", () => {
    cy.intercept("GET", "**/api/suppliers*", { body: [] }).as(
      "getEmptySuppliers",
    );
    cy.visitAs("/suppliers", "admin");
    cy.wait("@getEmptySuppliers");

    cy.contains("Inga leverantörer hittades").should("be.visible");
  });

  it("opens the details dialog when viewing a supplier", () => {
    cy.visitAs("/suppliers", "admin");
    cy.wait("@getSuppliers");

    cy.get('button[aria-label="Visa TechSys AB"]').click();
    cy.get(".sk-modal-wrapper").within(() => {
      cy.contains("556123-4567").should("be.visible");
      cy.contains("kontakt@techsys.example.se").should("be.visible");
    });
    cy.get(".sk-modal-wrapper").contains("button", "Stäng").click();
    cy.get(".sk-modal-wrapper").should("not.exist");
  });

  it("opens the create dialog for editors and admins", () => {
    cy.visitAs("/suppliers", "editor");
    cy.wait("@getSuppliers");

    cy.contains("button", "Ny leverantör").click();
    cy.get(".sk-modal-wrapper").within(() => {
      cy.contains("Ny leverantör").should("be.visible");
      cy.contains("button", "Skapa").should("be.visible");
    });
  });

  it("hides editing controls for viewers", () => {
    cy.visitAs("/suppliers", "viewer");
    cy.wait("@getSuppliers");

    cy.contains("button", "Ny leverantör").should("not.exist");
    cy.get('button[aria-label="Redigera TechSys AB"]').should("not.exist");
  });
});
