/// <reference types="cypress" />
/// <reference types="@testing-library/cypress" />

describe("Autenticación - Inicio de sesión", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit("/login");
    cy.findByRole("heading", { name: /bienvenido de vuelta/i }).should("exist");
    // Asegura que el botón de enviar exista
    cy.findByRole("button", { name: /ingresar/i }).should("exist");
  });

  it("flujo exitoso: credenciales correctas redirige a /dashboard y guarda token", () => {
    cy.intercept("POST", "/api/auth/login", (req) => {
      expect(String(req.headers["content-type"] || "")).to.match(/application\/json/i);
      const body = typeof req.body === "string" ? JSON.parse(req.body as string) : (req.body as any);
      expect(body).to.have.property("email");
      expect(body).to.have.property("password");
      req.reply({
        statusCode: 200,
        body: {
          user: {
            id: "u1",
            name: "Alice",
            email: "alice@example.com",
            role: "developer",
          },
          token: "fake-token-123",
        },
      });
    }).as("login");

    cy.findByLabelText(/correo/i).type("alice@example.com");
    cy.findByLabelText(/contraseña/i).type("secret123");
    cy.findByRole("button", { name: /^ingresar$/i }).click();

    cy.wait("@login");

    // Token almacenado
    cy.window().then((win) => {
      expect(win.localStorage.getItem("taskflow_token")).to.eq("fake-token-123");
    });

    // Redirección a dashboard
    cy.location("pathname").should("eq", "/dashboard");

    // Toast de éxito (opcional, mostrado por AuthProvider)
    cy.assertToast("Sesión iniciada");
  });

  it("flujo fallido: credenciales incorrectas muestra error y permanece en /login", () => {
    cy.intercept("POST", "/api/auth/login", {
      statusCode: 401,
      body: { message: "Correo o contraseña incorrectos" },
    }).as("login-fail");

    cy.findByLabelText(/correo/i).type("alice@example.com");
    cy.findByLabelText(/contraseña/i).type("wrong12");
    cy.findByRole("button", { name: /^ingresar$/i }).click();

    cy.wait("@login-fail");

    // Permanece en login
    cy.location("pathname").should("eq", "/login");

    // Toast de error
    cy.assertToast("Credenciales inválidas");

    // No debe fijar token
    cy.window().then((win) => {
      expect(win.localStorage.getItem("taskflow_token")).to.be.null;
    });
  });
});
