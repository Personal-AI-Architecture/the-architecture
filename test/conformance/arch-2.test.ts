/**
 * ARCH-2: Engine Swap (also satisfies FS-7)
 *
 * "Replace engine with 'mirror engine' that echoes messages — Gateway still works."
 *
 * This proves the Engine interface is real: any object implementing
 * { chat(request: EngineRequest): AsyncIterable<EngineEvent> }
 * can be used by the Gateway. The Engine is a drop-in swap.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createConversationStore } from "../../src/gateway/conversation-store.js";
import { createGateway } from "../../src/gateway/index.js";
import type { EngineEvent, EngineRequest } from "../../src/types/index.js";

/**
 * Mirror engine: echoes the last user message back as the response.
 * Implements the exact same interface as createEngine() but with
 * completely different logic. If Gateway works with this, Engine is swappable.
 */
function createMirrorEngine(): {
  chat(request: EngineRequest): AsyncIterable<EngineEvent>;
} {
  return {
    async *chat(request: EngineRequest): AsyncIterable<EngineEvent> {
      const lastUserMessage = [...request.messages]
        .reverse()
        .find((m) => m.role === "user");

      const echo = lastUserMessage
        ? `Echo: ${lastUserMessage.content}`
        : "Echo: (no user message)";

      yield { type: "text-delta", content: echo };
      yield { type: "done", finish_reason: "stop" };
    },
  };
}

async function collectEvents(
  stream: AsyncIterable<EngineEvent & { conversation_id?: string }>,
): Promise<Array<EngineEvent & { conversation_id?: string }>> {
  const events: Array<EngineEvent & { conversation_id?: string }> = [];
  for await (const event of stream) {
    events.push(event);
  }
  return events;
}

function extractText(events: Array<EngineEvent>): string {
  return events
    .filter((e): e is Extract<EngineEvent, { type: "text-delta" }> => e.type === "text-delta")
    .map((e) => e.content)
    .join("");
}

describe("ARCH-2: Engine swap — replace engine, Gateway still works", () => {
  let memoryRoot: string;

  beforeEach(async () => {
    memoryRoot = await mkdtemp(join(tmpdir(), "pai-arch2-"));
  });

  afterEach(async () => {
    await rm(memoryRoot, { recursive: true, force: true });
  });

  it("Gateway works with mirror engine (no real provider or tools needed)", async () => {
    const dbPath = join(memoryRoot, ".data", "conversations.db");
    const mirrorEngine = createMirrorEngine();
    const store = createConversationStore(dbPath);
    const gateway = createGateway({
      engine: mirrorEngine,
      conversationStore: store,
    });

    // Send a message — Gateway routes to mirror engine
    const events = await collectEvents(
      gateway.sendMessage({
        message: { role: "user", content: "Hello, mirror!" },
      }),
    );

    const text = extractText(events);
    expect(text).toBe("Echo: Hello, mirror!");

    // Verify conversation was persisted (Gateway still manages conversations)
    const doneEvent = events.find((e) => e.type === "done") as
      | (EngineEvent & { conversation_id?: string })
      | undefined;
    expect(doneEvent?.conversation_id).toBeDefined();

    const conversation = await store.get(doneEvent!.conversation_id!);
    expect(conversation).not.toBeNull();
    expect(conversation!.messages.length).toBe(2); // user + assistant
  });

  it("multi-turn conversation works with swapped engine", async () => {
    const dbPath = join(memoryRoot, ".data", "conversations.db");
    const mirrorEngine = createMirrorEngine();
    const store = createConversationStore(dbPath);
    const gateway = createGateway({
      engine: mirrorEngine,
      conversationStore: store,
    });

    // Turn 1
    const events1 = await collectEvents(
      gateway.sendMessage({
        message: { role: "user", content: "First message" },
      }),
    );
    const text1 = extractText(events1);
    expect(text1).toBe("Echo: First message");

    const conversationId = (
      events1.find((e) => e.type === "done") as { conversation_id?: string } | undefined
    )?.conversation_id;

    // Turn 2 — same conversation
    const events2 = await collectEvents(
      gateway.sendMessage({
        conversation_id: conversationId,
        message: { role: "user", content: "Second message" },
      }),
    );
    const text2 = extractText(events2);
    expect(text2).toBe("Echo: Second message");

    // Verify full conversation history
    const conversation = await store.get(conversationId!);
    expect(conversation!.messages.length).toBe(4); // user, assistant, user, assistant
  });

  it("accumulated Memory is still valuable after engine swap", async () => {
    // M-6: Compounding value across swaps
    const dbPath = join(memoryRoot, ".data", "conversations.db");
    const mirrorEngine = createMirrorEngine();
    const store = createConversationStore(dbPath);
    const gateway = createGateway({
      engine: mirrorEngine,
      conversationStore: store,
    });

    // Build up conversation history
    const events = await collectEvents(
      gateway.sendMessage({
        message: { role: "user", content: "Important context" },
      }),
    );

    const conversationId = (
      events.find((e) => e.type === "done") as { conversation_id?: string } | undefined
    )?.conversation_id;

    // Swap to a DIFFERENT mirror engine instance (simulates engine replacement)
    const newMirrorEngine = createMirrorEngine();
    const store2 = createConversationStore(dbPath);
    const gateway2 = createGateway({
      engine: newMirrorEngine,
      conversationStore: store2,
    });

    // Previous conversation still accessible — Memory compounded
    const previousConv = await store2.get(conversationId!);
    expect(previousConv).not.toBeNull();
    expect(previousConv!.messages.length).toBe(2);
    expect(previousConv!.messages[0].content).toBe("Important context");

    // New engine can continue the conversation
    const events2 = await collectEvents(
      gateway2.sendMessage({
        conversation_id: conversationId,
        message: { role: "user", content: "Still here" },
      }),
    );
    expect(extractText(events2)).toBe("Echo: Still here");
  });
});
