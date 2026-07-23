describe("Classifications (K/R/T) page", () => {
  it("redirects to login when unauthenticated", () => {
    cy.visit("/classifications");
    cy.location("pathname").should("eq", "/");
  });

  it("lists systems with their K/R/T assessment", () => {
    cy.visitAs("/classifications", "admin");
    cy.wait("@getSystems");

    cy.contains("h1", "Informationssäkerhetsklass (K/R/T)").should(
      "be.visible",
    );
    cy.contains("SYS-001").should("be.visible");
    cy.contains("Raindance").should("be.visible");

    cy.contains("Verksamhetskritiskt").should("be.visible");
    cy.contains("Medium").should("be.visible");
  });

  it("shows an empty state when there are no systems", () => {
    cy.intercept("GET", "**/api/systems*", {
      body: { data: [], total: 0, page: 1, pages: 0 },
    }).as("getEmptySystems");
    cy.visitAs("/classifications", "admin");
    cy.wait("@getEmptySystems");

    cy.contains("Inga system hittades").should("be.visible");
  });
});
