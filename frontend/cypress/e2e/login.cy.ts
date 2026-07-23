describe("Login page", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("shows the application header and login form", () => {
    cy.contains("Systemregistret").should("be.visible");
    cy.contains("Användarnamn").should("be.visible");
    cy.contains("Lösenord").should("be.visible");
    cy.get("button[type=submit]").should("contain.text", "Logga in");
  });

  it("logs in with valid credentials and redirects to the dashboard", () => {
    cy.intercept("POST", "**/api/auth/login", {
      statusCode: 200,
      body: {
        accessToken: "test-token",
        refreshToken: "test-refresh",
        role: "admin",
        expiresIn: 3600,
      },
    }).as("login");

    cy.get("form").find("input").first().type("admin");
    cy.get('input[type="password"]').type("password123");
    cy.get("button[type=submit]").click();

    cy.wait("@login");
    cy.location("pathname").should("eq", "/dashboard");
    cy.contains("h1", "Dashboard").should("be.visible");
  });

  it("shows an error message when the credentials are rejected", () => {
    cy.intercept("POST", "**/api/auth/login", {
      statusCode: 400,
      body: { error: "Fel användarnamn eller lösenord" },
    }).as("login");

    cy.get("form").find("input").first().type("admin");
    cy.get('input[type="password"]').type("wrong");
    cy.get("button[type=submit]").click();

    cy.wait("@login");
    cy.contains("Fel användarnamn eller lösenord").should("be.visible");
    cy.location("pathname").should("eq", "/");
  });
});
