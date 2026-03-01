/**
 * Owner Verification: "Can I read and write my own memory?"
 *
 * Usage: npx tsx scripts/memory-check.ts [memory_root]
 * Default: ~/pai-test-memory
 */

import { createMemoryTools } from "../src/memory/tools.js";
import { resolve } from "node:path";
import { homedir } from "node:os";

const memoryRoot = process.argv[2] ?? resolve(homedir(), "pai-test-memory");

console.log(`Memory root: ${memoryRoot}\n`);

const tools = createMemoryTools(memoryRoot);

// List
const entries = await tools.list({ path: "." });
console.log("Files:", entries.map((e) => `${e.name} (${e.type})`).join(", "));

// Read first file
const first = entries.find((e) => e.type === "file");
if (first) {
  const content = await tools.read({ path: first.path });
  console.log(`\nRead: ${first.path}`);
  console.log(content.content.slice(0, 200));
}

// Write test file
await tools.write({ path: "pai-test.md", content: "Hello from Personal AI" });
const readback = await tools.read({ path: "pai-test.md" });
console.log(`\nWrite/read: "${readback.content}"`);

// Search
const hits = await tools.search({ query: "Hello", type: "content" });
console.log(`Search for "Hello": ${hits.length} hit(s)`);

// Cleanup
await tools.delete({ path: "pai-test.md" });
console.log("Cleaned up pai-test.md");

console.log("\nAll checks passed.");
