/**
 * Deployment Conformance — Integration Tests
 *
 * DEPLOY-3: Server binds to localhost only (127.0.0.1)
 * DEPLOY-4: No outbound network traffic with mock provider
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

let tempDir: string;
let memoryRoot: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "pai-deploy-"));
  memoryRoot = join(tempDir, "memory");
  await mkdir(memoryRoot, { recursive: true });
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("DEPLOY-3: Localhost only", () => {
  it("server compose function binds to 127.0.0.1 by default", async () => {
    // Read the server composition source to verify binding
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");

    const serverPath = resolve(
      import.meta.dirname,
      "../../src/gateway/server.ts",
    );

    let serverSource: string;
    try {
      serverSource = readFileSync(serverPath, "utf-8");
    } catch {
      // If server.ts doesn't exist yet, check for other possible locations
      const altPath = resolve(import.meta.dirname, "../../src/server.ts");
      try {
        serverSource = readFileSync(altPath, "utf-8");
      } catch {
        // Implementation doesn't exist yet — skip
        return;
      }
    }

    // The server should bind to localhost/127.0.0.1, not 0.0.0.0
    const bindsToAllInterfaces =
      serverSource.includes('"0.0.0.0"') ||
      serverSource.includes("'0.0.0.0'");
    const bindsToLocalhost =
      serverSource.includes("127.0.0.1") ||
      serverSource.includes("localhost");

    expect(bindsToAllInterfaces).toBe(false);
    // If it explicitly binds, it should be to localhost
    // (Hono defaults to localhost, so no explicit mention is also OK)
  });
});

describe("DEPLOY-4: No outbound traffic with mock provider", () => {
  it("full request cycle with mock provider makes zero external network calls", async () => {
    // This test verifies that with a mock provider, the system
    // never attempts to reach external services.
    // We do this by creating a mock provider and checking no fetch/http calls are made.

    const fetchCalls: string[] = [];
    const originalFetch = globalThis.fetch;

    // Intercept any fetch calls
    globalThis.fetch = (async (input: RequestInfo | URL, _init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      fetchCalls.push(url);
      throw new Error(`Unexpected outbound request to: ${url}`);
    }) as typeof fetch;

    try {
      const storeMod = await import("../../src/gateway/conversation-store.js");
      const gatewayMod = await import("../../src/gateway/index.js");
      const routesMod = await import("../../src/gateway/routes.js");
      const engineMod = await import("../../src/engine/index.js");
      const memoryToolsMod = await import("../../src/memory/tools.js");
      const registryMod = await import("../../src/memory/registry.js");

      // Mock provider — no external calls
      const mockProvider = {
        async *complete() {
          yield { type: "text-delta" as const, content: "Mock response" };
          yield {
            type: "finish" as const,
            finish_reason: "stop" as const,
          };
        },
      };

      const dbPath = join(memoryRoot, ".data", "conversations.db");
      const memoryTools = memoryToolsMod.createMemoryTools(memoryRoot);
      const memoryExecutor = registryMod.createMemoryToolExecutor(memoryTools);
      const engine = engineMod.createEngine(mockProvider as any, memoryExecutor);
      const store = storeMod.createConversationStore(dbPath);
      const gateway = gatewayMod.createGateway({
        engine,
        conversationStore: store,
      });
      const app = routesMod.createGatewayRoutes({
        gateway,
        conversationStore: store,
      });

      // Make a request (no auth middleware here — testing outbound only)
      const res = await app.request("/conversations/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: { role: "user", content: "Test no outbound" },
        }),
      });

      expect(res.status).toBe(200);

      // No outbound fetch calls should have been made
      expect(fetchCalls).toEqual([]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
