describe("Dashboard page", () => {
  it("redirects to login when unauthenticated", () => {
    cy.visit("/dashboard");
    cy.location("pathname").should("eq", "/");
  });

  it("shows summary cards with counters", () => {
    cy.visitAs("/dashboard", "admin");
    cy.wait("@getSystems");

    cy.contains("h1", "Dashboard").should("be.visible");

    cy.contains("System").should("be.visible");
    cy.contains("Organisationer").should("be.visible");
    cy.contains("GDPR-behandlingar").should("be.visible");
    cy.contains("AI-tillämpningar").should("be.visible");

    cy.contains(".text-h3", "3").should("be.visible");
  });

  it("lists the most recent systems", () => {
    cy.visitAs("/dashboard", "admin");
    cy.wait("@getSystems");

    cy.contains("Senaste system").should("be.visible");
    cy.contains("SYS-001").should("be.visible");
    cy.contains("Raindance").should("be.visible");
    cy.contains("I produktion").should("be.visible");
  });

  it("shows access description for the current role", () => {
    cy.visitAs("/dashboard", "viewer");
    cy.contains("Du har läsbehörighet för alla register.").should("be.visible");
  });
});
