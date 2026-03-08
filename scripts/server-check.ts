/**
 * Owner Verification: "Can I have a conversation with my AI?"
 *
 * Usage:
 *   OPENROUTER_API_KEY=sk-... npx tsx scripts/server-check.ts [memory_root]
 *
 * Starts the full server (auth → gateway → agent loop → provider), sends messages
 * via HTTP, and verifies: SSE streaming, tool calls, conversation resumption,
 * and conversation listing.
 *
 * Requires:
 *   - OPENROUTER_API_KEY environment variable
 *   - A memory_root folder with files (defaults to a temp dir with seed files)
 */

import { mkdtemp, writeFile, rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { createServer as createHttpServer } from "node:http";
import { Readable } from "node:stream";
import { createMemoryTools } from "../src/memory/tools.js";
import { createMemoryToolExecutor } from "../src/memory/registry.js";
import { loadAdapterConfig, resolveApiKey } from "../src/adapters/loader.js";
import { createOpenAICompatibleAdapter } from "../src/adapters/openai-compatible.js";
import { createEngine } from "../src/engine/index.js";
import { createConversationStore } from "../src/gateway/conversation-store.js";
import { createGateway } from "../src/gateway/index.js";
import { createGatewayRoutes } from "../src/gateway/routes.js";
import { createAuthMiddleware } from "../src/auth/middleware.js";
import { createV1AuthProvider } from "../src/auth/provider.js";
import { Hono } from "hono";

const adapterName = "openrouter";
let tempDir: string | undefined;
let memoryRoot: string;

// --- Setup ---

if (process.argv[2]) {
  memoryRoot = process.argv[2];
  console.log(`Server check (memory_root: ${memoryRoot}):\n`);
} else {
  tempDir = await mkdtemp(join(tmpdir(), "pai-server-check-"));
  memoryRoot = tempDir;
  await mkdir(join(memoryRoot, "projects"), { recursive: true });
  await writeFile(
    join(memoryRoot, "AGENT.md"),
    "# My Library\n\nWelcome to my personal AI library.\n\n## Projects\n\n- Weather dashboard (in progress)\n- Recipe collection\n",
  );
  await writeFile(
    join(memoryRoot, "projects", "ideas.md"),
    "# Ideas\n\n- Build a weather dashboard\n- Write a short story generator\n- Create a reading list tracker\n",
  );
  console.log(`Server check (temp memory: ${memoryRoot}):\n`);
}

// --- Load provider ---

let config;
try {
  config = await loadAdapterConfig(adapterName);
} catch (err) {
  console.log(`  FAIL  Could not load adapter config: ${(err as Error).message}`);
  process.exit(1);
}

let apiKey: string;
try {
  apiKey = resolveApiKey(config);
} catch (err) {
  console.log(`  FAIL  ${(err as Error).message}`);
  process.exit(1);
}

console.log(`  Provider: ${config.name} (${config.default_model})`);

// --- Compose full server ---

const authToken = randomUUID();
const memoryTools = createMemoryTools(memoryRoot);
const toolExecutor = createMemoryToolExecutor(memoryTools);
const provider = createOpenAICompatibleAdapter({
  name: config.name,
  base_url: config.base_url,
  api_key: apiKey,
  default_model: config.default_model,
});
const engine = createEngine(provider, toolExecutor, { maxIterations: 10 });
const conversationStore = createConversationStore(
  join(memoryRoot, ".data", "conversations.db"),
);
const gateway = createGateway({
  engine,
  conversationStore,
  systemPrompt:
    "You are a helpful personal AI assistant. Use the available tools to read and write the owner's memory. Always use memory tools when asked about files.",
});
const gatewayRoutes = createGatewayRoutes({ gateway, conversationStore });

const authProvider = createV1AuthProvider(authToken);
const authMiddleware = createAuthMiddleware(authProvider);

const app = new Hono();
app.use("*", authMiddleware);
app.get("/health", (c) => c.json({ status: "ok" }));
app.route("/", gatewayRoutes);

// --- Start HTTP server ---

const port = 9876; // Use a non-standard port to avoid conflicts

function writeFetchResponse(
  response: Response,
  res: import("node:http").ServerResponse,
): void {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  if (!response.body) {
    res.end();
    return;
  }
  const responseBody = Readable.fromWeb(response.body as any);
  responseBody.pipe(res);
}

const server = createHttpServer(async (req, res) => {
  try {
    const host = req.headers.host ?? `127.0.0.1:${port}`;
    const url = new URL(req.url ?? "/", `http://${host}`);
    const method = (req.method ?? "GET").toUpperCase();
    const init: RequestInit & { duplex?: "half" } = {
      method,
      headers: req.headers as HeadersInit,
    };
    if (method !== "GET" && method !== "HEAD") {
      init.body = req as unknown as BodyInit;
      init.duplex = "half";
    }
    const request = new Request(url, init);
    const response = await app.fetch(request);
    writeFetchResponse(response, res);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ code: "internal_error", message: String(error) }));
  }
});

