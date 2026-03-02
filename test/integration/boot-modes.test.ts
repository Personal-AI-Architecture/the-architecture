/**
 * Boot Modes — Integration Tests
 *
 * D156: Two boot modes must work:
 * 1. Standalone: `npx personal-ai` (server starts listening)
 * 2. As-dependency: `import { boot } from "personal-ai-architecture"` (returns composable parts)
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

let tempDir: string;
let memoryRoot: string;
let configPath: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "pai-boot-modes-"));
  memoryRoot = join(tempDir, "memory");
  await mkdir(memoryRoot, { recursive: true });

  configPath = join(tempDir, "config.json");
  await writeFile(
    configPath,
    JSON.stringify({
      memory_root: memoryRoot,
      provider_adapter: "mock",
      auth_mode: "local",
      tool_sources: [],
    }),
  );
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("As-dependency boot mode (D156)", () => {
  it("boot() returns config and status without starting a server", async () => {
    // This is the existing boot function — already works from Phase 0
    const { boot } = await import("../../src/config/boot.js");

    const result = await boot(configPath);

    expect(result.status).toBe("ok");
    expect(result.config.memory_root).toBe(memoryRoot);
  });

  it("public exports allow composing the full stack", async () => {
    // Verify that the main entry point exports everything needed
    const mainMod = await import("../../src/index.js");

    // boot function must be exported
    expect(typeof mainMod.boot).toBe("function");

    // BootError must be exported for error handling
    expect(mainMod.BootError).toBeTruthy();
  });
});

describe("Server composition", () => {
  it("can compose a full Hono app from individual components", async () => {
    // This tests that all the pieces wire together
    const { boot } = await import("../../src/config/boot.js");
    const result = await boot(configPath);

    // Import all the pieces
    const { createMemoryTools } = await import("../../src/memory/tools.js");
    const { createMemoryToolExecutor } = await import(
      "../../src/memory/registry.js"
    );
    const { createEngine } = await import("../../src/engine/index.js");
    const { createConversationStore } = await import(
      "../../src/gateway/conversation-store.js"
    );
    const { createGateway } = await import("../../src/gateway/index.js");
    const { createGatewayRoutes } = await import(
      "../../src/gateway/routes.js"
    );
    const { createV1AuthProvider } = await import(
      "../../src/auth/provider.js"
    );
    const { createAuthMiddleware } = await import(
      "../../src/auth/middleware.js"
    );
    const { Hono } = await import("hono");

    // Wire up
    const memoryTools = createMemoryTools(result.config.memory_root);
    const memoryExecutor = createMemoryToolExecutor(memoryTools);

    // Use mock provider
    const mockProvider = {
      async *complete() {
        yield { type: "text-delta" as const, content: "OK" };
        yield {
          type: "finish" as const,
          finish_reason: "stop" as const,
        };
      },
    };

    const engine = createEngine(mockProvider as any, memoryExecutor);
    const dbPath = join(
      result.config.memory_root,
      ".data",
      "conversations.db",
    );
    const store = createConversationStore(dbPath);
    const gateway = createGateway({ engine, conversationStore: store });
    const routes = createGatewayRoutes({
      gateway,
      conversationStore: store,
    });

    const authProvider = createV1AuthProvider("test-token");
    const authMiddleware = createAuthMiddleware(authProvider);

    const app = new Hono();
    app.use("*", authMiddleware);
    app.route("/", routes);

    // Test it works
    const res = await app.request("/conversations/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({
        message: { role: "user", content: "Composition test" },
      }),
    });

    expect(res.status).toBe(200);
  });
});
