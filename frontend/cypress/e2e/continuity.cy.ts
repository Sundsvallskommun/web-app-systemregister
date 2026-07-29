describe("Continuity page", () => {
  it("lists systems with criticality assessments", () => {
    cy.visitAs("/continuity", "admin");
    cy.wait("@getSystems");

    cy.contains("h1", "Kontinuitet & Återställning").should("be.visible");
    cy.contains("Verksamhetskritiskt").should("be.visible");
    cy.contains("Samhällsviktigt").should("be.visible");

    cy.contains("ByggR")
      .closest("tr")
      .within(() => {
        cy.contains("Ja").should("exist");
      });
  });

  it("shows an empty state when there are no systems", () => {
    cy.intercept("GET", "**/api/systems*", {
      body: { data: [], total: 0, page: 1, pages: 0 },
    }).as("getEmptySystems");
    cy.visitAs("/continuity", "admin");
    cy.wait("@getEmptySystems");

    cy.contains("Inga system hittades").should("be.visible");
  });
});
