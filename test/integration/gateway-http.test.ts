/**
 * Gateway HTTP Routes — Integration Tests
 *
 * Tests the Hono HTTP routes for conversations:
 * - POST /conversations/messages (new conversation)
 * - POST /conversations/:id/messages (existing conversation)
 * - GET /conversations (list)
 * - GET /conversations/:id (history)
 * Plus: request size limits, malformed request rejection, E-16.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { Hono } from "hono";
import type {
  ConversationStore,
  EngineEvent,
  EngineRequest,
} from "../../src/types/index.js";

// --- Helpers ---

function createMockEngine(events: EngineEvent[]) {
  return {
    chat(_request: EngineRequest): AsyncIterable<EngineEvent> {
      return {
        async *[Symbol.asyncIterator]() {
          for (const event of events) {
            yield event;
          }
        },
      };
    },
  };
}

// --- Setup ---

let tempDir: string;
let dbPath: string;

let createConversationStore: (
  dbPath: string,
) => ConversationStore;
let createGateway: (deps: {
  engine: { chat(request: EngineRequest): AsyncIterable<EngineEvent> };
  conversationStore: ConversationStore;
  systemPrompt?: string;
}) => unknown;
let createGatewayRoutes: (deps: {
  gateway: unknown;
  conversationStore: ConversationStore;
}) => Hono;

let app: Hono;
let store: ConversationStore;

const AUTH_TOKEN = "test-gateway-http-token";

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "pai-gw-http-"));
  dbPath = join(tempDir, ".data", "conversations.db");

  const storeMod = await import("../../src/gateway/conversation-store.js");
  createConversationStore = storeMod.createConversationStore;

  const gatewayMod = await import("../../src/gateway/index.js");
  createGateway = gatewayMod.createGateway;

  const routesMod = await import("../../src/gateway/routes.js");
  createGatewayRoutes = routesMod.createGatewayRoutes;

  store = createConversationStore(dbPath);
  const engine = createMockEngine([
    { type: "text-delta", content: "Hello from AI" },
    { type: "done", finish_reason: "stop" },
  ]);
  const gateway = createGateway({
    engine,
    conversationStore: store,
    systemPrompt: "You are a helpful assistant.",
  });

  app = createGatewayRoutes({ gateway, conversationStore: store });
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

// --- Helper to parse SSE from response body ---

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
      if (line.startsWith("event: ")) {
        event = line.slice(7);
      } else if (line.startsWith("data: ")) {
        data = line.slice(6);
      }
    }
    if (event || data) {
      events.push({ event, data });
    }
  }

  return events;
}

describe("POST /conversations/messages — new conversation", () => {
  it("creates a new conversation and returns SSE stream", async () => {
    const res = await app.request("/conversations/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: { role: "user", content: "Hello" },
      }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");

    const events = await parseSSE(res);
    expect(events.length).toBeGreaterThan(0);

    const textEvents = events.filter((e) => e.event === "text-delta");
    expect(textEvents.length).toBeGreaterThan(0);

    const doneEvents = events.filter((e) => e.event === "done");
    expect(doneEvents.length).toBe(1);
  });

  it("returns conversation_id in the done event or response headers", async () => {
    const res = await app.request("/conversations/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: { role: "user", content: "Hello" },
      }),
    });

    expect(res.status).toBe(200);

    // Conversation ID should be accessible (either in header or done event data)
    const events = await parseSSE(res);
    const doneEvent = events.find((e) => e.event === "done");
    expect(doneEvent).toBeTruthy();

    // The done event data should include conversation_id
    const doneData = JSON.parse(doneEvent!.data);
    expect(doneData.conversation_id).toBeTruthy();
  });
});

describe("POST /conversations/:id/messages — existing conversation", () => {
  it("sends message to existing conversation and streams response", async () => {
    // Create a conversation first
    const conv = await store.create();
    await store.appendMessage(conv.id, {
      role: "user",
      content: "First message",
    });

    const res = await app.request(`/conversations/${conv.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: { role: "user", content: "Follow up" },
      }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
  });

  it("E-16: returns 404 for nonexistent conversation_id", async () => {
    const res = await app.request(
      "/conversations/nonexistent-id/messages",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: { role: "user", content: "Hello" },
        }),
      },
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBeTruthy();
  });
});

describe("GET /conversations — list", () => {
  it("returns list of conversations as JSON", async () => {
    await store.create();
    await store.create();

    const res = await app.request("/conversations", {
      method: "GET",
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
  });

  it("returns empty array when no conversations exist", async () => {
    const res = await app.request("/conversations", {
      method: "GET",
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });
});

describe("GET /conversations/:id — history", () => {
  it("returns full conversation with messages", async () => {
    const conv = await store.create();
    await store.appendMessage(conv.id, {
      role: "user",
      content: "Hello",
    });
    await store.appendMessage(conv.id, {
      role: "assistant",
      content: "Hi there",
    });

    const res = await app.request(`/conversations/${conv.id}`, {
      method: "GET",
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(conv.id);
    expect(body.messages).toHaveLength(2);
  });

  it("returns 404 for nonexistent conversation", async () => {
    const res = await app.request("/conversations/does-not-exist", {
      method: "GET",
    });

    expect(res.status).toBe(404);
  });
});

describe("Input validation", () => {
  it("rejects malformed JSON with 400", async () => {
    const res = await app.request("/conversations/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not valid json{{{",
    });

    expect(res.status).toBe(400);
  });

  it("rejects request missing message field with 400", async () => {
    const res = await app.request("/conversations/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });
});