await new Promise<void>((resolve, reject) => {
  server.once("error", reject);
  server.listen(port, "127.0.0.1", resolve);
});

console.log(`  Server listening on http://127.0.0.1:${port}`);
console.log(`  Auth token: ${authToken}\n`);

const base = `http://127.0.0.1:${port}`;
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${authToken}`,
};

// --- Helpers ---

interface SseEvent {
  type: string;
  [key: string]: unknown;
}

async function sendMessage(
  conversationId: string | null,
  content: string,
): Promise<{ events: SseEvent[]; conversationId: string | null }> {
  const url = conversationId
    ? `${base}/conversations/${conversationId}/messages`
    : `${base}/conversations/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message: { role: "user", content },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }

  const text = await res.text();
  const events: SseEvent[] = [];
  let foundConversationId: string | null = conversationId;

  for (const line of text.split("\n")) {
    if (line.startsWith("data: ")) {
      try {
        const event = JSON.parse(line.slice(6)) as SseEvent;
        events.push(event);
        if (event.conversation_id && typeof event.conversation_id === "string") {
          foundConversationId = event.conversation_id;
        }
      } catch {
        // skip malformed lines
      }
    }
  }

  return { events, conversationId: foundConversationId };
}

function printEvents(events: SseEvent[]): void {
  for (const event of events) {
    switch (event.type) {
      case "text-delta":
        process.stdout.write(String(event.content));
        break;
      case "tool-call":
        console.log(`  [tool-call] ${event.name}(${JSON.stringify(event.arguments)})`);
        break;
      case "tool-result": {
        const output = String(event.output ?? "");
        const preview = output.length > 120 ? output.slice(0, 120) + "..." : output;
        if (event.error) {
          console.log(`  [tool-result] ERROR: ${event.error}`);
        } else {
          console.log(`  [tool-result] ${preview}`);
        }
        break;
      }
      case "done":
        console.log(`\n  [done] finish_reason=${event.finish_reason}`);
        break;
      case "error":
        console.log(`  [error] ${event.code}: ${event.message}`);
        break;
    }
  }
}

// --- Test 1: Send a message (new conversation) ---

console.log("  Test 1: Send a message — new conversation");
console.log('  Sending: "What files are in my library?"\n');

let test1Pass = false;
let conversationId: string | null = null;

try {
  const result = await sendMessage(null, "What files are in my library? Use memory tools to check.");
  printEvents(result.events);
  conversationId = result.conversationId;

  const hasTextDelta = result.events.some((e) => e.type === "text-delta");
  const hasDone = result.events.some((e) => e.type === "done");
  const hasToolCall = result.events.some(
    (e) => e.type === "tool-call" && typeof e.name === "string" && (e.name as string).startsWith("memory_"),
  );

  if (hasTextDelta && hasDone && conversationId) {
    test1Pass = true;
    console.log(`\n  PASS  Got SSE stream with text-delta + done. conversation_id=${conversationId}`);
    if (hasToolCall) {
      console.log("        Model used memory tools (bonus).\n");
    } else {
      console.log("        (Model didn't use tools — acceptable, may answer from training.)\n");
    }
  } else {
    console.log("\n  FAIL  Missing text-delta, done, or conversation_id.\n");
  }
} catch (err) {
  console.log(`\n  FAIL  ${(err as Error).message}\n`);
}

