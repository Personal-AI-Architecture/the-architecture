/**
 * Mock Provider — Unit Tests
 *
 * Tests the mock provider that replays scripted scenarios.
 */

import { describe, it, expect, beforeEach } from "vitest";
import type { ProviderAdapter, ProviderEvent } from "../../src/types/index.js";

let createMockProvider: (scenario: { events: ProviderEvent[] }) => ProviderAdapter;

beforeEach(async () => {
  const mod = await import("../../src/adapters/mock.js");
  createMockProvider = mod.createMockProvider;
});

async function collectEvents(adapter: ProviderAdapter): Promise<ProviderEvent[]> {
  const events: ProviderEvent[] = [];
  for await (const event of adapter.complete([], [])) {
    events.push(event);
  }
  return events;
}

describe("Mock provider", () => {
  it("returns predetermined text as ProviderEvents", async () => {
    const scenario: { events: ProviderEvent[] } = {
      events: [
        { type: "text-delta", content: "Hello " },
        { type: "text-delta", content: "world" },
        { type: "finish", finish_reason: "stop" },
      ],
    };

    const provider = createMockProvider(scenario);
    const events = await collectEvents(provider);

    expect(events).toHaveLength(3);
    expect(events[0]).toEqual({ type: "text-delta", content: "Hello " });
    expect(events[1]).toEqual({ type: "text-delta", content: "world" });
    expect(events[2]).toEqual({ type: "finish", finish_reason: "stop" });
  });

  it("returns scripted tool_call event", async () => {
    const scenario: { events: ProviderEvent[] } = {
      events: [
        { type: "tool-call", id: "call_1", name: "memory_read", arguments: { path: "notes.md" } },
        { type: "finish", finish_reason: "tool_calls" },
      ],
    };

    const provider = createMockProvider(scenario);
    const events = await collectEvents(provider);

    expect(events).toHaveLength(2);
    expect(events[0].type).toBe("tool-call");
    const tc = events[0] as { type: "tool-call"; id: string; name: string; arguments: Record<string, unknown> };
    expect(tc.name).toBe("memory_read");
    expect(tc.arguments).toEqual({ path: "notes.md" });
  });

  it("returns scripted error event", async () => {
    const scenario: { events: ProviderEvent[] } = {
      events: [
        { type: "error", code: "provider_error", message: "Model unavailable" },
      ],
    };

    const provider = createMockProvider(scenario);
    const events = await collectEvents(provider);

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("error");
    const err = events[0] as { type: "error"; code: string; message: string };
    expect(err.code).toBe("provider_error");
    expect(err.message).toBe("Model unavailable");
  });
});
