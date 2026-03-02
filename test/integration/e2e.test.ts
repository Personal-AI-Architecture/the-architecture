/**
 * End-to-End Integration Tests
 *
 * Full loop: message → auth → gateway → engine → mock provider → back to client.
 * Tests tool calls end-to-end, conversation resumption, auth blocking,
 * schema conformance (ARCH-4), and S-4 (engine not externally accessible).
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { Hono } from "hono";

// --- Setup ---

let tempDir: string;
let memoryRoot: string;
let dbPath: string;
let app: Hono;

const AUTH_TOKEN = "test-e2e-auth-token";

/**
 * Create a mock provider that returns tool calls on first request
 * and text on second request (simulates read-then-respond).
 */
function createSequenceMockProvider() {
  let callCount = 0;

  return {
    async *complete(
      messages: Array<{ role: string; content: string }>,
      _tools: unknown[],
    ) {
      callCount++;

      // If last message is a tool result, respond with text
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "tool" || callCount > 1) {
        yield { type: "text-delta" as const, content: "Based on the file: " };
        yield { type: "text-delta" as const, content: "it says hello." };
        yield {
          type: "finish" as const,
          finish_reason: "stop" as const,
          usage: { prompt_tokens: 50, completion_tokens: 20 },
        };
        return;
      }

      // First call: request a tool call
      yield {
        type: "tool-call" as const,
        id: "tc_1",
        name: "memory_read",
        arguments: { path: "test-file.md" },
      };
      yield {
        type: "finish" as const,
        finish_reason: "tool_calls" as const,
        usage: { prompt_tokens: 40, completion_tokens: 10 },
      };
    },
  };
}

/**
 * Create a simple mock provider that returns text only.
 */
function createTextMockProvider(text: string) {
  return {
    async *complete() {
      yield { type: "text-delta" as const, content: text };
      yield {
        type: "finish" as const,
        finish_reason: "stop" as const,
        usage: { prompt_tokens: 20, completion_tokens: 10 },
      };
    },
  };
}

async function buildApp(provider: unknown) {
  const storeMod = await import("../../src/gateway/conversation-store.js");
  const gatewayMod = await import("../../src/gateway/index.js");
  const routesMod = await import("../../src/gateway/routes.js");
  const authProviderMod = await import("../../src/auth/provider.js");
  const authMiddlewareMod = await import("../../src/auth/middleware.js");
  const memoryToolsMod = await import("../../src/memory/tools.js");
  const registryMod = await import("../../src/memory/registry.js");
  const engineMod = await import("../../src/engine/index.js");
  const { Hono } = await import("hono");

  // Build components
  const memoryTools = memoryToolsMod.createMemoryTools(memoryRoot);
  const memoryExecutor = registryMod.createMemoryToolExecutor(memoryTools);
  const engine = engineMod.createEngine(provider as any, memoryExecutor);

  const store = storeMod.createConversationStore(dbPath);
  const gateway = gatewayMod.createGateway({
    engine,
    conversationStore: store,
    systemPrompt: "You are a test assistant.",
  });
  const routes = routesMod.createGatewayRoutes({
    gateway,
    conversationStore: store,
  });

  // Auth
  const authProvider = authProviderMod.createV1AuthProvider(AUTH_TOKEN);
  const authMiddleware = authMiddlewareMod.createAuthMiddleware(authProvider);

  // Compose
  const honoApp = new Hono();
  honoApp.use("*", authMiddleware);
  honoApp.route("/", routes);

  return honoApp;
}

async function parseSSE(
  response: Response,
): Promise<Array<{ event: string; data: string }>> {
  const text = await response.text();
  const events: Array<{ event: string; data: string }> = [];

  const blocks = text.split("\n\n").filter((b) => b.trim());
  for (const block of blocks) {
    const lines = block.split("\n");
    let event = "";
    let data = "";
    for (const line of lines) {
      if (line.startsWith("event: ")) event = line.slice(7);
      else if (line.startsWith("data: ")) data = line.slice(6);
    }
    if (event || data) events.push({ event, data });
  }

  return events;
}

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "pai-e2e-"));
  memoryRoot = join(tempDir, "memory");
  await mkdir(memoryRoot, { recursive: true });
  dbPath = join(memoryRoot, ".data", "conversations.db");

  // Create a test file for tool calls to read
  await writeFile(
    join(memoryRoot, "test-file.md"),
    "# Test\nHello from memory!",
  );
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("Full loop: message → auth → gateway → engine → provider → response", () => {
  it("completes full request lifecycle with mock provider", async () => {
    app = await buildApp(createTextMockProvider("Hello, I'm your AI!"));

    const res = await app.request("/conversations/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        message: { role: "user", content: "Hi there" },
      }),
    });

    expect(res.status).toBe(200);

    const events = await parseSSE(res);
    const textEvents = events.filter((e) => e.event === "text-delta");
    expect(textEvents.length).toBeGreaterThan(0);

    const doneEvents = events.filter((e) => e.event === "done");
    expect(doneEvents).toHaveLength(1);
  });
});

