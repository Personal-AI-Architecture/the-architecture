/**
 * Conversation Store — Unit Tests
 *
 * Tests SQLite-backed conversation store: create, get, list, appendMessage.
 * Verifies P-6 (persistence), ARCH-1 (inspectable with standard tools),
 * and E-10 (empty conversation).
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Database from "better-sqlite3";
import type { Message } from "../../src/types/index.js";

// Lazy import — implementation doesn't exist yet
let createConversationStore: (dbPath: string) => import("../../src/types/index.js").ConversationStore;

let tempDir: string;
let dbPath: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "pai-conv-"));
  dbPath = join(tempDir, ".data", "conversations.db");

  const mod = await import("../../src/gateway/conversation-store.js");
  createConversationStore = mod.createConversationStore;
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("Conversation create + get", () => {
  it("creates a conversation and returns it with an ID", async () => {
    const store = createConversationStore(dbPath);
    const conversation = await store.create();

    expect(conversation.id).toBeTruthy();
    expect(typeof conversation.id).toBe("string");
    expect(conversation.created_at).toBeTruthy();
    expect(conversation.updated_at).toBeTruthy();
    expect(conversation.messages).toEqual([]);
  });

  it("gets a created conversation by ID", async () => {
    const store = createConversationStore(dbPath);
    const created = await store.create();
    const retrieved = await store.get(created.id);

    expect(retrieved).not.toBeNull();
    expect(retrieved!.id).toBe(created.id);
    expect(retrieved!.created_at).toBe(created.created_at);
    expect(retrieved!.messages).toEqual([]);
  });

  it("returns null for nonexistent conversation", async () => {
    const store = createConversationStore(dbPath);
    const result = await store.get("nonexistent-id");

    expect(result).toBeNull();
  });
});

describe("Conversation list", () => {
  it("lists all conversations", async () => {
    const store = createConversationStore(dbPath);
    await store.create();
    await store.create();
    await store.create();

    const list = await store.list();

    expect(list).toHaveLength(3);
    for (const summary of list) {
      expect(summary.id).toBeTruthy();
      expect(summary.created_at).toBeTruthy();
      expect(summary.updated_at).toBeTruthy();
      expect(summary.message_count).toBe(0);
    }
  });

  it("returns empty list when no conversations exist", async () => {
    const store = createConversationStore(dbPath);
    const list = await store.list();

    expect(list).toEqual([]);
  });

  it("supports limit and offset for pagination", async () => {
    const store = createConversationStore(dbPath);
    await store.create();
    await store.create();
    await store.create();

    const page = await store.list({ limit: 2, offset: 0 });
    expect(page).toHaveLength(2);

    const page2 = await store.list({ limit: 2, offset: 2 });
    expect(page2).toHaveLength(1);
  });
});

describe("Conversation appendMessage + get (P-6)", () => {
  it("appended message appears in get result", async () => {
    const store = createConversationStore(dbPath);
    const conversation = await store.create();

    const msg: Message = {
      role: "user",
      content: "Hello, world!",
    };

    await store.appendMessage(conversation.id, msg);

    const retrieved = await store.get(conversation.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.messages).toHaveLength(1);
    expect(retrieved!.messages[0].role).toBe("user");
    expect(retrieved!.messages[0].content).toBe("Hello, world!");
  });

  it("preserves message order across multiple appends", async () => {
    const store = createConversationStore(dbPath);
    const conversation = await store.create();

    const messages: Message[] = [
      { role: "user", content: "First message" },
      { role: "assistant", content: "First response" },
      { role: "user", content: "Second message" },
      { role: "assistant", content: "Second response" },
    ];

    for (const msg of messages) {
      await store.appendMessage(conversation.id, msg);
    }

    const retrieved = await store.get(conversation.id);
    expect(retrieved!.messages).toHaveLength(4);
    expect(retrieved!.messages[0].content).toBe("First message");
    expect(retrieved!.messages[1].content).toBe("First response");
    expect(retrieved!.messages[2].content).toBe("Second message");
    expect(retrieved!.messages[3].content).toBe("Second response");
  });

  it("updates conversation updated_at on append", async () => {
    const store = createConversationStore(dbPath);
    const conversation = await store.create();
    const originalUpdatedAt = conversation.updated_at;

    // Small delay to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 10));

    await store.appendMessage(conversation.id, {
      role: "user",
      content: "Hello",
    });

    const retrieved = await store.get(conversation.id);
    expect(retrieved!.updated_at).not.toBe(originalUpdatedAt);
  });

  it("preserves tool_calls in assistant messages", async () => {
    const store = createConversationStore(dbPath);
    const conversation = await store.create();

    const msg: Message = {
      role: "assistant",
      content: "",
      tool_calls: [
        {
          id: "tc_1",
          name: "memory_read",
          arguments: { path: "AGENT.md" },
        },
      ],
    };

    await store.appendMessage(conversation.id, msg);

    const retrieved = await store.get(conversation.id);
    expect(retrieved!.messages[0].tool_calls).toEqual([
      {
        id: "tc_1",
        name: "memory_read",
        arguments: { path: "AGENT.md" },
      },
    ]);
  });

  it("preserves tool_call_id in tool messages", async () => {
    const store = createConversationStore(dbPath);
    const conversation = await store.create();

    const msg: Message = {
      role: "tool",
      content: '{"path":"AGENT.md","content":"# Agent"}',
      tool_call_id: "tc_1",
    };

    await store.appendMessage(conversation.id, msg);

    const retrieved = await store.get(conversation.id);
    expect(retrieved!.messages[0].tool_call_id).toBe("tc_1");
  });

  it("list reflects message count after appends", async () => {
    const store = createConversationStore(dbPath);
    const conversation = await store.create();

    await store.appendMessage(conversation.id, {
      role: "user",
      content: "Hello",
    });
    await store.appendMessage(conversation.id, {
      role: "assistant",
      content: "Hi there",
    });

    const list = await store.list();
    const summary = list.find((s) => s.id === conversation.id);
    expect(summary!.message_count).toBe(2);
  });
});

describe("E-10: Empty conversation", () => {
  it("get returns empty conversation with no messages, no crash", async () => {
    const store = createConversationStore(dbPath);
    const conversation = await store.create();
    const retrieved = await store.get(conversation.id);

    expect(retrieved).not.toBeNull();
    expect(retrieved!.messages).toEqual([]);
    expect(retrieved!.id).toBe(conversation.id);
  });
});

describe("ARCH-1: SQLite inspectable with standard tools", () => {
  it("database is readable with better-sqlite3 directly", async () => {
    const store = createConversationStore(dbPath);
    const conversation = await store.create();
    await store.appendMessage(conversation.id, {
      role: "user",
      content: "Test message for inspection",
    });

    // Open the database directly — not through the store
    const db = new Database(dbPath, { readonly: true });

    try {
      const conversations = db
        .prepare("SELECT * FROM conversations")
        .all() as Array<{ id: string }>;
      expect(conversations).toHaveLength(1);
      expect(conversations[0].id).toBe(conversation.id);

      const messages = db
        .prepare("SELECT * FROM messages")
        .all() as Array<{ conversation_id: string; role: string; content: string }>;
      expect(messages).toHaveLength(1);
      expect(messages[0].conversation_id).toBe(conversation.id);
      expect(messages[0].role).toBe("user");
      expect(messages[0].content).toBe("Test message for inspection");
    } finally {
      db.close();
    }
  });
});
