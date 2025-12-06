/// <reference types="cypress" />

// Add Testing Library commands (findBy*, getBy*, etc.)
import "@testing-library/cypress/add-commands";

// Type augmentation for our custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Assert a Sonner toast is visible containing provided text.
       * @example cy.assertToast("Sesión iniciada")
       */
      assertToast(text: string): Chainable<JQuery<HTMLElement>>;
    }
  }
}

// Implement custom commands
Cypress.Commands.add("assertToast", (text: string) => {
  cy.findByText(text, { timeout: 4000 }).should("be.visible");
});
