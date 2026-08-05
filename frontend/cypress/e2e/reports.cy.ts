describe("Reports page", () => {
  it("lists the available report cards", () => {
    cy.visitAs("/reports", "admin");
    cy.wait("@getSystems");

    cy.contains("h1", "Rapporter").should("be.visible");
    cy.contains("Systemöversikt").should("be.visible");
    cy.contains("Leverantörsrapport").should("be.visible");
    cy.contains("Riskanalys-sammanställning").should("be.visible");
    cy.contains("Kontinuitetsplan").should("be.visible");

    cy.get("button").contains("Skriv ut").should("be.visible");
    cy.get("button").contains("Exportera").should("be.visible");
  });
});
