describe("Systems page", () => {
  it("redirects to login when unauthenticated", () => {
    cy.visit("/systems");
    cy.location("pathname").should("eq", "/");
  });

  it("lists systems from the API", () => {
    cy.visitAs("/systems", "admin");
    cy.wait("@getSystems");

    cy.contains("h1", "System").should("be.visible");
    cy.contains("SYS-001").should("be.visible");
    cy.contains("Raindance").should("be.visible");
    cy.contains("ByggR").should("be.visible");
    cy.contains("Treserva").should("be.visible");
    cy.contains("I produktion").should("be.visible");
    cy.contains("Moln").should("be.visible");
  });

  it("filters the table with the search field", () => {
    cy.visitAs("/systems", "admin");
    cy.wait("@getSystems");

    cy.get('input[placeholder="Sök system..."]').type("ByggR");
    cy.contains("ByggR").should("be.visible");
    cy.contains("Raindance").should("not.exist");
    cy.contains("Treserva").should("not.exist");
  });

  it("shows an empty state when there are no systems", () => {
    cy.intercept("GET", "**/api/systems*", {
      body: { data: [], total: 0, page: 1, pages: 0 },
    }).as("getEmptySystems");
    cy.visitAs("/systems", "admin");
    cy.wait("@getEmptySystems");

    cy.contains("Inga system hittades").should("be.visible");
  });

  it("opens the details dialog when viewing a system", () => {
    cy.visitAs("/systems", "admin");
    cy.wait("@getSystems");

    cy.get('button[aria-label="Visa Raindance"]').click();
    cy.get(".sk-modal-wrapper").within(() => {
      cy.contains("System-ID:").should("be.visible");
      cy.contains("SYS-001").should("be.visible");
      cy.contains("Ekonomiavdelningen").should("be.visible");
    });
    cy.get(".sk-modal-wrapper").contains("button", "Stäng").click();
    cy.get(".sk-modal-wrapper").should("not.exist");
  });

  it("opens the create dialog for editors and admins", () => {
    cy.visitAs("/systems", "admin");
    cy.wait("@getSystems");

    cy.contains("button", "Nytt system").click();
    cy.wait(["@getOrganizations", "@getPersons", "@getSuppliers"]);
    cy.get(".sk-modal-wrapper").within(() => {
      cy.contains("Nytt system").should("be.visible");
      cy.contains("button", "Skapa").should("be.visible");
    });
    cy.get(".sk-modal-wrapper").contains("button", "Avbryt").click();
    cy.get(".sk-modal-wrapper").should("not.exist");
  });

  it("hides editing controls for viewers", () => {
    cy.visitAs("/systems", "viewer");
    cy.wait("@getSystems");

    cy.contains("button", "Nytt system").should("not.exist");
    cy.get('button[aria-label="Redigera Raindance"]').should("not.exist");
    
    cy.get('button[aria-label="Visa Raindance"]').should("be.visible");
  });
});
