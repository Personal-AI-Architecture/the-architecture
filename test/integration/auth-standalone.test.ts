/**
 * Auth Standalone — Integration Test
 *
 * Verifies auth module works completely independently of Gateway and Agent Loop.
 */

import { describe, it, expect } from "vitest";

describe("Auth works without Gateway/Agent Loop", () => {
  it("auth module loads and authenticates without gateway or agent loop", async () => {
    // Import only auth modules — no gateway, no agent loop
    const { createV1AuthProvider } = await import("../../src/auth/provider.js");
    const { createAuthMiddleware } = await import("../../src/auth/middleware.js");

    const provider = createV1AuthProvider("standalone-test-token");

    // Authenticate
    const identity = await provider.authenticate("standalone-test-token");
    expect(identity).not.toBeNull();
    expect(identity!.type).toBe("owner");

    // Authorize
    const decision = await provider.authorize(identity!, "memory/test", "read");
    expect(decision.allowed).toBe(true);

    // Middleware creates without error
    const middleware = createAuthMiddleware(provider);
    expect(middleware).toBeDefined();
    expect(typeof middleware).toBe("function");
  });
});
