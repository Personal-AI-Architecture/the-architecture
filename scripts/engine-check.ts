/**
 * Owner Verification: "Can my AI read and write my memory?"
 *
 * Usage:
 *   OPENROUTER_API_KEY=sk-... npx tsx scripts/engine-check.ts [memory_root]
 *
 * Runs the Engine with real memory tools and a real model provider.
 * Sends a prompt that triggers tool calls: read a file, write a file, verify.
 *
 * Requires:
 *   - OPENROUTER_API_KEY environment variable
 *   - A memory_root folder with at least one file (defaults to a temp dir with seed files)
 */

import { mkdtemp, writeFile, readFile, rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createMemoryTools } from "../src/memory/tools.js";
import { createMemoryToolExecutor } from "../src/memory/registry.js";
import { loadAdapterConfig, resolveApiKey } from "../src/adapters/loader.js";
import { createOpenAICompatibleAdapter } from "../src/adapters/openai-compatible.js";
import { createEngine } from "../src/engine/index.js";
import type { EngineEvent, Message } from "../src/types/index.js";

const adapterName = "openrouter";
let tempDir: string | undefined;
let memoryRoot: string;

// --- Setup ---

if (process.argv[2]) {
  memoryRoot = process.argv[2];
  console.log(`Engine check (memory_root: ${memoryRoot}):\n`);
} else {
  tempDir = await mkdtemp(join(tmpdir(), "pai-engine-check-"));
  memoryRoot = tempDir;
  await mkdir(join(memoryRoot, "projects"), { recursive: true });
  await writeFile(
    join(memoryRoot, "AGENT.md"),
    "# My Library\n\nWelcome to my personal AI library. It contains projects and notes.\n",
  );
  await writeFile(
    join(memoryRoot, "projects", "ideas.md"),
    "# Ideas\n\n- Build a weather dashboard\n- Write a short story generator\n",
  );
  console.log(`Engine check (temp memory: ${memoryRoot}):\n`);
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

// --- Create engine ---

const memoryTools = createMemoryTools(memoryRoot);
const toolExecutor = createMemoryToolExecutor(memoryTools);
const provider = createOpenAICompatibleAdapter({
  name: config.name,
  base_url: config.base_url,
  api_key: apiKey,
  default_model: config.default_model,
});
const engine = createEngine(provider, toolExecutor, { maxIterations: 10 });

// --- Test 1: Read a file ---

console.log("\n  Test 1: Read a file from memory");
console.log("  Sending: \"Use the memory_read tool to read AGENT.md and tell me what it says.\"\n");

let readWorked = false;
const readMessages: Message[] = [
  {
    role: "system",
    content: "You are a helpful assistant. Use the available tools to interact with the user's memory. Always use tools when asked to read or write files.",
  },
  {
    role: "user",
    content: "Use the memory_read tool to read AGENT.md and tell me what it says.",
  },
];

for await (const event of engine.chat({ messages: readMessages })) {
  logEvent(event);
  if (event.type === "tool-call" && event.name === "memory_read") {
    readWorked = true;
  }
}

if (readWorked) {
  console.log("\n  PASS  Model called memory_read on a real file.\n");
} else {
  console.log("\n  FAIL  Model did not call memory_read.\n");
}

// --- Test 2: Write a file ---

console.log("  Test 2: Write a file to memory");
console.log("  Sending: \"Use the memory_write tool to create a file called engine-test.md\"\n");

let writeWorked = false;
const writeMessages: Message[] = [
  {
    role: "system",
    content: "You are a helpful assistant. Use the available tools to interact with the user's memory. Always use tools when asked to read or write files.",
  },
  {
    role: "user",
    content:
      'Use the memory_write tool to create a file called "engine-test.md" with the content "# Engine Test\\n\\nThis file was created by the engine-check script."',
  },
];

for await (const event of engine.chat({ messages: writeMessages })) {
  logEvent(event);
  if (event.type === "tool-call" && event.name === "memory_write") {
    writeWorked = true;
  }
}

// Verify file exists on disk
let fileOnDisk = false;
try {
  const content = await readFile(join(memoryRoot, "engine-test.md"), "utf-8");
  if (content.includes("Engine Test")) {
    fileOnDisk = true;
  }
} catch {
  // file not found
}

if (writeWorked && fileOnDisk) {
  console.log("\n  PASS  Model called memory_write and file exists on disk.\n");
} else if (writeWorked) {
  console.log("\n  PARTIAL  Model called memory_write but file not found on disk.\n");
} else {
  console.log("\n  FAIL  Model did not call memory_write.\n");
}

// --- Cleanup ---

if (tempDir) {
  await rm(tempDir, { recursive: true, force: true });
  console.log("  (Temp directory cleaned up)");
}

// --- Summary ---

const passed = [readWorked, writeWorked && fileOnDisk].filter(Boolean).length;
const total = 2;

console.log(`\n  Engine check: ${passed}/${total} passed.`);

if (passed < total) {
  process.exit(1);
}

// --- Helpers ---

function logEvent(event: EngineEvent): void {
  switch (event.type) {
    case "text-delta":
      process.stdout.write(event.content);
      break;
    case "tool-call":
      console.log(`  [tool-call] ${event.name}(${JSON.stringify(event.arguments)})`);
      break;
    case "tool-result":
      if (event.error) {
        console.log(`  [tool-result] ERROR: ${event.error}`);
      } else {
        const output = event.output ?? "";
        const preview = output.length > 120 ? output.slice(0, 120) + "..." : output;
        console.log(`  [tool-result] ${preview}`);
      }
      break;
    case "done":
      console.log(`\n  [done] finish_reason=${event.finish_reason}`);
      break;
    case "error":
      console.log(`  [error] ${event.code}: ${event.message}`);
      break;
  }
}
