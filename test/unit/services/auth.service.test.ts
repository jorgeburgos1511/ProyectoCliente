import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  loginWithCredentials,
  registerAccount,
  loginWithGoogleAuthCode,
  setAuthToken,
  getAuthToken,
} from "@/services/api/auth.service";

const originalFetch = global.fetch;

describe("auth.service", () => {
  beforeEach(() => {
    // jsdom provides localStorage in test env
    localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch as any;
  });

  it("setAuthToken and getAuthToken store and read tokens", () => {
    expect(getAuthToken()).toBeNull();
    setAuthToken("abc123");
    expect(getAuthToken()).toBe("abc123");
    setAuthToken(null);
    expect(getAuthToken()).toBeNull();
  });

  it("loginWithCredentials stores token and returns data on success", async () => {
    const mockResponse = {
      user: { id: "u1", name: "Alice", email: "a@a.com", role: "developer" },
      token: "token123",
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const res = await loginWithCredentials("a@a.com", "secret1");
    expect(res).toEqual(mockResponse);
    expect(getAuthToken()).toBe("token123");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/auth\/login$/),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "a@a.com", password: "secret1" }),
      })
    );
  });

  it("loginWithCredentials throws on invalid credentials", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    await expect(loginWithCredentials("a@a.com", "bad")).rejects.toThrow(
      /credenciales inválidas/i
    );
    expect(getAuthToken()).toBeNull();
  });

  it("registerAccount stores token and returns data", async () => {
    const mockResponse = {
      user: { id: "u2", name: "Bob", email: "b@b.com", role: "manager" },
      token: "token456",
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const res = await registerAccount("Bob", "b@b.com", "secret2");
    expect(res).toEqual(mockResponse);
    expect(getAuthToken()).toBe("token456");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/auth\/register$/),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Bob", email: "b@b.com", password: "secret2" }),
      })
    );
  });

  it("loginWithGoogleAuthCode stores token and returns data", async () => {
    const mockResponse = {
      user: { id: "u3", name: "Carol", email: "c@c.com", role: "admin" },
      token: "token789",
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const res = await loginWithGoogleAuthCode("auth-code-xyz");
    expect(res).toEqual(mockResponse);
    expect(getAuthToken()).toBe("token789");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/auth\/google$/),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "auth-code-xyz" }),
      })
    );
  });
});
