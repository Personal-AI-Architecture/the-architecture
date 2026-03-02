/**
 * Provider Adapter — Unit Tests
 *
 * Tests OpenAI-compatible adapter: message translation, tool translation,
 * SSE parsing, error handling, config loading.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createServer, type Server } from "node:http";
import * as fc from "fast-check";
import type { ProviderAdapter, ProviderEvent, Message, ToolDefinition } from "../../src/types/index.js";

let createOpenAICompatibleAdapter: (config: {
  name: string;
  base_url: string;
  api_key: string;
  default_model: string;
}) => ProviderAdapter;

let loadAdapterConfig: (name: string) => Promise<{
  name: string;
  base_url: string;
  api_key_ref: string;
  format: string;
  default_model: string;
}>;

let resolveApiKey: (config: { api_key_ref: string }) => string;

beforeEach(async () => {
  const adapterMod = await import("../../src/adapters/openai-compatible.js");
  const loaderMod = await import("../../src/adapters/loader.js");
  createOpenAICompatibleAdapter = adapterMod.createOpenAICompatibleAdapter;
  loadAdapterConfig = loaderMod.loadAdapterConfig;
  resolveApiKey = loaderMod.resolveApiKey;
});

// Helper: create a local HTTP server that returns SSE
function createSSEServer(sseData: string): Promise<{ server: Server; port: number }> {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      // Capture the request for assertions
      (server as Server & { lastRequest?: { headers: Record<string, string | string[] | undefined>; body: string } }).lastRequest = {
        headers: req.headers as Record<string, string | string[] | undefined>,
        body: "",
      };
      let body = "";
      req.on("data", (chunk) => { body += chunk; });
      req.on("end", () => {
        (server as Server & { lastRequest?: { headers: Record<string, string | string[] | undefined>; body: string } }).lastRequest!.body = body;

        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });
        res.write(sseData);
        res.end();
      });
    });
    server.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      resolve({ server, port });
    });
  });
}

function createErrorServer(statusCode: number, body: string): Promise<{ server: Server; port: number }> {
  return new Promise((resolve) => {
    const server = createServer((_req, res) => {
      res.writeHead(statusCode, { "Content-Type": "application/json" });
      res.end(body);
    });
    server.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      resolve({ server, port });
    });
  });
}

async function collectEvents(adapter: ProviderAdapter, messages: Message[], tools: ToolDefinition[] = []): Promise<ProviderEvent[]> {
  const events: ProviderEvent[] = [];
  for await (const event of adapter.complete(messages, tools)) {
    events.push(event);
  }
  return events;
}

describe("Message translation", () => {
  it("translates messages to OpenAI format", async () => {
    const sseData = `data: {"id":"1","choices":[{"delta":{"content":"Hi"},"index":0}]}\n\ndata: {"id":"1","choices":[{"finish_reason":"stop","index":0}],"usage":{"prompt_tokens":10,"completion_tokens":1}}\n\ndata: [DONE]\n\n`;

    const { server, port } = await createSSEServer(sseData);
    try {
      const adapter = createOpenAICompatibleAdapter({
        name: "test",
        base_url: `http://localhost:${port}/v1`,
        api_key: "test-key",
        default_model: "test-model",
      });

      const messages: Message[] = [
        { role: "system", content: "You are helpful." },
        { role: "user", content: "Hello" },
      ];

      const events = await collectEvents(adapter, messages);
      expect(events.some((e) => e.type === "text-delta")).toBe(true);

      // Verify the request was made correctly
      const lastReq = (server as Server & { lastRequest?: { headers: Record<string, string | string[] | undefined>; body: string } }).lastRequest!;
      const body = JSON.parse(lastReq.body);
      expect(body.messages).toHaveLength(2);
      expect(body.messages[0].role).toBe("system");
      expect(body.messages[1].role).toBe("user");
      expect(body.model).toBe("test-model");
      expect(body.stream).toBe(true);
    } finally {
      server.close();
    }
  });

  it("translates tools to OpenAI function calling format", async () => {
    const sseData = `data: {"id":"1","choices":[{"delta":{"content":"OK"},"index":0}]}\n\ndata: {"id":"1","choices":[{"finish_reason":"stop","index":0}]}\n\ndata: [DONE]\n\n`;

    const { server, port } = await createSSEServer(sseData);
    try {
      const adapter = createOpenAICompatibleAdapter({
        name: "test",
        base_url: `http://localhost:${port}/v1`,
        api_key: "test-key",
        default_model: "test-model",
      });

      const tools: ToolDefinition[] = [
        {
          name: "memory_read",
          description: "Read a file",
          parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] },
        },
      ];

      await collectEvents(adapter, [{ role: "user", content: "test" }], tools);

      const lastReq = (server as Server & { lastRequest?: { headers: Record<string, string | string[] | undefined>; body: string } }).lastRequest!;
      const body = JSON.parse(lastReq.body);
      expect(body.tools).toHaveLength(1);
      expect(body.tools[0].type).toBe("function");
      expect(body.tools[0].function.name).toBe("memory_read");
      expect(body.tools[0].function.parameters).toBeDefined();
    } finally {
      server.close();
    }
  });
});

describe("SSE parsing", () => {
  it("parses text-delta events", async () => {
    const sseData = `data: {"id":"1","choices":[{"delta":{"content":"Hello "},"index":0}]}\n\ndata: {"id":"1","choices":[{"delta":{"content":"world"},"index":0}]}\n\ndata: {"id":"1","choices":[{"finish_reason":"stop","index":0}]}\n\ndata: [DONE]\n\n`;

    const { server, port } = await createSSEServer(sseData);
    try {
      const adapter = createOpenAICompatibleAdapter({
        name: "test",
        base_url: `http://localhost:${port}/v1`,
        api_key: "test-key",
        default_model: "test-model",
      });

      const events = await collectEvents(adapter, [{ role: "user", content: "hi" }]);

      const textDeltas = events.filter((e) => e.type === "text-delta");
      expect(textDeltas).toHaveLength(2);
      expect((textDeltas[0] as { type: "text-delta"; content: string }).content).toBe("Hello ");
      expect((textDeltas[1] as { type: "text-delta"; content: string }).content).toBe("world");
    } finally {
      server.close();
    }
  });

  it("parses tool-call events with streamed arguments", async () => {
    const sseData = [
      `data: {"id":"1","choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_1","function":{"name":"memory_read","arguments":""}}]},"index":0}]}`,
      `data: {"id":"1","choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\\"path\\":"}}]},"index":0}]}`,
      `data: {"id":"1","choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"\\"notes.md\\"}"}}]},"index":0}]}`,
      `data: {"id":"1","choices":[{"finish_reason":"tool_calls","index":0}],"usage":{"prompt_tokens":50,"completion_tokens":20}}`,
      `data: [DONE]`,
    ].join("\n\n") + "\n\n";

    const { server, port } = await createSSEServer(sseData);
    try {
      const adapter = createOpenAICompatibleAdapter({
        name: "test",
        base_url: `http://localhost:${port}/v1`,
        api_key: "test-key",
        default_model: "test-model",
      });

      const events = await collectEvents(adapter, [{ role: "user", content: "read notes" }]);

      const toolCalls = events.filter((e) => e.type === "tool-call");
      expect(toolCalls.length).toBeGreaterThanOrEqual(1);
      const tc = toolCalls[0] as { type: "tool-call"; id: string; name: string; arguments: Record<string, unknown> };
      expect(tc.id).toBe("call_1");
      expect(tc.name).toBe("memory_read");
      expect(tc.arguments).toEqual({ path: "notes.md" });
    } finally {
      server.close();
    }
  });
});

describe("P-4: Format roundtrip — message semantics preserved", () => {
  it("messages maintain role and content through translation", async () => {
    const sseData = `data: {"id":"1","choices":[{"delta":{"content":"ok"},"index":0}]}\n\ndata: {"id":"1","choices":[{"finish_reason":"stop","index":0}]}\n\ndata: [DONE]\n\n`;

    const { server, port } = await createSSEServer(sseData);
    try {
      const adapter = createOpenAICompatibleAdapter({
        name: "test",
        base_url: `http://localhost:${port}/v1`,
        api_key: "test-key",
        default_model: "test-model",
      });

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 500 }),
          async (content) => {
            const messages: Message[] = [{ role: "user", content }];
            await collectEvents(adapter, messages);

            const lastReq = (server as Server & { lastRequest?: { headers: Record<string, string | string[] | undefined>; body: string } }).lastRequest!;
            const body = JSON.parse(lastReq.body);
            expect(body.messages[0].role).toBe("user");
            expect(body.messages[0].content).toBe(content);
          },
        ),
        { numRuns: 10 },
      );
    } finally {
      server.close();
    }
  });
});

describe("Error handling", () => {
  it("401 — bad API key", async () => {
    const { server, port } = await createErrorServer(401, '{"error":{"message":"Invalid API key"}}');
    try {
      const adapter = createOpenAICompatibleAdapter({
        name: "test",
        base_url: `http://localhost:${port}/v1`,
        api_key: "bad-key",
        default_model: "test-model",
      });

      const events = await collectEvents(adapter, [{ role: "user", content: "hi" }]);
      const errors = events.filter((e) => e.type === "error");
      expect(errors.length).toBeGreaterThanOrEqual(1);
    } finally {
      server.close();
    }
  });

  it("429 — rate limited", async () => {
    const { server, port } = await createErrorServer(429, '{"error":{"message":"Rate limited"}}');
    try {
      const adapter = createOpenAICompatibleAdapter({
        name: "test",
        base_url: `http://localhost:${port}/v1`,
        api_key: "test-key",
        default_model: "test-model",
      });

      const events = await collectEvents(adapter, [{ role: "user", content: "hi" }]);
      const errors = events.filter((e) => e.type === "error");
      expect(errors.length).toBeGreaterThanOrEqual(1);
    } finally {
      server.close();
    }
  });

  it("502 — provider down", async () => {
    const { server, port } = await createErrorServer(502, "Bad Gateway");
    try {
      const adapter = createOpenAICompatibleAdapter({
        name: "test",
        base_url: `http://localhost:${port}/v1`,
        api_key: "test-key",
        default_model: "test-model",
      });

      const events = await collectEvents(adapter, [{ role: "user", content: "hi" }]);
      const errors = events.filter((e) => e.type === "error");
      expect(errors.length).toBeGreaterThanOrEqual(1);
    } finally {
      server.close();
    }
  });

  it("E-13: malformed SSE handled gracefully", async () => {
    const sseData = `data: not valid json\n\ndata: {"id":"1","choices":[{"finish_reason":"stop","index":0}]}\n\ndata: [DONE]\n\n`;

    const { server, port } = await createSSEServer(sseData);
    try {
      const adapter = createOpenAICompatibleAdapter({
        name: "test",
        base_url: `http://localhost:${port}/v1`,
        api_key: "test-key",
        default_model: "test-model",
      });

      // Should not throw — should handle gracefully
      const events = await collectEvents(adapter, [{ role: "user", content: "hi" }]);
      expect(events.length).toBeGreaterThanOrEqual(1);
    } finally {
      server.close();
    }
  });
});

describe("Config loading", () => {
  it("loads adapter config from JSON file", async () => {
    const config = await loadAdapterConfig("openrouter");
    expect(config.name).toBe("openrouter");
    expect(config.base_url).toBeTruthy();
    expect(config.format).toBe("openai-compatible");
  });

  it("resolves API key from environment variable", () => {
    const originalKey = process.env.TEST_API_KEY;
    process.env.TEST_API_KEY = "resolved-key-value";

    try {
      const key = resolveApiKey({ api_key_ref: "TEST_API_KEY" } as Parameters<typeof resolveApiKey>[0]);
      expect(key).toBe("resolved-key-value");
    } finally {
      if (originalKey !== undefined) {
        process.env.TEST_API_KEY = originalKey;
      } else {
        delete process.env.TEST_API_KEY;
      }
    }
  });

  it("returns empty string for empty api_key_ref (local providers)", () => {
    const key = resolveApiKey({ api_key_ref: "" } as Parameters<typeof resolveApiKey>[0]);
    expect(key).toBe("");
  });
});
