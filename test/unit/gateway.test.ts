/**
 * Gateway Core — Unit Tests
 *
 * Tests sendMessage: streams response, persists messages, assembles conversation.
 * Verifies the Gateway does NOT interpret content, execute tools, or authenticate.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type {
  ConversationStore,
  Conversation,
  ConversationSummary,
  EngineEvent,
  EngineRequest,
  Message,
} from "../../src/types/index.js";

// --- Helpers: mock engine, mock conversation store ---

function createMockEngine(events: EngineEvent[]) {
  const chatCalls: EngineRequest[] = [];

  return {
    chatCalls,
    chat(request: EngineRequest): AsyncIterable<EngineEvent> {
      chatCalls.push(request);
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

function createMockConversationStore(): ConversationStore & {
  conversations: Map<string, Conversation>;
} {
  const conversations = new Map<string, Conversation>();
  let counter = 0;

  return {
    conversations,

    async create(): Promise<Conversation> {
      counter++;
      const now = new Date().toISOString();
      const conv: Conversation = {
        id: `conv_${counter}`,
        created_at: now,
        updated_at: now,
        messages: [],
      };
      conversations.set(conv.id, conv);
      return conv;
    },

    async get(id: string): Promise<Conversation | null> {
      return conversations.get(id) ?? null;
    },

    async list(
      query?: { limit?: number; offset?: number },
    ): Promise<ConversationSummary[]> {
      const all = [...conversations.values()];
      const offset = query?.offset ?? 0;
      const limit = query?.limit ?? all.length;
      return all.slice(offset, offset + limit).map((c) => ({
        id: c.id,
        created_at: c.created_at,
        updated_at: c.updated_at,
        message_count: c.messages.length,
      }));
    },

    async appendMessage(id: string, message: Message): Promise<void> {
      const conv = conversations.get(id);
      if (!conv) throw new Error(`Conversation not found: ${id}`);
      conv.messages.push(message);
      conv.updated_at = new Date().toISOString();
    },
  };
}

// --- Tests ---

let createGateway: (deps: {
  engine: { chat(request: EngineRequest): AsyncIterable<EngineEvent> };
  conversationStore: ConversationStore;
  systemPrompt?: string;
}) => {
  sendMessage(request: {
    conversation_id?: string;
    message: Message;
    metadata?: Record<string, unknown>;
  }): AsyncIterable<EngineEvent>;
};

beforeEach(async () => {
  const mod = await import("../../src/gateway/index.js");
  createGateway = mod.createGateway;
});

async function collectEvents(
  stream: AsyncIterable<EngineEvent>,
): Promise<EngineEvent[]> {
  const events: EngineEvent[] = [];
  for await (const event of stream) {
    events.push(event);
  }
  return events;
}

describe("Gateway sendMessage streams response", () => {
  it("streams text-delta events from engine", async () => {
    const engine = createMockEngine([
      { type: "text-delta", content: "Hello " },
      { type: "text-delta", content: "world!" },
      { type: "done", finish_reason: "stop" },
    ]);
    const store = createMockConversationStore();
    const gateway = createGateway({ engine, conversationStore: store });

    const events = await collectEvents(
      gateway.sendMessage({
        message: { role: "user", content: "Hi" },
      }),
    );

    expect(events).toHaveLength(3);
    expect(events[0]).toEqual({ type: "text-delta", content: "Hello " });
    expect(events[1]).toEqual({ type: "text-delta", content: "world!" });
    expect(events[2]).toMatchObject({ type: "done", finish_reason: "stop" });
  });

  it("creates new conversation when no conversation_id provided", async () => {
    const engine = createMockEngine([
      { type: "text-delta", content: "Hi" },
      { type: "done", finish_reason: "stop" },
    ]);
    const store = createMockConversationStore();
    const gateway = createGateway({ engine, conversationStore: store });

    await collectEvents(
      gateway.sendMessage({
        message: { role: "user", content: "Hello" },
      }),
    );

    expect(store.conversations.size).toBe(1);
  });

  it("uses existing conversation when conversation_id provided", async () => {
    const engine = createMockEngine([
      { type: "text-delta", content: "Response" },
      { type: "done", finish_reason: "stop" },
    ]);
    const store = createMockConversationStore();
    const conv = await store.create();
    await store.appendMessage(conv.id, {
      role: "user",
      content: "Previous message",
    });

    const gateway = createGateway({ engine, conversationStore: store });

    await collectEvents(
      gateway.sendMessage({
        conversation_id: conv.id,
        message: { role: "user", content: "Follow up" },
      }),
    );

    // Should have the previous message + new user + assistant response
    const retrieved = await store.get(conv.id);
    expect(retrieved!.messages.length).toBeGreaterThanOrEqual(3);
  });
});

describe("Gateway persists messages", () => {
  it("persists user message before calling engine", async () => {
    const engine = createMockEngine([
      { type: "text-delta", content: "OK" },
      { type: "done", finish_reason: "stop" },
    ]);
    const store = createMockConversationStore();
    const gateway = createGateway({ engine, conversationStore: store });

    await collectEvents(
      gateway.sendMessage({
        message: { role: "user", content: "Save me" },
      }),
    );

    const convId = [...store.conversations.keys()][0];
    const conv = await store.get(convId);
    const userMsgs = conv!.messages.filter((m) => m.role === "user");
    expect(userMsgs).toHaveLength(1);
    expect(userMsgs[0].content).toBe("Save me");
  });

  it("persists assistant response after stream completes", async () => {
    const engine = createMockEngine([
      { type: "text-delta", content: "Hello " },
      { type: "text-delta", content: "there" },
      { type: "done", finish_reason: "stop" },
    ]);
    const store = createMockConversationStore();
    const gateway = createGateway({ engine, conversationStore: store });

    await collectEvents(
      gateway.sendMessage({
        message: { role: "user", content: "Hi" },
      }),
    );

    const convId = [...store.conversations.keys()][0];
    const conv = await store.get(convId);
    const assistantMsgs = conv!.messages.filter(
      (m) => m.role === "assistant",
    );
    expect(assistantMsgs).toHaveLength(1);
    expect(assistantMsgs[0].content).toBe("Hello there");
  });
});

describe("Gateway assembles conversation context", () => {
  it("passes system prompt + conversation history + current message to engine", async () => {
    const engine = createMockEngine([
      { type: "text-delta", content: "OK" },
      { type: "done", finish_reason: "stop" },
    ]);
    const store = createMockConversationStore();
    const systemPrompt = "Read /AGENT.md for your instructions.";
    const gateway = createGateway({
      engine,
      conversationStore: store,
      systemPrompt,
    });

    await collectEvents(
      gateway.sendMessage({
        message: { role: "user", content: "Hello" },
      }),
    );

    expect(engine.chatCalls).toHaveLength(1);
    const request = engine.chatCalls[0];

    // Should contain: system + user
    expect(request.messages[0].role).toBe("system");
    expect(request.messages[0].content).toBe(systemPrompt);
    expect(request.messages[request.messages.length - 1].role).toBe("user");
    expect(request.messages[request.messages.length - 1].content).toBe(
      "Hello",
    );
  });

  it("includes conversation history for existing conversations", async () => {
    const engine = createMockEngine([
      { type: "text-delta", content: "Response" },
      { type: "done", finish_reason: "stop" },
    ]);
    const store = createMockConversationStore();
    const conv = await store.create();
    await store.appendMessage(conv.id, {
      role: "user",
      content: "First question",
    });
    await store.appendMessage(conv.id, {
      role: "assistant",
      content: "First answer",
    });

    const gateway = createGateway({
      engine,
      conversationStore: store,
      systemPrompt: "System",
    });

    await collectEvents(
      gateway.sendMessage({
        conversation_id: conv.id,
        message: { role: "user", content: "Follow up" },
      }),
    );

    const request = engine.chatCalls[0];
    // system + first question + first answer + follow up
    expect(request.messages).toHaveLength(4);
    expect(request.messages[0].role).toBe("system");
    expect(request.messages[1].content).toBe("First question");
    expect(request.messages[2].content).toBe("First answer");
    expect(request.messages[3].content).toBe("Follow up");
  });
});

describe("Gateway does NOT interpret content", () => {
  it("message content passes through unmodified", async () => {
    const engine = createMockEngine([
      { type: "text-delta", content: "OK" },
      { type: "done", finish_reason: "stop" },
    ]);
    const store = createMockConversationStore();
    const gateway = createGateway({ engine, conversationStore: store });

    const weirdContent = '{"json": true} <html> \x00 emoji: 🎉 unicode: 日本語';

    await collectEvents(
      gateway.sendMessage({
        message: { role: "user", content: weirdContent },
      }),
    );

    const request = engine.chatCalls[0];
    const userMsg = request.messages.find((m) => m.role === "user");
    expect(userMsg!.content).toBe(weirdContent);
  });
});

describe("Gateway does NOT execute tools", () => {
  it("tool-call events pass through without gateway executing them", async () => {
    const engine = createMockEngine([
      {
        type: "tool-call",
        id: "tc_1",
        name: "memory_read",
        arguments: { path: "test.md" },
      },
      { type: "tool-result", id: "tc_1", output: "file content" },
      { type: "text-delta", content: "Done" },
      { type: "done", finish_reason: "stop" },
    ]);
    const store = createMockConversationStore();
    const gateway = createGateway({ engine, conversationStore: store });

    const events = await collectEvents(
      gateway.sendMessage({
        message: { role: "user", content: "Read a file" },
      }),
    );

    // Gateway should pass through tool events — it doesn't execute tools
    const toolCallEvents = events.filter((e) => e.type === "tool-call");
    const toolResultEvents = events.filter((e) => e.type === "tool-result");
    expect(toolCallEvents).toHaveLength(1);
    expect(toolResultEvents).toHaveLength(1);
  });
});

describe("Gateway does NOT authenticate", () => {
  it("no auth logic exists in gateway — sendMessage has no auth parameter", async () => {
    const engine = createMockEngine([
      { type: "text-delta", content: "Hi" },
      { type: "done", finish_reason: "stop" },
    ]);
    const store = createMockConversationStore();
    const gateway = createGateway({ engine, conversationStore: store });

    // sendMessage should work without any auth context
    const events = await collectEvents(
      gateway.sendMessage({
        message: { role: "user", content: "Hello" },
      }),
    );

    expect(events.length).toBeGreaterThan(0);
  });
});
