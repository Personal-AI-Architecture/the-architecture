/**
 * SWAP-1: Provider Swap (also satisfies FS-4)
 *
 * "Change adapter config, restart, same conversation works with new provider."
 *
 * D147: Provider swap must succeed with config-only changes — zero code changes.
 *
 * Test strategy:
 * 1. Create a full server stack with Provider A (mock returning "Provider A response")
 * 2. Run a conversation, verify response
 * 3. Create a new server stack with Provider B (different mock returning "Provider B response")
 *    pointing to the SAME memory root (conversations persist in SQLite)
 * 4. Verify conversations from Provider A are still accessible
 * 5. Send a new message — Provider B responds
 * 6. Zero code changes between the two — only the provider adapter differs
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createMockProvider } from "../../src/adapters/mock.js";
import { createMemoryTools } from "../../src/memory/tools.js";
import { createMemoryToolExecutor } from "../../src/memory/registry.js";
import { createEngine } from "../../src/engine/index.js";
import { createConversationStore } from "../../src/gateway/conversation-store.js";
import { createGateway } from "../../src/gateway/index.js";
import type { EngineEvent } from "../../src/types/index.js";

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

function extractConversationId(
  events: Array<EngineEvent & { conversation_id?: string }>,
): string | undefined {
  const doneEvent = events.find((e) => e.type === "done");
  return (doneEvent as { conversation_id?: string } | undefined)?.conversation_id;
}

describe("SWAP-1: Provider swap — config-only, zero code changes", () => {
  let memoryRoot: string;

  beforeEach(async () => {
    memoryRoot = await mkdtemp(join(tmpdir(), "pai-swap1-"));
  });

  afterEach(async () => {
    await rm(memoryRoot, { recursive: true, force: true });
  });

  it("swapping provider adapter changes responses without code changes", async () => {
    const dbPath = join(memoryRoot, ".data", "conversations.db");
    const memoryTools = createMemoryTools(memoryRoot);
    const toolExecutor = createMemoryToolExecutor(memoryTools);

    // --- Provider A ---
    const providerA = createMockProvider({
      events: [
        { type: "text-delta", content: "Response from Provider A" },
        { type: "finish", finish_reason: "stop" },
      ],
    });

    const engineA = createEngine(providerA, toolExecutor);
    const storeA = createConversationStore(dbPath);
    const gatewayA = createGateway({ engine: engineA, conversationStore: storeA });

    // Send message with Provider A
    const eventsA = await collectEvents(
      gatewayA.sendMessage({
        message: { role: "user", content: "Hello from test" },
      }),
    );

    const textA = extractText(eventsA);
    expect(textA).toBe("Response from Provider A");

    const conversationId = extractConversationId(eventsA);
    expect(conversationId).toBeDefined();

    // --- Provider B (the "swap") ---
    // Only the provider changes. Same memory root, same DB path, same tool executor.
    const providerB = createMockProvider({
      events: [
        { type: "text-delta", content: "Response from Provider B" },
        { type: "finish", finish_reason: "stop" },
      ],
    });

    const engineB = createEngine(providerB, toolExecutor);
    // Re-open conversation store (same DB path — simulates restart with new config)
    const storeB = createConversationStore(dbPath);
    const gatewayB = createGateway({ engine: engineB, conversationStore: storeB });

    // Verify previous conversation is still accessible
    const existingConversation = await storeB.get(conversationId!);
    expect(existingConversation).not.toBeNull();
    expect(existingConversation!.messages.length).toBeGreaterThanOrEqual(2); // user + assistant

    // Send new message with Provider B — different provider, same system
    const eventsB = await collectEvents(
      gatewayB.sendMessage({
        conversation_id: conversationId,
        message: { role: "user", content: "Follow-up message" },
      }),
    );

    const textB = extractText(eventsB);
    expect(textB).toBe("Response from Provider B");

    // Verify the conversation now has messages from both providers
    const fullConversation = await storeB.get(conversationId!);
    expect(fullConversation).not.toBeNull();
    // Original: user + assistant(A). Follow-up: user + assistant(B) = 4
    expect(fullConversation!.messages.length).toBe(4);
  });
});
