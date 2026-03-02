/**
 * FS-1: Move Your Memory
 *
 * "Copy folder, change config, restart — everything intact."
 *
 * The most fundamental user story: your memory is portable.
 * Copy it anywhere, point the system at the new location, everything works.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, cp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createMemoryTools } from "../../src/memory/tools.js";
import { createMemoryToolExecutor } from "../../src/memory/registry.js";
import { createMockProvider } from "../../src/adapters/mock.js";
import { createEngine } from "../../src/engine/index.js";
import { createConversationStore } from "../../src/gateway/conversation-store.js";
import { createGateway } from "../../src/gateway/index.js";
import type { EngineEvent } from "../../src/types/index.js";

async function collectText(
  stream: AsyncIterable<EngineEvent & { conversation_id?: string }>,
): Promise<{ text: string; conversationId: string }> {
  let text = "";
  let conversationId = "";
  for await (const event of stream) {
    if (event.type === "text-delta") text += event.content;
    if (event.type === "done") {
      conversationId =
        (event as EngineEvent & { conversation_id?: string }).conversation_id ?? "";
    }
  }
  return { text, conversationId };
}

describe("FS-1: Move Your Memory — copy folder, change config, everything intact", () => {
  let memoryRootA: string;
  let memoryRootB: string;

  beforeEach(async () => {
    memoryRootA = await mkdtemp(join(tmpdir(), "pai-fs1-a-"));
    memoryRootB = await mkdtemp(join(tmpdir(), "pai-fs1-b-"));
  });

  afterEach(async () => {
    await rm(memoryRootA, { recursive: true, force: true });
    await rm(memoryRootB, { recursive: true, force: true });
  });

  it("memory files survive move to new location", async () => {
    // Write files at location A
    const toolsA = createMemoryTools(memoryRootA);
    await toolsA.write({ path: "notes/important.md", content: "# Important\n\nDon't lose this." });
    await toolsA.write({ path: "preferences.json", content: '{"theme":"dark"}' });

    // Copy to location B (simulates `cp -r`)
    await cp(memoryRootA, memoryRootB, { recursive: true });

    // Point at new location — just change memory_root
    const toolsB = createMemoryTools(memoryRootB);

    // Everything is intact
    const note = await toolsB.read({ path: "notes/important.md" });
    expect(note.content).toBe("# Important\n\nDon't lose this.");

    const prefs = await toolsB.read({ path: "preferences.json" });
    expect(prefs.content).toBe('{"theme":"dark"}');

    // Listing works
    const entries = await toolsB.list({ path: "notes" });
    expect(entries.length).toBe(1);
    expect(entries[0].name).toBe("important.md");
  });

  it("conversations survive move to new location", async () => {
    const dbPathA = join(memoryRootA, ".data", "conversations.db");
    const provider = createMockProvider({
      events: [
        { type: "text-delta", content: "Remembered" },
        { type: "finish", finish_reason: "stop" },
      ],
    });

    const toolsA = createMemoryTools(memoryRootA);
    const executorA = createMemoryToolExecutor(toolsA);
    const engineA = createEngine(provider, executorA);
    const storeA = createConversationStore(dbPathA);
    const gatewayA = createGateway({
      engine: engineA,
      conversationStore: storeA,
    });

    // Create a conversation at location A
    const { conversationId } = await collectText(
      gatewayA.sendMessage({
        message: { role: "user", content: "Remember this" },
      }),
    );

    // Copy everything to location B
    await cp(memoryRootA, memoryRootB, { recursive: true });

    // Open at new location — just changed memory_root
    const dbPathB = join(memoryRootB, ".data", "conversations.db");
    const storeB = createConversationStore(dbPathB);

    // Conversation is intact at new location
    const conversation = await storeB.get(conversationId);
    expect(conversation).not.toBeNull();
    expect(conversation!.messages.length).toBe(2); // user + assistant
    expect(conversation!.messages[0].content).toBe("Remember this");
    expect(conversation!.messages[1].content).toBe("Remembered");
  });

  it("search works at new location", async () => {
    const toolsA = createMemoryTools(memoryRootA);
    await toolsA.write({ path: "project.md", content: "This contains the keyword BrainDrive" });

    // Copy to B
    await cp(memoryRootA, memoryRootB, { recursive: true });

    const toolsB = createMemoryTools(memoryRootB);
    const results = await toolsB.search({ query: "BrainDrive" });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].path).toContain("project.md");
  });
});
