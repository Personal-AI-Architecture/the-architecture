/**
 * Owner Acceptance Tests
 *
 * Three end-to-end acceptance tests that verify the foundation promises:
 *   1. Swap Provider — change provider, conversations persist
 *   2. Move Memory — copy folder, restart, everything intact
 *   3. Add Tool — drop tool.json, restart, discovered
 *
 * Usage:
 *   npx tsx scripts/acceptance-check.ts
 *
 * No API key needed — uses mock providers.
 */

import { mkdtemp, rm, mkdir, writeFile, readFile, cp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { createMockProvider } from "../src/adapters/mock.js";
import { createMemoryTools } from "../src/memory/tools.js";
import { createMemoryToolExecutor } from "../src/memory/registry.js";
import { createToolExecutor } from "../src/engine/tool-executor.js";
import { createEngine } from "../src/engine/index.js";
import { createConversationStore } from "../src/gateway/conversation-store.js";
import { createGateway } from "../src/gateway/index.js";
import type { EngineEvent } from "../src/types/index.js";

// ─── Helpers ───

interface GatewayEvent extends EngineEvent {
  conversation_id?: string;
}

async function collectEvents(
  stream: AsyncIterable<GatewayEvent>,
): Promise<GatewayEvent[]> {
  const events: GatewayEvent[] = [];
  for await (const event of stream) {
    events.push(event);
  }
  return events;
}

function extractText(events: GatewayEvent[]): string {
  return events
    .filter((e): e is Extract<EngineEvent, { type: "text-delta" }> => e.type === "text-delta")
    .map((e) => e.content)
    .join("");
}

function extractConversationId(events: GatewayEvent[]): string | undefined {
  const doneEvent = events.find((e) => e.type === "done");
  return (doneEvent as GatewayEvent | undefined)?.conversation_id;
}

function createStack(
  memoryRoot: string,
  providerLabel: string,
) {
  const provider = createMockProvider({
    events: [
      { type: "text-delta", content: `Response from ${providerLabel}` },
      { type: "finish", finish_reason: "stop" },
    ],
  });

  const memoryTools = createMemoryTools(memoryRoot);
  const toolExecutor = createMemoryToolExecutor(memoryTools);
  const engine = createEngine(provider, toolExecutor);
  const conversationStore = createConversationStore(
    join(memoryRoot, ".data", "conversations.db"),
  );
  const gateway = createGateway({ engine, conversationStore });

  return { gateway, conversationStore, memoryTools };
}

// ─── Test 1: Swap Provider ───

async function testSwapProvider(): Promise<boolean> {
  console.log("  Test 1: Swap Provider");
  console.log("  ─ Start with Provider A, send message");
  console.log("  ─ Swap to Provider B (same memory), verify conversation persists\n");

  const memoryRoot = await mkdtemp(join(tmpdir(), "pai-accept-swap-"));

  try {
    // Provider A
    const stackA = createStack(memoryRoot, "Provider-A");
    const eventsA = await collectEvents(
      stackA.gateway.sendMessage({
        message: { role: "user", content: "Hello from swap test" },
      }),
    );

    const textA = extractText(eventsA);
    const convId = extractConversationId(eventsA);

    if (textA !== "Response from Provider-A" || !convId) {
      console.log("  FAIL  Provider A didn't respond correctly.");
      return false;
    }
    console.log(`  ✓ Provider A responded: "${textA}" (conv: ${convId})`);

    // Provider B — same memory root
    const stackB = createStack(memoryRoot, "Provider-B");

    // Verify conversation from A exists
    const existing = await stackB.conversationStore.get(convId);
    if (!existing || existing.messages.length < 2) {
      console.log("  FAIL  Conversation from Provider A not found after swap.");
      return false;
    }
    console.log(`  ✓ Conversation preserved after swap (${existing.messages.length} messages)`);

    // Send with Provider B
    const eventsB = await collectEvents(
      stackB.gateway.sendMessage({
        conversation_id: convId,
        message: { role: "user", content: "Follow-up after swap" },
      }),
    );

    const textB = extractText(eventsB);
    if (textB !== "Response from Provider-B") {
      console.log("  FAIL  Provider B didn't respond correctly.");
      return false;
    }
    console.log(`  ✓ Provider B responded: "${textB}"`);

    // Verify combined history
    const final = await stackB.conversationStore.get(convId);
    if (!final || final.messages.length < 4) {
      console.log("  FAIL  Combined conversation history incomplete.");
      return false;
    }
    console.log(`  ✓ Combined history: ${final.messages.length} messages (A + B)`);

    console.log("  PASS  Swap provider — zero code changes, config only.\n");
    return true;
  } finally {
    await rm(memoryRoot, { recursive: true, force: true });
  }
}

// ─── Test 2: Move Memory ───

async function testMoveMemory(): Promise<boolean> {
  console.log("  Test 2: Move Memory");
  console.log("  ─ Create files + conversation at location A");
  console.log("  ─ Copy entire folder to location B");
  console.log("  ─ Restart pointing to B, verify everything intact\n");

  const locationA = await mkdtemp(join(tmpdir(), "pai-accept-moveA-"));
  const locationB = await mkdtemp(join(tmpdir(), "pai-accept-moveB-"));
  // Clean B so we can cp into it
  await rm(locationB, { recursive: true, force: true });

  try {
    // Seed location A with files
    await writeFile(join(locationA, "notes.md"), "# My Notes\n\nImportant stuff here.\n");
    await mkdir(join(locationA, "projects"), { recursive: true });
    await writeFile(
      join(locationA, "projects", "todo.md"),
      "# Todos\n\n- Buy groceries\n- Read a book\n",
    );

    // Create conversation at A
    const stackA = createStack(locationA, "Mock");
    const eventsA = await collectEvents(
      stackA.gateway.sendMessage({
        message: { role: "user", content: "What are my todos?" },
      }),
    );
    const convId = extractConversationId(eventsA);
    if (!convId) {
      console.log("  FAIL  No conversation created at location A.");
      return false;
    }
    console.log(`  ✓ Files written + conversation created at A (conv: ${convId})`);

    // Copy A → B (the "move")
    await cp(locationA, locationB, { recursive: true });
    console.log(`  ✓ Copied A → B`);

    // Open at location B
    const stackB = createStack(locationB, "Mock");

    // Verify files
    const notes = await stackB.memoryTools.read({ path: "notes.md" });
    if (!notes.content.includes("Important stuff")) {
      console.log("  FAIL  notes.md not found at location B.");
      return false;
    }
    console.log(`  ✓ notes.md readable at B: "${notes.content.split("\n")[0]}"`);

    const todo = await stackB.memoryTools.read({ path: "projects/todo.md" });
    if (!todo.content.includes("Buy groceries")) {
      console.log("  FAIL  projects/todo.md not found at location B.");
      return false;
    }
    console.log(`  ✓ projects/todo.md readable at B: "${todo.content.split("\n")[0]}"`);

    // Verify conversation
    const conv = await stackB.conversationStore.get(convId);
    if (!conv || conv.messages.length < 2) {
      console.log("  FAIL  Conversation not found at location B.");
      return false;
    }
    console.log(`  ✓ Conversation intact at B (${conv.messages.length} messages)`);

    // Can continue conversation at B
    const eventsB = await collectEvents(
      stackB.gateway.sendMessage({
        conversation_id: convId,
        message: { role: "user", content: "Continue at new location" },
      }),
    );
    const textB = extractText(eventsB);
    if (!textB) {
      console.log("  FAIL  Cannot continue conversation at location B.");
      return false;
    }
    console.log(`  ✓ Conversation continues at B: "${textB}"`);

    console.log("  PASS  Move memory — copy folder, change config, everything works.\n");
    return true;
  } finally {
    await rm(locationA, { recursive: true, force: true });
    await rm(locationB, { recursive: true, force: true });
  }
}

// ─── Test 3: Add Tool ───

async function testAddTool(): Promise<boolean> {
  console.log("  Test 3: Add Tool");
  console.log("  ─ Start with memory tools only");
  console.log("  ─ Drop a tool.json manifest, restart");
  console.log("  ─ Verify new tool discovered alongside memory tools\n");

  const memoryRoot = await mkdtemp(join(tmpdir(), "pai-accept-tool-"));
  const toolsDir = join(memoryRoot, "tools");
  await mkdir(toolsDir, { recursive: true });

  try {
    // Initial: only memory tools
    const memoryTools = createMemoryTools(memoryRoot);
    const memoryExecutor = createMemoryToolExecutor(memoryTools);
    const executorBefore = await createToolExecutor(memoryExecutor, [toolsDir]);
    const toolsBefore = executorBefore.listTools().map((t) => t.name);

    console.log(`  ✓ Before: ${toolsBefore.length} tools [${toolsBefore.join(", ")}]`);

    if (toolsBefore.length !== 7) {
      console.log(`  FAIL  Expected 7 memory tools, got ${toolsBefore.length}.`);
      return false;
    }

    // Drop a new tool manifest
    const newToolDir = join(toolsDir, "weather");
    await mkdir(newToolDir, { recursive: true });
    await writeFile(
      join(newToolDir, "tool.json"),
      JSON.stringify({
        name: "get_weather",
        description: "Get current weather for a location",
        parameters: {
          type: "object",
          properties: {
            city: { type: "string", description: "City name" },
          },
          required: ["city"],
        },
      }),
    );
    console.log("  ✓ Dropped tools/weather/tool.json");

    // "Restart" — create new executor (simulates boot discovering tools)
    const executorAfter = await createToolExecutor(memoryExecutor, [toolsDir]);
    const toolsAfter = executorAfter.listTools().map((t) => t.name);

    console.log(`  ✓ After: ${toolsAfter.length} tools [${toolsAfter.join(", ")}]`);

    if (!toolsAfter.includes("get_weather")) {
      console.log("  FAIL  New tool 'get_weather' not discovered.");
      return false;
    }

    if (toolsAfter.length !== 8) {
      console.log(`  FAIL  Expected 8 tools (7 memory + 1 new), got ${toolsAfter.length}.`);
      return false;
    }

    // Memory tools still present
    for (const memTool of ["memory_read", "memory_write", "memory_search"]) {
      if (!toolsAfter.includes(memTool)) {
        console.log(`  FAIL  Memory tool '${memTool}' missing after adding external tool.`);
        return false;
      }
    }
    console.log("  ✓ All memory tools still present");

    // Agent Loop works with expanded tool set
    const provider = createMockProvider({
      events: [
        { type: "text-delta", content: "Weather is sunny" },
        { type: "finish", finish_reason: "stop" },
      ],
    });
    const engine = createEngine(provider, executorAfter);
    const events: EngineEvent[] = [];
    for await (const event of engine.chat({
      messages: [{ role: "user", content: "What's the weather?" }],
    })) {
      events.push(event);
    }

    const hasText = events.some((e) => e.type === "text-delta");
    const hasDone = events.some((e) => e.type === "done");
    if (!hasText || !hasDone) {
      console.log("  FAIL  Agent Loop doesn't work with expanded tool set.");
      return false;
    }
    console.log("  ✓ Agent Loop works with expanded tool set");

    // Remove tool, system still works
    await rm(newToolDir, { recursive: true, force: true });
    const executorRemoved = await createToolExecutor(memoryExecutor, [toolsDir]);
    const toolsRemoved = executorRemoved.listTools().map((t) => t.name);

    if (toolsRemoved.includes("get_weather")) {
      console.log("  FAIL  Removed tool still discovered.");
      return false;
    }
    if (toolsRemoved.length !== 7) {
      console.log(`  FAIL  Expected 7 tools after removal, got ${toolsRemoved.length}.`);
      return false;
    }
    console.log(`  ✓ Tool removed: back to ${toolsRemoved.length} tools`);

    console.log("  PASS  Add tool — drop manifest, restart, discovered. Remove, still works.\n");
    return true;
  } finally {
    await rm(memoryRoot, { recursive: true, force: true });
  }
}

// ─── Run All ───

console.log("\nOwner Acceptance Tests\n");
console.log("  No API key needed — uses mock providers.\n");

const results = [
  await testSwapProvider(),
  await testMoveMemory(),
  await testAddTool(),
];

const passed = results.filter(Boolean).length;
const total = results.length;

console.log(`  Acceptance: ${passed}/${total} passed.`);

if (passed < total) {
  process.exit(1);
}
