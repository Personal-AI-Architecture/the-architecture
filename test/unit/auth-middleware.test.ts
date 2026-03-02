/**
 * Auth Middleware — Unit Tests
 *
 * Tests the Hono middleware: credential extraction, header setting, 401 responses.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import type { AuthProvider } from "../../src/types/index.js";

const OWNER_TOKEN = "test-middleware-token-xyz";

let createV1AuthProvider: (credential: string) => AuthProvider;
let createAuthMiddleware: (provider: AuthProvider) => ReturnType<typeof import("../../src/auth/middleware.js").createAuthMiddleware>;

let app: InstanceType<typeof Hono>;

beforeEach(async () => {
  const providerMod = await import("../../src/auth/provider.js");
  const middlewareMod = await import("../../src/auth/middleware.js");
  createV1AuthProvider = providerMod.createV1AuthProvider;
  createAuthMiddleware = middlewareMod.createAuthMiddleware;

  const provider = createV1AuthProvider(OWNER_TOKEN);
  const middleware = createAuthMiddleware(provider);

  app = new Hono();
  app.use("*", middleware);
  app.get("/test", (c) => {
    return c.json({
      actorId: c.req.header("X-Actor-ID"),
      actorPermissions: c.req.header("X-Actor-Permissions"),
    });
  });
});

describe("Credential extraction", () => {
  it("extracts Bearer token from Authorization header", async () => {
    const res = await app.request("/test", {
      headers: { Authorization: `Bearer ${OWNER_TOKEN}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.actorId).toBe("owner");
  });

  it("extracts token from X-API-Key header", async () => {
    const res = await app.request("/test", {
      headers: { "X-API-Key": OWNER_TOKEN },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.actorId).toBe("owner");
  });

  it("extracts token from cookie header", async () => {
    const res = await app.request("/test", {
      headers: { Cookie: `session=abc123; pai_auth_token=${OWNER_TOKEN}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.actorId).toBe("owner");
  });
});

describe("Success behavior", () => {
  it("sets X-Actor-ID and X-Actor-Permissions headers on success", async () => {
    const res = await app.request("/test", {
      headers: { Authorization: `Bearer ${OWNER_TOKEN}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.actorId).toBe("owner");
    expect(body.actorPermissions).toBeTruthy();

    const permissions = JSON.parse(body.actorPermissions);
    expect(permissions.type).toBe("owner");
  });
});

describe("Failure behavior", () => {
  it("returns 401 when no credentials provided", async () => {
    const res = await app.request("/test");

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe("unauthorized");
  });

  it("returns 401 for invalid credentials", async () => {
    const res = await app.request("/test", {
      headers: { Authorization: "Bearer wrong-token" },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe("unauthorized");
  });
});
