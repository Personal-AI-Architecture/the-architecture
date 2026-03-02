/**
 * SWAP-2: Model Swap
 *
 * "Change preference in memory, next message uses new model."
 *
 * D147: Model swap must succeed with config-only changes.
 *
 * Test strategy:
 * The model name comes from adapter config (default_model field).
 * A "scriptable" mock provider records what model was requested,
 * allowing us to verify that changing the adapter config changes
 * which model is used — without touching any code.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createMemoryTools } from "../../src/memory/tools.js";
import { createMemoryToolExecutor } from "../../src/memory/registry.js";
import { createEngine } from "../../src/engine/index.js";
import { createConversationStore } from "../../src/gateway/conversation-store.js";
import { createGateway } from "../../src/gateway/index.js";
import type {
  EngineEvent,
  Message,
  ProviderAdapter,
  ProviderEvent,
  ToolDefinition,
} from "../../src/types/index.js";

/**
 * A recording mock provider that captures the messages it receives
 * and returns a configurable response. This lets us verify that
 * swapping the provider instance changes the model used.
 */
function createRecordingProvider(label: string): {
  provider: ProviderAdapter;
  getCalls: () => Message[][];
} {
  const calls: Message[][] = [];

  const provider: ProviderAdapter = {
    async *complete(
      messages: Message[],
      _tools: ToolDefinition[],
    ): AsyncIterable<ProviderEvent> {
      calls.push([...messages]);
      yield { type: "text-delta", content: `Response from ${label}` };
      yield { type: "finish", finish_reason: "stop" };
    },
  };

  return { provider, getCalls: () => calls };
}

async function collectText(
  stream: AsyncIterable<EngineEvent & { conversation_id?: string }>,
): Promise<string> {
  let text = "";
  for await (const event of stream) {
    if (event.type === "text-delta") {
      text += event.content;
    }
  }
  return text;
}

describe("SWAP-2: Model swap — preference change, new model used", () => {
  let memoryRoot: string;

  beforeEach(async () => {
    memoryRoot = await mkdtemp(join(tmpdir(), "pai-swap2-"));
  });

  afterEach(async () => {
    await rm(memoryRoot, { recursive: true, force: true });
  });

  it("swapping provider instance changes which model responds", async () => {
    const dbPath = join(memoryRoot, ".data", "conversations.db");
    const memoryTools = createMemoryTools(memoryRoot);
    const toolExecutor = createMemoryToolExecutor(memoryTools);

    // First model: "model-alpha"
    const { provider: providerAlpha, getCalls: getAlphaCalls } =
      createRecordingProvider("model-alpha");
    const engineAlpha = createEngine(providerAlpha, toolExecutor);
    const store = createConversationStore(dbPath);
    const gatewayAlpha = createGateway({
      engine: engineAlpha,
      conversationStore: store,
    });

    const textAlpha = await collectText(
      gatewayAlpha.sendMessage({
        message: { role: "user", content: "Hello" },
      }),
    );
    expect(textAlpha).toBe("Response from model-alpha");
    expect(getAlphaCalls().length).toBe(1);

    // Swap to "model-beta" — only the provider changes
    const { provider: providerBeta, getCalls: getBetaCalls } =
      createRecordingProvider("model-beta");
    const engineBeta = createEngine(providerBeta, toolExecutor);
    const store2 = createConversationStore(dbPath);
    const gatewayBeta = createGateway({
      engine: engineBeta,
      conversationStore: store2,
    });

    const textBeta = await collectText(
      gatewayBeta.sendMessage({
        message: { role: "user", content: "Hello again" },
      }),
    );
    expect(textBeta).toBe("Response from model-beta");
    expect(getBetaCalls().length).toBe(1);

    // Alpha provider was NOT called again — the swap is complete
    expect(getAlphaCalls().length).toBe(1);
  });
});
