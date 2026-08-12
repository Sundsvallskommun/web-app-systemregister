describe("Authentication", () => {
  it("redirects to login when unauthenticated", () => {
    cy.visitAnonymous("/dashboard");
    cy.wait("@getMe");
    cy.location("pathname").should("eq", "/");
  });

  it("keeps an authenticated visitor on the requested page", () => {
    cy.visitAs("/dashboard", "admin");
    cy.wait("@getMe");
    cy.location("pathname").should("eq", "/dashboard");
    cy.contains("h1", "Dashboard").should("be.visible");
  });

  it("sends an already logged in visitor from the login page to the dashboard", () => {
    cy.visitAs("/", "viewer");
    cy.wait("@getMe");
    cy.location("pathname").should("eq", "/dashboard");
  });

  it("shows the initials from the IdP in the app bar", () => {
    // Stubben i visitAs loggar in "Test Testsson"
    cy.visitAs("/dashboard", "admin");
    cy.wait("@getMe");
    cy.get(".sk-avatar").contains("TT").should("be.visible");
  });

  it("falls back to the full name when the IdP sends no given/surname", () => {
    cy.intercept("GET", "**/api/me", {
      statusCode: 200,
      body: {
        data: {
          username: "kar01and",
          name: "Karin Andersson",
          givenName: "",
          surname: "",
          email: "karin.andersson@example.com",
          groups: ["systemregister_viewer"],
          role: "viewer",
        },
      },
    }).as("getMe");

    cy.visit("/dashboard");
    cy.wait("@getMe");
    cy.get(".sk-avatar").contains("KA").should("be.visible");
  });
});

describe("Login page", () => {
  beforeEach(() => {
    cy.visitAnonymous("/");
    cy.wait("@getMe");
  });

  it("shows the application header and an SSO login button", () => {
    cy.contains("Systemregistret").should("be.visible");
    cy.contains("button", "Logga in med SSO").should("be.visible");
    cy.get('input[type="password"]').should("not.exist");
  });

  it("starts the SSO flow against the BFF when the button is clicked", () => {
    // Stubba BFF:ens login-route så navigeringen inte lämnar testmiljön
    cy.intercept("GET", "**/api/saml/login*", {
      statusCode: 200,
      body: "sso",
    }).as("ssoLogin");

    cy.contains("button", "Logga in med SSO").click();

    cy.wait("@ssoLogin")
      .its("request.url")
      .should("include", "successRedirect=")
      .and("include", "%2Fdashboard");
  });

  it("shows an error message when the IdP rejected the login", () => {
    cy.visitAnonymous("/?failMessage=MISSING_PERMISSIONS");
    cy.wait("@getMe");

    cy.contains("Ditt konto saknar behörighet").should("be.visible");
    cy.location("pathname").should("eq", "/");
  });
});
