/**
 * ARCH-3: Client Swap (also satisfies FS-5)
 *
 * "Second client speaks Gateway API, works identically to first client."
 *
 * The Gateway API is the only contract between clients and the system.
 * Any client that speaks this contract should work identically.
 *
 * Test strategy:
 * 1. Create a Hono app (the server)
 * 2. "Client A" sends a message via one set of fetch calls
 * 3. "Client B" (a different function, simulating a different client)
 *    resumes the same conversation via the same API
 * 4. Both get correct responses — the server doesn't know or care
 *    which client is talking
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createServer } from "../../src/gateway/server.js";
import type { RuntimeConfig } from "../../src/types/index.js";

const AUTH_TOKEN = "test-token-arch3";

function parseSSEEvents(body: string): Array<{ type: string; data: unknown }> {
  return body
    .split("\n\n")
    .filter((block) => block.trim().length > 0)
    .map((block) => {
      const lines = block.split("\n");
      const eventLine = lines.find((l) => l.startsWith("event:"));
      const dataLine = lines.find((l) => l.startsWith("data:"));
      const type = eventLine ? eventLine.slice(6).trim() : "unknown";
      let data: unknown = null;
      if (dataLine) {
        try {
          data = JSON.parse(dataLine.slice(5).trim());
        } catch {
          data = dataLine.slice(5).trim();
        }
      }
      return { type, data };
    });
}

/**
 * Simulated Client A: sends a message and returns the conversation_id
 */
async function clientA(
  app: Awaited<ReturnType<typeof createServer>>,
  message: string,
  conversationId?: string,
): Promise<{ text: string; conversationId: string }> {
  const url = conversationId
    ? `http://localhost/conversations/${conversationId}/messages`
    : "http://localhost/conversations/messages";

  const response = await app.request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
    body: JSON.stringify({
      message: { role: "user", content: message },
    }),
  });

  const body = await response.text();
  const events = parseSSEEvents(body);
  const text = events
    .filter((e) => e.type === "text-delta")
    .map((e) => (e.data as { content: string }).content)
    .join("");
  const doneEvent = events.find((e) => e.type === "done");
  const cid = (doneEvent?.data as { conversation_id?: string })?.conversation_id ?? "";
  return { text, conversationId: cid };
}

/**
 * Simulated Client B: completely separate function, same API contract.
 * Uses X-API-Key header instead of Bearer token (tests auth flexibility).
 */
async function clientB(
  app: Awaited<ReturnType<typeof createServer>>,
  message: string,
  conversationId?: string,
): Promise<{ text: string; conversationId: string }> {
  const url = conversationId
    ? `http://localhost/conversations/${conversationId}/messages`
    : "http://localhost/conversations/messages";

  const response = await app.request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": AUTH_TOKEN,
    },
    body: JSON.stringify({
      message: { role: "user", content: message },
    }),
  });

  const body = await response.text();
  const events = parseSSEEvents(body);
  const text = events
    .filter((e) => e.type === "text-delta")
    .map((e) => (e.data as { content: string }).content)
    .join("");
  const doneEvent = events.find((e) => e.type === "done");
  const cid = (doneEvent?.data as { conversation_id?: string })?.conversation_id ?? "";
  return { text, conversationId: cid };
}

describe("ARCH-3: Client swap — multiple clients speak Gateway API identically", () => {
  let memoryRoot: string;

  beforeEach(async () => {
    memoryRoot = await mkdtemp(join(tmpdir(), "pai-arch3-"));
  });

  afterEach(async () => {
    await rm(memoryRoot, { recursive: true, force: true });
  });

  it("two different clients can interact with the same server", async () => {
    const config: RuntimeConfig = {
      memory_root: memoryRoot,
      provider_adapter: "mock",
      default_model: "test-model",
      tool_sources: [],
    };

    const app = await createServer({
      config,
      authToken: AUTH_TOKEN,
    });

    // Client A starts a conversation
    const resultA = await clientA(app, "Hello from Client A");
    expect(resultA.text).toBeTruthy();
    expect(resultA.conversationId).toBeTruthy();

    // Client B starts a different conversation
    const resultB = await clientB(app, "Hello from Client B");
    expect(resultB.text).toBeTruthy();
    expect(resultB.conversationId).toBeTruthy();

    // Both got responses — different conversations
    expect(resultA.conversationId).not.toBe(resultB.conversationId);
  });

  it("Client B can resume a conversation started by Client A", async () => {
    const config: RuntimeConfig = {
      memory_root: memoryRoot,
      provider_adapter: "mock",
      default_model: "test-model",
      tool_sources: [],
    };

    const app = await createServer({
      config,
      authToken: AUTH_TOKEN,
    });

    // Client A starts conversation
    const resultA = await clientA(app, "Start from A");
    const conversationId = resultA.conversationId;
    expect(conversationId).toBeTruthy();

    // Client B continues the SAME conversation
    const resultB = await clientB(app, "Continue from B", conversationId);
    expect(resultB.text).toBeTruthy();

    // Verify conversation history shows both messages
    const historyResponse = await app.request(
      `http://localhost/conversations/${conversationId}`,
      {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      },
    );
    const history = (await historyResponse.json()) as {
      messages: Array<{ role: string; content: string }>;
    };

    const userMessages = history.messages.filter((m) => m.role === "user");
    expect(userMessages.length).toBe(2);
    expect(userMessages[0].content).toBe("Start from A");
    expect(userMessages[1].content).toBe("Continue from B");
  });

  it("conversation list is accessible from any client", async () => {
    const config: RuntimeConfig = {
      memory_root: memoryRoot,
      provider_adapter: "mock",
      default_model: "test-model",
      tool_sources: [],
    };

    const app = await createServer({
      config,
      authToken: AUTH_TOKEN,
    });

    // Create conversations from both clients
    await clientA(app, "A's conversation");
    await clientB(app, "B's conversation");

    // Either client can list all conversations
    const listResponse = await app.request(
      "http://localhost/conversations",
      {
        headers: { "X-API-Key": AUTH_TOKEN },
      },
    );
    const conversations = (await listResponse.json()) as Array<{ id: string }>;
    expect(conversations.length).toBe(2);
  });
});
