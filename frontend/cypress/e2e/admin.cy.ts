describe("Admin page", () => {
  it("blocks non-admin users", () => {
    cy.visitAs("/admin", "editor");
    cy.contains("Du har inte behörighet för denna sida.").should("be.visible");
  });

  it("shows the admin navigation item only for admins", () => {
    cy.visitAs("/dashboard", "admin");
    cy.contains("a", "Administration").should("exist");

    cy.visitAs("/dashboard", "viewer");
    cy.contains("a", "Administration").should("not.exist");
  });
});
