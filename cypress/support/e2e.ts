/// <reference types="cypress" />
/// <reference types="@testing-library/cypress" />

// Load custom commands (includes Testing Library commands)
import "./commands";

// Global Cypress setup for all e2e tests
beforeEach(() => {
  cy.clearLocalStorage();
});
