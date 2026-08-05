describe("AI applications page", () => {
  it("lists AI applications", () => {
    cy.visitAs("/ai", "admin");
    cy.wait("@getAi");

    cy.contains("h1", "AI-tillämpningar").should("be.visible");
    cy.contains("AI-001").should("be.visible");
    cy.contains("Ärendeklassificering").should("be.visible");
    cy.contains("Hög risk").should("be.visible");
    cy.contains("Klar").should("be.visible");
  });

  it("shows an empty state when there are no applications", () => {
    cy.intercept("GET", "**/api/ai*", { body: [] }).as("getEmptyAi");
    cy.visitAs("/ai", "admin");
    cy.wait("@getEmptyAi");

    cy.contains("Inga AI-tillämpningar hittades").should("be.visible");
  });

  it("opens the details dialog when viewing an application", () => {
    cy.visitAs("/ai", "admin");
    cy.wait("@getAi");

    cy.get('button[aria-label="Visa Ärendeklassificering"]').click();
    cy.get(".sk-modal-wrapper").within(() => {
      cy.contains("AI-ID:").should("be.visible");
      cy.contains("AI-001").should("be.visible");
      cy.contains("SYS-001 — Raindance").should("be.visible");
    });
    cy.get(".sk-modal-wrapper").contains("button", "Stäng").click();
    cy.get(".sk-modal-wrapper").should("not.exist");
  });

  it("hides the new application button for viewers", () => {
    cy.visitAs("/ai", "viewer");
    cy.wait("@getAi");
    cy.contains("button", "Ny AI-tillämpning").should("not.exist");
  });
});