describe("Tool calls end-to-end", () => {
  it("message triggers tool, real file read, result flows back", async () => {
    app = await buildApp(createSequenceMockProvider());

    const res = await app.request("/conversations/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        message: { role: "user", content: "What's in test-file.md?" },
      }),
    });

    expect(res.status).toBe(200);

    const events = await parseSSE(res);

    // Should see tool-call, tool-result, and text-delta events
    const toolCallEvents = events.filter((e) => e.event === "tool-call");
    const toolResultEvents = events.filter((e) => e.event === "tool-result");
    const textEvents = events.filter((e) => e.event === "text-delta");

    expect(toolCallEvents.length).toBeGreaterThan(0);
    expect(toolResultEvents.length).toBeGreaterThan(0);
    expect(textEvents.length).toBeGreaterThan(0);

    // Tool result should contain actual file content
    const toolResultData = JSON.parse(toolResultEvents[0].data);
    expect(toolResultData.output).toContain("Hello from memory!");
  });
});

describe("Conversation resumption", () => {
  it("multi-turn conversation preserves history", async () => {
    app = await buildApp(createTextMockProvider("First response"));

    // First message
    const res1 = await app.request("/conversations/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        message: { role: "user", content: "First question" },
      }),
    });

    expect(res1.status).toBe(200);
    const events1 = await parseSSE(res1);
    const doneEvent = events1.find((e) => e.event === "done");
    const doneData = JSON.parse(doneEvent!.data);
    const conversationId = doneData.conversation_id;

    expect(conversationId).toBeTruthy();

    // Build a new app with different response for second turn
    app = await buildApp(createTextMockProvider("Second response"));

    // Second message to same conversation
    const res2 = await app.request(
      `/conversations/${conversationId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
        body: JSON.stringify({
          message: { role: "user", content: "Follow up question" },
        }),
      },
    );

    expect(res2.status).toBe(200);

    // Verify conversation has full history
    const historyRes = await app.request(
      `/conversations/${conversationId}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      },
    );

    expect(historyRes.status).toBe(200);
    const history = await historyRes.json();

    // Should have: first user + first assistant + second user + second assistant
    expect(history.messages.length).toBeGreaterThanOrEqual(4);
  });
});

describe("Auth blocks unauthenticated (D22)", () => {
  it("request without token gets 401", async () => {
    app = await buildApp(createTextMockProvider("Should not see this"));

    const res = await app.request("/conversations/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: { role: "user", content: "Hello" },
      }),
    });

    expect(res.status).toBe(401);
  });

  it("request with wrong token gets 401", async () => {
    app = await buildApp(createTextMockProvider("Should not see this"));

    const res = await app.request("/conversations/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer wrong-token",
      },
      body: JSON.stringify({
        message: { role: "user", content: "Hello" },
      }),
    });

    expect(res.status).toBe(401);
  });
});

describe("S-4: Engine not externally accessible (D137)", () => {
  it("external HTTP request to /engine/chat gets 404", async () => {
    app = await buildApp(createTextMockProvider("Should not see this"));

    const res = await app.request("/engine/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
      }),
    });

    expect(res.status).toBe(404);
  });
});

describe("ARCH-4: Schema conformance", () => {
  it("SSE events contain valid data fields", async () => {
    app = await buildApp(createTextMockProvider("Valid response"));

    const res = await app.request("/conversations/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        message: { role: "user", content: "Hello" },
      }),
    });

    expect(res.status).toBe(200);
    const events = await parseSSE(res);

    for (const event of events) {
      expect(event.event).toBeTruthy();
      const data = JSON.parse(event.data);

      if (event.event === "text-delta") {
        expect(typeof data.content).toBe("string");
      } else if (event.event === "done") {
        expect(typeof data.finish_reason).toBe("string");
        expect(data.conversation_id).toBeTruthy();
      } else if (event.event === "error") {
        expect(typeof data.code).toBe("string");
        expect(typeof data.message).toBe("string");
      }
    }
  });
});
