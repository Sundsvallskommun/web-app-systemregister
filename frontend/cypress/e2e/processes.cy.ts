describe("Processes page", () => {
  it("redirects to login when unauthenticated", () => {
    cy.visit("/processes");
    cy.location("pathname").should("eq", "/");
  });

  it("lists systems and the KLASSA note", () => {
    cy.visitAs("/processes", "admin");
    cy.wait("@getSystems");

    cy.contains("h1", "Verksamhetsprocesser").should("be.visible");
    cy.contains("SYS-001").should("be.visible");
    cy.contains("Raindance").should("be.visible");
    cy.contains("Ekonomiavdelningen").should("be.visible");
    cy.contains("KLASSA 2.1-hierarkin").should("be.visible");
  });

  it("shows an empty state when there are no systems", () => {
    cy.intercept("GET", "**/api/systems*", {
      body: { data: [], total: 0, page: 1, pages: 0 },
    }).as("getEmptySystems");
    cy.visitAs("/processes", "admin");
    cy.wait("@getEmptySystems");

    cy.contains("Inga system hittades").should("be.visible");
  });
});
