describe("Classifications (K/R/T) page", () => {
  it("lists systems with their K/R/T assessment", () => {
    cy.visitAs("/classifications", "admin");
    cy.wait("@getSystems");

    cy.contains("h1", "Informationssäkerhetsklass").should(
      "be.visible",
    );
    cy.contains("SYS-001").should("be.visible");
    cy.contains("Raindance").should("be.visible");

    cy.contains("tr", "SYS-001")
      .find("[data-cy=business-critical]")
      .should("have.text", "Ja");
    cy.contains("tr", "SYS-003")
      .find("[data-cy=business-critical]")
      .should("have.text", "Nej");

    cy.contains("tr", "SYS-003")
      .find("[data-cy=assessment]")
      .should("contain.text", "Medium");
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
