import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Cleanup DOM after each test and restore mocks
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Avoid Next.js router side effects in tests
vi.mock("next/navigation", () => {
  return {
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    }),
  };
});

// Silence toast calls during tests
vi.mock("@/lib/toast", () => {
  return {
    toast: {
      success: vi.fn(),
      info: vi.fn(),
      destructive: vi.fn(),
    },
  };
});
