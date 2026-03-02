/**
 * Auth Provider — Unit Tests
 *
 * Tests V1 owner-only auth: authenticate, authorize, identity schema.
 */

import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import type { AuthProvider } from "../../src/types/index.js";

const OWNER_TOKEN = "test-owner-token-abc123";

let createV1AuthProvider: (credential: string) => AuthProvider;
let provider: AuthProvider;

beforeEach(async () => {
  const mod = await import("../../src/auth/provider.js");
  createV1AuthProvider = mod.createV1AuthProvider;
  provider = createV1AuthProvider(OWNER_TOKEN);
});

describe("authenticate()", () => {
  it("valid credential returns owner identity", async () => {
    const identity = await provider.authenticate(OWNER_TOKEN);

    expect(identity).not.toBeNull();
    expect(identity!.id).toBe("owner");
    expect(identity!.type).toBe("owner");
    expect(identity!.display_name).toBe("Owner");
    expect(identity!.status).toBe("active");
    expect(identity!.created_at).toBeTruthy();
    expect(new Date(identity!.created_at).toISOString()).toBe(identity!.created_at);
  });

  it("invalid credential returns null", async () => {
    const identity = await provider.authenticate("wrong-token");
    expect(identity).toBeNull();
  });

  it("missing/empty credential returns null", async () => {
    const identity = await provider.authenticate("");
    expect(identity).toBeNull();
  });

  it("P-3: auth fail-closed — all random strings rejected except actual token", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 200 }).filter((s) => s !== OWNER_TOKEN),
        async (randomCredential) => {
          const identity = await provider.authenticate(randomCredential);
          expect(identity).toBeNull();
        },
      ),
      { numRuns: 50 },
    );
  });
});

describe("authorize()", () => {
  it("owner identity gets full access", async () => {
    const identity = await provider.authenticate(OWNER_TOKEN);
    expect(identity).not.toBeNull();

    const decision = await provider.authorize(identity!, "memory/notes.md", "read");
    expect(decision.allowed).toBe(true);
  });

  it("owner can access any resource and action", async () => {
    const identity = await provider.authenticate(OWNER_TOKEN);
    expect(identity).not.toBeNull();

    const resources = ["memory/file.md", "tools/search", "system/config"];
    const actions = ["read", "write", "delete", "execute"];

    for (const resource of resources) {
      for (const action of actions) {
        const decision = await provider.authorize(identity!, resource, action);
        expect(decision.allowed).toBe(true);
      }
    }
  });
});

describe("Identity schema", () => {
  it("supports all 8 actor types in the schema", async () => {
    // Verify the identity returned has a valid actor type
    const identity = await provider.authenticate(OWNER_TOKEN);
    expect(identity).not.toBeNull();

    const validTypes = [
      "owner", "collaborator", "system_agent", "background_agent",
      "external_agent", "service", "economic", "federated",
    ];
    expect(validTypes).toContain(identity!.type);
  });
});
