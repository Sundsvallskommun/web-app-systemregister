describe("Risks page", () => {
  it("redirects to login when unauthenticated", () => {
    cy.visit("/risks");
    cy.location("pathname").should("eq", "/");
  });

  it("lists current risks", () => {
    cy.visitAs("/risks", "admin");

    cy.contains("h1", "Riskanalys").should("be.visible");
    cy.contains("Otillräcklig backup för Treserva").should("be.visible");
    cy.contains("Saknad MFA för ByggR").should("be.visible");
    cy.contains("SYS-003").should("be.visible");
    cy.contains("SYS-002").should("be.visible");
  });

  it("deletes a risk row", () => {
    cy.visitAs("/risks", "admin");

    cy.get(
      'button[aria-label="Ta bort Otillräcklig backup för Treserva"]',
    ).click();
    cy.contains("Otillräcklig backup för Treserva").should("not.exist");
    cy.contains("Saknad MFA för ByggR").should("be.visible");
  });

  it("opens the new risk dialog for editors and admins", () => {
    cy.visitAs("/risks", "admin");

    cy.contains("button", "Ny risk").click();
    cy.get(".sk-modal-wrapper").within(() => {
      cy.contains("Ny risk").should("be.visible");
      cy.contains("button", "Skapa").should("be.visible");
    });
  });

  it("hides editing controls for viewers", () => {
    cy.visitAs("/risks", "viewer");

    cy.contains("button", "Ny risk").should("not.exist");
    cy.get('button[aria-label="Ta bort Saknad MFA för ByggR"]').should(
      "not.exist",
    );
  });
});
