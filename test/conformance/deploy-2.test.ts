/**
 * DEPLOY-2: Local Data
 *
 * "All data stays on local filesystem — nothing external."
 *
 * Test strategy:
 * Run a full conversation, then verify that ALL persistent data
 * (memory files, conversations, config) exists within the memory_root
 * directory on the local filesystem. No data escaped to external services.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Database from "better-sqlite3";
import { createMockProvider } from "../../src/adapters/mock.js";
import { createMemoryTools } from "../../src/memory/tools.js";
import { createMemoryToolExecutor } from "../../src/memory/registry.js";
import { createEngine } from "../../src/engine/index.js";
import { createConversationStore } from "../../src/gateway/conversation-store.js";
import { createGateway } from "../../src/gateway/index.js";
import type { EngineEvent } from "../../src/types/index.js";

describe("DEPLOY-2: Local data — all data on local filesystem", () => {
  let memoryRoot: string;

  beforeEach(async () => {
    memoryRoot = await mkdtemp(join(tmpdir(), "pai-deploy2-"));
  });

  afterEach(async () => {
    await rm(memoryRoot, { recursive: true, force: true });
  });

  it("all persistent data exists within memory_root", async () => {
    const dbPath = join(memoryRoot, ".data", "conversations.db");
    const memoryTools = createMemoryTools(memoryRoot);
    const toolExecutor = createMemoryToolExecutor(memoryTools);
    const provider = createMockProvider({
      events: [
        { type: "text-delta", content: "Stored locally" },
        { type: "finish", finish_reason: "stop" },
      ],
    });
    const engine = createEngine(provider, toolExecutor);
    const store = createConversationStore(dbPath);
    const gateway = createGateway({
      engine,
      conversationStore: store,
    });

    // Write some memory
    await memoryTools.write({ path: "notes/local.md", content: "Local data" });

    // Have a conversation
    const events: Array<EngineEvent & { conversation_id?: string }> = [];
    for await (const event of gateway.sendMessage({
      message: { role: "user", content: "Test local storage" },
    })) {
      events.push(event);
    }

    // Verify memory files exist on local filesystem
    const notesDir = await readdir(join(memoryRoot, "notes"));
    expect(notesDir).toContain("local.md");

    // Verify conversation DB exists on local filesystem
    const dbStat = await stat(dbPath);
    expect(dbStat.isFile()).toBe(true);

    // Verify conversations are in the local SQLite DB
    const db = new Database(dbPath);
    const rows = db.prepare("SELECT COUNT(*) AS count FROM conversations").get() as {
      count: number;
    };
    expect(rows.count).toBeGreaterThanOrEqual(1);
    db.close();
  });

  it("conversation data is inspectable with standard SQLite tools", async () => {
    const dbPath = join(memoryRoot, ".data", "conversations.db");
    const provider = createMockProvider({
      events: [
        { type: "text-delta", content: "Inspectable" },
        { type: "finish", finish_reason: "stop" },
      ],
    });
    const memoryTools = createMemoryTools(memoryRoot);
    const toolExecutor = createMemoryToolExecutor(memoryTools);
    const engine = createEngine(provider, toolExecutor);
    const store = createConversationStore(dbPath);
    const gateway = createGateway({
      engine,
      conversationStore: store,
    });

    for await (const _event of gateway.sendMessage({
      message: { role: "user", content: "Can you see this?" },
    })) {
      // consume stream
    }

    // Open DB with standard SQLite — no system running
    const db = new Database(dbPath);
    const messages = db
      .prepare("SELECT role, content FROM messages ORDER BY id")
      .all() as Array<{ role: string; content: string }>;

    expect(messages.length).toBe(2); // user + assistant
    expect(messages[0].role).toBe("user");
    expect(messages[0].content).toBe("Can you see this?");
    expect(messages[1].role).toBe("assistant");
    expect(messages[1].content).toBe("Inspectable");

    db.close();
  });
});
