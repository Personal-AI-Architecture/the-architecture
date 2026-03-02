/**
 * DEPLOY-1: Offline Operation (also covers FS-3 partially)
 *
 * "System functions fully without network when configured with local model."
 *
 * Test strategy:
 * Use mock provider (no network calls) and verify the full loop
 * completes: message → auth → gateway → engine → mock provider → response.
 * The mock provider simulates a local model — zero network required.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createServer } from "../../src/gateway/server.js";
import type { RuntimeConfig } from "../../src/types/index.js";

const AUTH_TOKEN = "test-token-deploy1";

describe("DEPLOY-1: Offline operation — full loop without network", () => {
  let memoryRoot: string;

  beforeEach(async () => {
    memoryRoot = await mkdtemp(join(tmpdir(), "pai-deploy1-"));
  });

  afterEach(async () => {
    await rm(memoryRoot, { recursive: true, force: true });
  });

  it("complete request lifecycle with mock provider (no network)", async () => {
    const config: RuntimeConfig = {
      memory_root: memoryRoot,
      provider_adapter: "mock",
      default_model: "local-model",
      tool_sources: [],
    };

    const app = await createServer({
      config,
      authToken: AUTH_TOKEN,
    });

    // Send message — all processing is local
    const response = await app.request(
      "http://localhost/conversations/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
        body: JSON.stringify({
          message: { role: "user", content: "Hello offline" },
        }),
      },
    );

    expect(response.status).toBe(200);
    const body = await response.text();

    // Verify we got SSE events (text-delta + done)
    expect(body).toContain("event: text-delta");
    expect(body).toContain("event: done");
  });

  it("conversations persist locally during offline operation", async () => {
    const config: RuntimeConfig = {
      memory_root: memoryRoot,
      provider_adapter: "mock",
      default_model: "local-model",
      tool_sources: [],
    };

    const app = await createServer({
      config,
      authToken: AUTH_TOKEN,
    });

    // Create a conversation
    await app.request("http://localhost/conversations/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        message: { role: "user", content: "Persisted offline" },
      }),
    });

    // List conversations — should be stored locally
    const listResponse = await app.request("http://localhost/conversations", {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
    });

    expect(listResponse.status).toBe(200);
    const conversations = (await listResponse.json()) as Array<{ id: string }>;
    expect(conversations.length).toBe(1);
  });
});
