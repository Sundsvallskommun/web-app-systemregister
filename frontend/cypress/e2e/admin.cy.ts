describe("Admin page", () => {
  it("redirects to login when unauthenticated", () => {
    cy.visit("/admin");
    cy.location("pathname").should("eq", "/");
  });

  it("blocks non-admin users", () => {
    cy.visitAs("/admin", "editor");
    cy.contains("Du har inte behörighet för denna sida.").should("be.visible");
    cy.contains("redaktor").should("not.exist");
  });

  it("shows the admin navigation item only for admins", () => {
    cy.visitAs("/dashboard", "admin");
    cy.contains("a", "Administration").should("exist");

    cy.visitAs("/dashboard", "viewer");
    cy.contains("a", "Administration").should("not.exist");
  });
});
