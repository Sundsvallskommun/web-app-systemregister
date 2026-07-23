describe("GDPR page", () => {
  it("redirects to login when unauthenticated", () => {
    cy.visit("/gdpr");
    cy.location("pathname").should("eq", "/");
  });

  it("lists GDPR treatments", () => {
    cy.visitAs("/gdpr", "admin");
    cy.wait("@getGdpr");

    cy.contains("h1", "GDPR-behandlingar").should("be.visible");
    cy.contains("PUB-001").should("be.visible");
    cy.contains("Löneadministration").should("be.visible");
    cy.contains("Rättslig förpliktelse").should("be.visible");
    cy.contains("Aktiv").should("be.visible");
  });

  it("shows an empty state when there are no treatments", () => {
    cy.intercept("GET", "**/api/gdpr*", { body: [] }).as("getEmptyGdpr");
    cy.visitAs("/gdpr", "admin");
    cy.wait("@getEmptyGdpr");

    cy.contains("Inga behandlingar hittades").should("be.visible");
  });

  it("opens the details dialog when viewing a treatment", () => {
    cy.visitAs("/gdpr", "admin");
    cy.wait("@getGdpr");

    cy.get('button[aria-label="Visa Löneadministration"]').click();
    cy.get(".sk-modal-wrapper").within(() => {
      cy.contains("Behandlings-ID:").should("be.visible");
      cy.contains("PUB-001").should("be.visible");
      cy.contains("Kopplade system").should("be.visible");
      cy.contains("SYS-001 — Raindance").should("be.visible");
    });
    cy.get(".sk-modal-wrapper").contains("button", "Stäng").click();
    cy.get(".sk-modal-wrapper").should("not.exist");
  });

  it("shows the new treatment button for editors and admins", () => {
    cy.visitAs("/gdpr", "editor");
    cy.wait("@getGdpr");
    cy.contains("button", "Ny behandling").should("be.visible");
  });

  it("hides the new treatment button for viewers", () => {
    cy.visitAs("/gdpr", "viewer");
    cy.wait("@getGdpr");
    cy.contains("button", "Ny behandling").should("not.exist");
  });
});