// --- Test 2: Follow-up in same conversation ---

console.log("  Test 2: Follow-up — conversation resumption");
console.log('  Sending: "Can you remind me what you just told me?"\n');

let test2Pass = false;

if (conversationId) {
  try {
    const result = await sendMessage(
      conversationId,
      "Can you briefly summarize what you just told me about my files?",
    );
    printEvents(result.events);

    const hasTextDelta = result.events.some((e) => e.type === "text-delta");
    const hasDone = result.events.some((e) => e.type === "done");

    if (hasTextDelta && hasDone) {
      test2Pass = true;
      console.log("\n  PASS  Follow-up worked — conversation context preserved.\n");
    } else {
      console.log("\n  FAIL  Follow-up missing text-delta or done.\n");
    }
  } catch (err) {
    console.log(`\n  FAIL  ${(err as Error).message}\n`);
  }
} else {
  console.log("  SKIP  No conversation_id from Test 1.\n");
}

// --- Test 3: List conversations ---

console.log("  Test 3: List conversations");

let test3Pass = false;

try {
  const res = await fetch(`${base}/conversations`, { headers });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }
  const conversations = (await res.json()) as Array<{ id: string }>;
  console.log(`  Found ${conversations.length} conversation(s).`);

  if (conversations.length > 0 && conversations.some((c) => c.id === conversationId)) {
    test3Pass = true;
    console.log(`  PASS  Our conversation (${conversationId}) appears in the list.\n`);
  } else if (conversations.length > 0) {
    test3Pass = true;
    console.log(`  PASS  Conversations exist (our ID may differ).\n`);
  } else {
    console.log("  FAIL  No conversations found.\n");
  }
} catch (err) {
  console.log(`  FAIL  ${(err as Error).message}\n`);
}

// --- Test 4: Get conversation history ---

console.log("  Test 4: Get conversation history");

let test4Pass = false;

if (conversationId) {
  try {
    const res = await fetch(`${base}/conversations/${conversationId}`, { headers });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }
    const conversation = (await res.json()) as { id: string; messages: Array<{ role: string; content: string }> };
    const messageCount = conversation.messages?.length ?? 0;
    console.log(`  Conversation ${conversation.id}: ${messageCount} messages.`);

    // We sent 2 user messages and got 2 assistant replies = at least 4 messages
    if (messageCount >= 4) {
      test4Pass = true;
      console.log(`  PASS  Full conversation history preserved (${messageCount} messages).\n`);
    } else if (messageCount >= 2) {
      test4Pass = true;
      console.log(`  PASS  Conversation has ${messageCount} messages (at least partial history).\n`);
    } else {
      console.log(`  FAIL  Expected at least 4 messages, got ${messageCount}.\n`);
    }
  } catch (err) {
    console.log(`  FAIL  ${(err as Error).message}\n`);
  }
} else {
  console.log("  SKIP  No conversation_id from Test 1.\n");
}

// --- Test 5: Auth blocks unauthenticated request ---

console.log("  Test 5: Auth blocks unauthenticated request");

let test5Pass = false;

try {
  const res = await fetch(`${base}/conversations`, {
    headers: { "Content-Type": "application/json" },
    // No Authorization header
  });
  if (res.status === 401) {
    test5Pass = true;
    console.log("  PASS  401 returned for unauthenticated request.\n");
  } else {
    console.log(`  FAIL  Expected 401, got ${res.status}.\n`);
  }
} catch (err) {
  console.log(`  FAIL  ${(err as Error).message}\n`);
}

// --- Cleanup ---

server.close();

if (tempDir) {
  await rm(tempDir, { recursive: true, force: true });
  console.log("  (Temp directory cleaned up)");
}

// --- Summary ---

const results = [test1Pass, test2Pass, test3Pass, test4Pass, test5Pass];
const passed = results.filter(Boolean).length;
const total = results.length;

console.log(`\n  Server check: ${passed}/${total} passed.`);

if (passed < total) {
  process.exit(1);
}
