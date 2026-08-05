describe("Notifications page", () => {
  it("lists notifications and the unread count", () => {
    cy.visitAs("/notifications", "admin");

    cy.contains("h1", "Notifieringar").should("be.visible");
    cy.contains("2 olästa").should("be.visible");
    cy.contains("Avtal med TechSys AB går ut").should("be.visible");
    cy.contains("Saknad MFA för ByggR").should("be.visible");
  });

  it("marks all notifications as read", () => {
    cy.visitAs("/notifications", "admin");

    cy.contains("2 olästa").should("be.visible");
    cy.contains("button", "Markera alla som lästa").click();
    cy.contains("olästa").should("not.exist");
  });

  it("dismisses a notification", () => {
    cy.visitAs("/notifications", "admin");

    cy.get('button[aria-label="Ta bort Avtal med TechSys AB går ut"]').click();
    cy.contains("Avtal med TechSys AB går ut").should("not.exist");
    cy.contains("Saknad MFA för ByggR").should("be.visible");
  });
});
